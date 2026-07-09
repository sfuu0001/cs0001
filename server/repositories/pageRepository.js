// server/repositories/pageRepository.js
// pages 表的数据访问层（DAL）。所有 SQL 均使用参数绑定，禁止字符串拼接，杜绝 SQL 注入。
// 负责 DB 行（snake_case, PageRow）与 前端 Page 对象（camelCase）的双向映射。

import { randomUUID } from "node:crypto"
import { db } from "../db.js"
import { uniqueSlug } from "../utils/slug.js"

// 空画布兜底（Puck Data 结构）
export const EMPTY_DATA = { root: { props: {} }, content: [] }

/**
 * 将 DB 行（snake_case）映射为前端 Page 对象（camelCase）。
 * content / metadata 列以 JSON 文本存储，此处解析为对象返回。
 * @param {object|null} row
 * @returns {object|null}
 */
function rowToPage(row) {
  if (!row) return null
  let content = EMPTY_DATA
  try {
    content = row.content ? JSON.parse(row.content) : EMPTY_DATA
  } catch {
    content = EMPTY_DATA
  }
  let metadata = {}
  try {
    metadata = row.metadata ? JSON.parse(row.metadata) : {}
  } catch {
    metadata = {}
  }
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    content,
    status: row.status,
    viewCount: Number(row.view_count) || 0,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    publishedAt: row.published_at ?? null,
    deletedAt: row.deleted_at ?? null,
    metadata,
  }
}

/**
 * 分页 / 筛选列出页面（默认排除软删）。
 * 越界 page 回退为 1；limit 默认 10、上限 100。
 * @param {object} [opts]
 * @param {number} [opts.page=1]
 * @param {number} [opts.limit=10]
 * @param {string} [opts.status]
 * @param {string} [opts.search]
 * @param {boolean} [opts.deleted=false] true 时仅返回已软删（回收站）
 * @returns {{ rows: object[], total: number, page: number, limit: number }}
 */
export function list({ page = 1, limit = 10, status, search, deleted = false } = {}) {
  const safePage = Math.max(1, Math.floor(Number(page) || 1))
  const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit) || 10)))

  const conditions = []
  const params = []
  // 软删过滤：默认仅未删除；deleted=true 时仅已删除
  conditions.push(deleted ? "deleted_at IS NOT NULL" : "deleted_at IS NULL")
  if (status && typeof status === "string" && status.trim()) {
    conditions.push("status = ?")
    params.push(status.trim())
  }
  if (search && typeof search === "string" && search.trim()) {
    const like = `%${search.trim()}%`
    conditions.push("(title LIKE ? OR description LIKE ? OR slug LIKE ?)")
    params.push(like, like, like)
  }

  const where = `WHERE ${conditions.join(" AND ")}`
  const total =
    db.prepare(`SELECT COUNT(*) AS total FROM pages ${where}`).get(...params).total ||
    0
  const totalPages = Math.max(1, Math.ceil(total / safeLimit))
  // 越界回退
  const effectivePage = safePage > totalPages ? 1 : safePage
  const offset = (effectivePage - 1) * safeLimit

  const rows = db
    .prepare(
      `SELECT * FROM pages ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`
    )
    .all(...params, safeLimit, offset)
    .map(rowToPage)

  return { rows, total, page: effectivePage, limit: safeLimit }
}

/**
 * 按 id 获取页面（默认排除软删）。
 * @param {string} id
 * @param {object} [opts]
 * @param {boolean} [opts.includeDeleted=false]
 * @returns {object|null}
 */
export function getById(id, { includeDeleted = false } = {}) {
  const sql = includeDeleted
    ? "SELECT * FROM pages WHERE id = ?"
    : "SELECT * FROM pages WHERE id = ? AND deleted_at IS NULL"
  return rowToPage(db.prepare(sql).get(id))
}

/**
 * 按 slug 获取页面（排除软删）。
 * @param {string} slug
 * @returns {object|null}
 */
export function findBySlug(slug) {
  return rowToPage(
    db
      .prepare("SELECT * FROM pages WHERE slug = ? AND deleted_at IS NULL")
      .get(slug)
  )
}

/**
 * 创建草稿页面。
 * @param {object} data
 * @returns {object}
 */
export function create({
  title,
  slug,
  description = "",
  content,
  metadata = {},
  status = "draft",
}) {
  const id = randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO pages
      (id, title, slug, description, content, status, view_count, created_at, updated_at, published_at, deleted_at, metadata)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, NULL, NULL, ?)`
  ).run(
    id,
    title,
    slug,
    description,
    JSON.stringify(content ?? EMPTY_DATA),
    status,
    now,
    now,
    JSON.stringify(metadata ?? {})
  )
  return getById(id)
}

/**
 * 局部更新页面，并刷新 updated_at。
 * @param {string} id
 * @param {object} patch 允许的字段：title/description/content/status/publishedAt/slug/metadata
 * @returns {object|undefined} 更新后的页面；不存在返回 undefined
 */
export function update(id, patch = {}) {
  const sets = []
  const params = []
  if (patch.title !== undefined) {
    sets.push("title = ?")
    params.push(patch.title)
  }
  if (patch.description !== undefined) {
    sets.push("description = ?")
    params.push(patch.description)
  }
  if (patch.content !== undefined) {
    sets.push("content = ?")
    params.push(JSON.stringify(patch.content))
  }
  if (patch.status !== undefined) {
    sets.push("status = ?")
    params.push(patch.status)
  }
  if (patch.publishedAt !== undefined) {
    sets.push("published_at = ?")
    params.push(patch.publishedAt)
  }
  if (patch.slug !== undefined) {
    sets.push("slug = ?")
    params.push(patch.slug)
  }
  if (patch.metadata !== undefined) {
    sets.push("metadata = ?")
    params.push(JSON.stringify(patch.metadata))
  }
  if (sets.length === 0) return getById(id)

  sets.push("updated_at = ?")
  params.push(new Date().toISOString())
  params.push(id)

  const info = db
    .prepare(
      `UPDATE pages SET ${sets.join(", ")} WHERE id = ? AND deleted_at IS NULL`
    )
    .run(...params)
  if (info.changes === 0) return undefined
  return getById(id)
}

/**
 * 软删除（置 deleted_at = NOW）。
 * @param {string} id
 * @returns {boolean} 是否成功（影响行数 > 0）
 */
export function softDelete(id) {
  const info = db
    .prepare(
      "UPDATE pages SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL"
    )
    .run(new Date().toISOString(), new Date().toISOString(), id)
  return info.changes > 0
}

/**
 * 恢复软删（置 deleted_at = NULL）。
 * @param {string} id
 * @returns {boolean}
 */
export function restore(id) {
  const info = db
    .prepare(
      "UPDATE pages SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL"
    )
    .run(new Date().toISOString(), id)
  return info.changes > 0
}

/**
 * 复制页面：新 id + 标题追加「 副本」+ 新唯一 slug，状态重置为 draft。
 * @param {string} id
 * @returns {object|undefined}
 */
export function duplicate(id) {
  const source = getById(id)
  if (!source) return undefined
  const newId = randomUUID()
  const now = new Date().toISOString()
  const newSlug = uniqueSlug(`${source.slug}-copy`, (s) => findBySlug(s))
  db.prepare(
    `INSERT INTO pages
      (id, title, slug, description, content, status, view_count, created_at, updated_at, published_at, deleted_at, metadata)
     VALUES (?, ?, ?, ?, ?, 'draft', 0, ?, ?, NULL, NULL, ?)`
  ).run(
    newId,
    `${source.title} 副本`,
    newSlug,
    source.description,
    JSON.stringify(source.content ?? EMPTY_DATA),
    now,
    now,
    JSON.stringify(source.metadata ?? {})
  )
  return getById(newId)
}

/**
 * 预览时浏览量 +1。
 * @param {string} id
 */
export function incrementView(id) {
  db.prepare(
    "UPDATE pages SET view_count = view_count + 1 WHERE id = ? AND deleted_at IS NULL"
  ).run(id)
}
