// server/services/fileStorageService.js
// 职责：将页面数据写入文件系统，生成 .tsx 文件。
// 写入失败时 console.error 但不抛异常（不阻塞主流程）。

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { generateComponent } from "../utils/codegen.js"
import { toKebabCase } from "../utils/slug.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// pages/ 目录位于项目根目录（server/../），可被 git 追踪
const PAGES_DIR = path.resolve(__dirname, "..", "..", "pages")

/**
 * 从 page 对象生成 url-safe 文件名。
 * 优先使用 slug（经 kebab-case 处理），slug 为空时回退到 id。
 * @param {{ id: string, slug?: string }} page
 * @returns {string}
 */
function buildFilename(page) {
  const raw = (page.slug && page.slug.trim()) || page.id
  const safe = toKebabCase(raw)
  // 如果 slug 经过 kebab-case 后为空（极罕见情况），回退到 id
  const name = safe || page.id || "untitled"
  return `${name}.page.tsx`
}

/**
 * 将页面数据写入 filesystem。
 * 1. 从 slug 生成 url-safe 文件名（空则用 id）
 * 2. 调用 codegen generateComponent(page.content) 生成 .tsx 字符串
 * 3. 写入 pages/<filename>.page.tsx
 * 4. 确保 pages/ 目录存在，不存在则创建
 * 5. 写入失败时 console.error 但不抛异常（不阻塞主流程）
 *
 * @param {object} page - 完整 page 对象，需包含 { id, slug?, content }
 */
export function savePageFile(page) {
  // 没有 content 时跳过文件写入
  if (!page || !page.content) {
    return
  }

  try {
    // 确保 pages/ 目录存在
    fs.mkdirSync(PAGES_DIR, { recursive: true })

    const filename = buildFilename(page)
    const filePath = path.join(PAGES_DIR, filename)

    // 调用 codegen 生成 .tsx 源码
    const tsxSource = generateComponent(page.content, {
      componentName: page.title
        ? page.title
            .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "")
            .replace(/\s+/g, "")
            .replace(/^[0-9]/, "_") || "GeneratedPage"
        : "GeneratedPage",
    })

    // 覆盖写入（不做增量/diff）
    fs.writeFileSync(filePath, tsxSource, "utf-8")

    console.log(`[fileStorage] page ${page.id} written to ${filename}`)
  } catch (err) {
    // 写入失败不抛异常 — 不阻塞主流程
    console.error(`[fileStorage] failed to write page ${page.id} to file:`, err.message)
  }
}
