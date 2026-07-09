// server/repositories/templateRepository.js
// templates 表的数据访问层（DAL）。所有 SQL 均使用参数绑定，禁止字符串拼接。
// 负责 DB 行（snake_case）与前端对象（camelCase）的双向映射。

import { randomUUID } from "node:crypto"
import { db } from "../db.js"

/**
 * 将 DB 行（snake_case）映射为前端对象（camelCase）。
 * content 以 JSON 文本存储，此处解析为对象返回。
 * @param {object|null} row
 * @returns {object|null}
 */
function rowToTemplate(row) {
  if (!row) return null
  let content = {}
  try {
    content = row.content ? JSON.parse(row.content) : {}
  } catch {
    content = {}
  }
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    content,
    thumbnail: row.thumbnail ?? null,
    category: row.category ?? null,
    isPreset: Boolean(row.is_preset),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  }
}

/**
 * 分页 / 分类筛选列出模板。
 * @param {object} [opts]
 * @param {number} [opts.page=1]
 * @param {number} [opts.limit=10]
 * @param {string} [opts.category]
 * @returns {{ rows: object[], total: number, page: number, limit: number }}
 */
export function list({ page = 1, limit = 10, category } = {}) {
  const safePage = Math.max(1, Math.floor(Number(page) || 1))
  const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit) || 10)))

  const conditions = []
  const params = []
  if (category && typeof category === "string" && category.trim()) {
    conditions.push("category = ?")
    params.push(category.trim())
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  const total =
    db
      .prepare(`SELECT COUNT(*) AS total FROM templates ${where}`)
      .get(...params)?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / safeLimit))
  const effectivePage = safePage > totalPages ? 1 : safePage
  const offset = (effectivePage - 1) * safeLimit

  const rows = db
    .prepare(
      `SELECT * FROM templates ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`
    )
    .all(...params, safeLimit, offset)
    .map(rowToTemplate)

  return { rows, total, page: effectivePage, limit: safeLimit }
}

/**
 * 按 id 获取模板。
 * @param {string} id
 * @returns {object|null}
 */
export function getById(id) {
  return rowToTemplate(
    db.prepare("SELECT * FROM templates WHERE id = ?").get(id)
  )
}

/**
 * 创建模板。
 * @param {object} data
 * @param {string} data.name
 * @param {string} [data.description]
 * @param {object} [data.content]
 * @param {string} [data.thumbnail]
 * @param {string} [data.category]
 * @param {boolean} [data.isPreset]
 * @returns {object}
 */
export function create({
  name,
  description = "",
  content = {},
  thumbnail = null,
  category = null,
  isPreset = false,
}) {
  const id = randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO templates
      (id, name, description, content, thumbnail, category, is_preset, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    name,
    description,
    JSON.stringify(content ?? {}),
    thumbnail,
    category,
    isPreset ? 1 : 0,
    now,
    now
  )
  return getById(id)
}

/**
 * 删除模板。禁止删除预设模板（is_preset=1）。
 * @param {string} id
 * @returns {{ ok: boolean, error?: string }}
 */
export function remove(id) {
  const template = getById(id)
  if (!template) return { ok: false, error: "not_found" }
  if (template.isPreset)
    return { ok: false, error: "preset_cannot_be_deleted" }
  const info = db.prepare("DELETE FROM templates WHERE id = ?").run(id)
  return { ok: info.changes > 0 }
}

/**
 * 将模板内容应用到指定页面。
 * 读取模板的 content，写入目标 page 的 content 字段并更新 updated_at。
 * @param {string} id 模板 id
 * @param {string} pageId 目标页面 id
 * @returns {{ ok: boolean, error?: string }|undefined} 不存在返回 undefined
 */
export function applyToPage(id, pageId) {
  const template = getById(id)
  if (!template) return undefined
  const info = db
    .prepare(
      "UPDATE pages SET content = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL"
    )
    .run(JSON.stringify(template.content), new Date().toISOString(), pageId)
  if (info.changes === 0) return { ok: false, error: "page_not_found" }
  return { ok: true }
}
