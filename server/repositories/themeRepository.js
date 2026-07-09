// server/repositories/themeRepository.js
// themes 表的数据访问层（DAL）。所有 SQL 均使用参数绑定，禁止字符串拼接。
// 负责 DB 行（snake_case）与前端对象（camelCase）的双向映射。

import { randomUUID } from "node:crypto"
import { db } from "../db.js"

/**
 * 将 DB 行（snake_case）映射为前端对象（camelCase）。
 * variables 以 JSON 文本存储，此处解析为对象返回。
 * @param {object|null} row
 * @returns {object|null}
 */
function rowToTheme(row) {
  if (!row) return null
  let variables = {}
  try {
    variables = row.variables ? JSON.parse(row.variables) : {}
  } catch {
    variables = {}
  }
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    variables,
    isPreset: Boolean(row.is_preset),
    previewImage: row.preview_image ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  }
}

/**
 * 分页 / 搜索列出主题。
 * @param {object} [opts]
 * @param {number} [opts.page=1]
 * @param {number} [opts.limit=10]
 * @param {string} [opts.search]
 * @returns {{ rows: object[], total: number, page: number, limit: number }}
 */
export function list({ page = 1, limit = 10, search } = {}) {
  const safePage = Math.max(1, Math.floor(Number(page) || 1))
  const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit) || 10)))

  const conditions = []
  const params = []
  if (search && typeof search === "string" && search.trim()) {
    const like = `%${search.trim()}%`
    conditions.push("(name LIKE ? OR description LIKE ?)")
    params.push(like, like)
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  const total =
    db.prepare(`SELECT COUNT(*) AS total FROM themes ${where}`).get(...params)
      ?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / safeLimit))
  const effectivePage = safePage > totalPages ? 1 : safePage
  const offset = (effectivePage - 1) * safeLimit

  const rows = db
    .prepare(
      `SELECT * FROM themes ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`
    )
    .all(...params, safeLimit, offset)
    .map(rowToTheme)

  return { rows, total, page: effectivePage, limit: safeLimit }
}

/**
 * 按 id 获取主题。
 * @param {string} id
 * @returns {object|null}
 */
export function getById(id) {
  return rowToTheme(db.prepare("SELECT * FROM themes WHERE id = ?").get(id))
}

/**
 * 按 slug 名称关键字查找（按 name 精确匹配）。
 * @param {string} name
 * @returns {object|null}
 */
export function findByName(name) {
  return rowToTheme(
    db.prepare("SELECT * FROM themes WHERE name = ?").get(name)
  )
}

/**
 * 获取所有预设主题。
 * @returns {object[]}
 */
export function findPresets() {
  return db
    .prepare("SELECT * FROM themes WHERE is_preset = 1 ORDER BY name ASC")
    .all()
    .map(rowToTheme)
}

/**
 * 创建主题。
 * @param {object} data
 * @param {string} data.name
 * @param {string} [data.description]
 * @param {object} [data.variables]
 * @param {boolean} [data.isPreset]
 * @param {string} [data.previewImage]
 * @returns {object}
 */
export function create({
  name,
  description = "",
  variables = {},
  isPreset = false,
  previewImage = null,
}) {
  const id = randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO themes
      (id, name, description, variables, is_preset, preview_image, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    name,
    description,
    JSON.stringify(variables ?? {}),
    isPreset ? 1 : 0,
    previewImage,
    now,
    now
  )
  return getById(id)
}

/**
 * 局部更新主题，并刷新 updated_at。
 * @param {string} id
 * @param {object} patch 允许字段：name/description/variables/previewImage
 * @returns {object|undefined}
 */
export function update(id, patch = {}) {
  const sets = []
  const params = []
  if (patch.name !== undefined) {
    sets.push("name = ?")
    params.push(patch.name)
  }
  if (patch.description !== undefined) {
    sets.push("description = ?")
    params.push(patch.description)
  }
  if (patch.variables !== undefined) {
    sets.push("variables = ?")
    params.push(JSON.stringify(patch.variables))
  }
  if (patch.previewImage !== undefined) {
    sets.push("preview_image = ?")
    params.push(patch.previewImage)
  }
  if (sets.length === 0) return getById(id)

  sets.push("updated_at = ?")
  params.push(new Date().toISOString())
  params.push(id)

  const info = db
    .prepare(`UPDATE themes SET ${sets.join(", ")} WHERE id = ?`)
    .run(...params)
  if (info.changes === 0) return undefined
  return getById(id)
}

/**
 * 删除主题。禁止删除预设主题（is_preset=1）。
 * @param {string} id
 * @returns {{ ok: boolean, error?: string }}
 */
export function remove(id) {
  const theme = getById(id)
  if (!theme) return { ok: false, error: "not_found" }
  if (theme.isPreset) return { ok: false, error: "preset_cannot_be_deleted" }
  const info = db.prepare("DELETE FROM themes WHERE id = ?").run(id)
  return { ok: info.changes > 0 }
}
