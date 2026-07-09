// src/lib/component-scanner/index.ts
// 主入口：协调扫描流程、缓存管理与 Registry 生成

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs"
import { createHash } from "node:crypto"
import { resolve, relative, join, dirname } from "node:path"
import { createTsProject, parseComponentFile } from "./ts-prop-parser"
import { generateRegistryFileContent } from "./puck-adapter"
import type { ScannerConfig, ScannedComponent, CacheEntry } from "./types"
import {
  CACHE_VERSION,
  CACHE_FILE,
  REGISTRY_FILE,
  DEFAULT_SCAN_DIRS,
  DEFAULT_EXCLUDE_PATTERNS,
} from "./types"

/** 匹配排除模式 */
function matchesExclude(filePath: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    // 简化 glob 匹配：将 ** 转换为通配符
    const regexStr = pattern
      .replace(/\*\*/g, "(.+)")
      .replace(/\*/g, "([^/]+)")
      .replace(/\./g, "\\.")
    try {
      const regex = new RegExp(`^${regexStr}$`)
      if (regex.test(filePath)) return true
    } catch {
      // 正则无效，跳过
    }
  }
  return false
}

/** 递归扫描目录，收集 .tsx 文件 */
function collectTsxFiles(
  dirPath: string,
  basePath: string,
  excludePatterns: string[],
): string[] {
  const results: string[] = []
  if (!existsSync(dirPath)) return results

  const entries = readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name)
    const relativePath = relative(basePath, fullPath).replace(/\\/g, "/")

    if (matchesExclude(relativePath, excludePatterns)) continue

    if (entry.isDirectory()) {
      // 跳过 node_modules 和隐藏目录
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue
      results.push(...collectTsxFiles(fullPath, basePath, excludePatterns))
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      results.push(fullPath)
    }
  }

  return results
}

/** 计算文件的 MD5 哈希 */
function computeFileHash(filePath: string): string {
  const content = readFileSync(filePath)
  return createHash("md5").update(content).digest("hex")
}

/** 读取缓存 */
function loadCache(cachePath: string): CacheEntry | null {
  try {
    if (!existsSync(cachePath)) return null
    const raw = readFileSync(cachePath, "utf-8")
    const cache = JSON.parse(raw) as CacheEntry
    if (cache.version !== CACHE_VERSION) return null
    return cache
  } catch {
    return null
  }
}

/** 保存缓存 */
function saveCache(cachePath: string, cacheDir: string, entry: CacheEntry): void {
  try {
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true })
    }
    writeFileSync(cachePath, JSON.stringify(entry, null, 2), "utf-8")
  } catch {
    // 缓存写入失败不阻塞主流程
  }
}

/** 读取 pageforge.config.ts（使用 ts-morph 或简单的文本解析） */
function loadScannerConfig(
  configPath: string,
  options?: { scanDirs?: string[]; excludePatterns?: string[] },
): ScannerConfig {
  // 如果插件传入了配置，优先使用
  if (options?.scanDirs || options?.excludePatterns) {
    return {
      scanDirs: options.scanDirs ?? DEFAULT_SCAN_DIRS,
      excludePatterns: options.excludePatterns ?? DEFAULT_EXCLUDE_PATTERNS,
    }
  }

  // 尝试从 pageforge.config.ts 读取
  try {
    if (!existsSync(configPath)) {
      return {
        scanDirs: DEFAULT_SCAN_DIRS,
        excludePatterns: DEFAULT_EXCLUDE_PATTERNS,
      }
    }

    // 简单文本扫描提取 scanner 配置
    const content = readFileSync(configPath, "utf-8")
    const scanDirsMatch = content.match(/scanDirs\s*:\s*\[([^\]]*)\]/)
    const excludeMatch = content.match(/excludePatterns\s*:\s*\[([^\]]*)\]/)

    const scanDirs = scanDirsMatch
      ? scanDirsMatch[1]
          .split(",")
          .map((s) => s.trim().replace(/['"]/g, ""))
          .filter(Boolean)
      : DEFAULT_SCAN_DIRS

    const excludePatterns = excludeMatch
      ? excludeMatch[1]
          .split(",")
          .map((s) => s.trim().replace(/['"]/g, ""))
          .filter(Boolean)
      : DEFAULT_EXCLUDE_PATTERNS

    return { scanDirs, excludePatterns }
  } catch {
    return {
      scanDirs: DEFAULT_SCAN_DIRS,
      excludePatterns: DEFAULT_EXCLUDE_PATTERNS,
    }
  }
}

/** 扫描结果 */
export interface ScanResult {
  components: ScannedComponent[]
  warnings: string[]
}

/**
 * 执行组件扫描主流程
 * @param projectRoot 项目根目录绝对路径
 * @param options 插件选项
 * @returns 扫描结果
 */
export function scanComponents(
  projectRoot: string,
  options?: { scanDirs?: string[]; excludePatterns?: string[] },
): ScanResult {
  const warnings: string[] = []
  const configPath = resolve(projectRoot, "pageforge.config.ts")
  const config = loadScannerConfig(configPath, options)
  const cacheDir = resolve(projectRoot, ".pageforge-cache")
  const cachePath = resolve(projectRoot, CACHE_FILE)
  const registryPath = resolve(projectRoot, REGISTRY_FILE)

  // 收集所有要扫描的文件
  const allFiles: string[] = []
  for (const dir of config.scanDirs) {
    const absDir = resolve(projectRoot, dir)
    if (!existsSync(absDir)) {
      warnings.push(`扫描目录不存在，已跳过: ${dir}`)
      continue
    }
    const files = collectTsxFiles(absDir, projectRoot, config.excludePatterns)
    allFiles.push(...files)
  }

  if (allFiles.length === 0) {
    warnings.push("未找到可扫描的 .tsx 组件文件")
    // 生成空 registry
    writeRegistryFile(registryPath, [], cacheDir)
    return { components: [], warnings }
  }

  // 计算文件哈希
  const currentHashes: Record<string, string> = {}
  for (const filePath of allFiles) {
    const relPath = relative(projectRoot, filePath).replace(/\\/g, "/")
    currentHashes[relPath] = computeFileHash(filePath)
  }

  // 检查缓存是否命中
  const cache = loadCache(cachePath)
  if (cache) {
    let cacheValid = true
    for (const [relPath, hash] of Object.entries(currentHashes)) {
      if (cache.fileHashes[relPath] !== hash) {
        cacheValid = false
        break
      }
    }
    if (cacheValid) {
      // 缓存命中，从缓存加载
      writeRegistryFile(registryPath, cache.components, cacheDir)
      return { components: cache.components, warnings }
    }
  }

  // 缓存未命中，执行扫描
  const components: ScannedComponent[] = []
  const tsProject = createTsProject()

  for (const filePath of allFiles) {
    const relPath = relative(projectRoot, filePath).replace(/\\/g, "/")
    const name = filePath
      .replace(/\\/g, "/")
      .split("/")
      .pop()
      ?.replace(/\.tsx$/, "") ?? "Unknown"

    const result = parseComponentFile(filePath, tsProject)
    if (result === null) {
      warnings.push(`文件语法错误或无法解析，已跳过: ${relPath}`)
      continue
    }

    components.push({
      name,
      filePath: relPath,
      props: result.props,
      defaultProps: result.defaultProps,
    })
  }

  if (components.length === 0) {
    warnings.push("所有扫描的文件均未包含有效的默认导出组件")
  }

  // 写入缓存
  const cacheEntry: CacheEntry = {
    version: CACHE_VERSION,
    generatedAt: new Date().toISOString(),
    fileHashes: currentHashes,
    components,
  }
  saveCache(cachePath, cacheDir, cacheEntry)

  // 生成 registry 文件
  writeRegistryFile(registryPath, components, cacheDir)

  return { components, warnings }
}

/** 写入 registry 文件 */
function writeRegistryFile(
  registryPath: string,
  components: ScannedComponent[],
  _cacheDir: string,
): void {
  try {
    const parentDir = dirname(registryPath)
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true })
    }
    const content = generateRegistryFileContent(components)
    writeFileSync(registryPath, content, "utf-8")
  } catch (err) {
    // registry 写入失败
    console.warn("[component-scanner] 写入 registry 文件失败:", err)
  }
}
