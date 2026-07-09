// src/lib/component-scanner/types.ts
// 接口定义：扫描配置、扫描结果、属性定义

export interface ScannerConfig {
  scanDirs: string[]
  excludePatterns: string[]
}

export interface PluginOptions {
  /** 自定义扫描目录，默认 ['src/components', 'src/ui'] */
  scanDirs?: string[]
  /** 排除模式，默认 ['**\/__tests__/**', '**\/*.stories.*'] */
  excludePatterns?: string[]
  /** pageforge.config.ts 路径（相对于项目根），默认 'pageforge.config.ts' */
  configPath?: string
}

export interface ScannedComponent {
  name: string
  filePath: string
  props: PropDef[]
  defaultProps: Record<string, unknown>
}

export interface PropDef {
  name: string
  type: "string" | "number" | "boolean" | "select" | "object" | "array" | "unknown"
  required: boolean
  defaultValue?: unknown
  description?: string
  options?: string[]
}

export interface CacheEntry {
  version: number
  generatedAt: string
  fileHashes: Record<string, string>
  components: ScannedComponent[]
}

export const CACHE_VERSION = 1
export const CACHE_FILE = ".pageforge-cache/components.json"
export const REGISTRY_FILE = "src/.pageforge/registry.ts"
export const DEFAULT_SCAN_DIRS = ["src/components", "src/ui"]
export const DEFAULT_EXCLUDE_PATTERNS = ["**/__tests__/**", "**/*.stories.*", "**/*.test.*", "**/*.spec.*"]
