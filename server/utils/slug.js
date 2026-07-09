// server/utils/slug.js
// kebab-case 生成 + 唯一化。
// 注意：唯一化所需的「查库」由调用方注入 exists 函数，避免与 pageRepository 形成循环依赖。

/**
 * 将任意字符串转为 kebab-case（小写、连字符、合并多余符号、去首尾连字符）。
 * 中文等非 ASCII 字母数字字符保留并作为连字符分隔的一部分。
 * @param {string} input
 * @returns {string}
 */
export function toKebabCase(input) {
  if (!input) return ""
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

/**
 * 规范化用户直接提供的 slug：仅保留小写字母、数字与连字符。
 * @param {string} input
 * @returns {string}
 */
export function sanitizeSlug(input) {
  if (!input) return ""
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

/**
 * 在 base 基础上保证 slug 唯一：若已存在则依次追加 -2 / -3 ...
 * @param {string} base 候选 slug（已 kebab 化）
 * @param {(slug: string) => object|null|undefined} exists 查重函数
 * @returns {string} 唯一 slug
 */
export function uniqueSlug(base, exists) {
  const root = base || "page"
  if (!exists(root)) return root
  let n = 2
  while (exists(`${root}-${n}`)) n += 1
  return `${root}-${n}`
}
