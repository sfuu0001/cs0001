// server/repositories/mediaRepository.js
// media 表的数据访问层（DAL）。所有 SQL 均使用参数绑定，禁止字符串拼接。
// 负责 DB 行（snake_case）与前端对象（camelCase）的双向映射。

import { randomUUID } from "node:crypto"
import fs from "node:fs"
import { db } from "../db.js"

/**
 * 将 DB 行（snake_case）映射为前端对象（camelCase）。
 * tags 以 JSON 文本存储，此处解析为数组返回。
 * @param {object|null} row
 * @returns {object|null}
 */
function rowToMedia(row) {
  if (!row) return null
  let tags = []
  try {
    tags = row.tags ? JSON.parse(row.tags) : []
  } catch {
    tags = []
  }
  return {
    id: row.id,
    filename: row.filename,
    originalName: row.original_name ?? "",
    path: row.path ?? "",
    url: row.url ?? "",
    mimeType: row.mime_type ?? "",
    size: Number(row.size) || 0,
    width: Number(row.width) || 0,
    height: Number(row.height) || 0,
    alt: row.alt ?? "",
    tags,
    createdAt: row.created_at ?? null,
    uploadedBy: row.uploaded_by ?? null,
  }
}

/**
 * 分页 / 搜索 / MIME 筛选列出媒体。
 * @param {object} [opts]
 * @param {number} [opts.page=1]
 * @param {number} [opts.limit=10]
 * @param {string} [opts.search]
 * @param {string} [opts.mimeType]
 * @returns {{ rows: object[], total: number, page: number, limit: number }}
 */
export function list({ page = 1, limit = 10, search, mimeType } = {}) {
  const safePage = Math.max(1, Math.floor(Number(page) || 1))
  const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit) || 10)))

  const conditions = []
  const params = []
  if (search && typeof search === "string" && search.trim()) {
    const like = `%${search.trim()}%`
    conditions.push("(filename LIKE ? OR original_name LIKE ? OR alt LIKE ?)")
    params.push(like, like, like)
  }
  if (mimeType && typeof mimeType === "string" && mimeType.trim()) {
    conditions.push("mime_type LIKE ?")
    params.push(`${mimeType.trim()}%`)
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  const total =
    db.prepare(`SELECT COUNT(*) AS total FROM media ${where}`).get(...params)
      ?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / safeLimit))
  const effectivePage = safePage > totalPages ? 1 : safePage
  const offset = (effectivePage - 1) * safeLimit

  const rows = db
    .prepare(
      `SELECT * FROM media ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...params, safeLimit, offset)
    .map(rowToMedia)

  return { rows, total, page: effectivePage, limit: safeLimit }
}

/**
 * 按 id 获取媒体记录。
 * @param {string} id
 * @returns {object|null}
 */
export function getById(id) {
  return rowToMedia(db.prepare("SELECT * FROM media WHERE id = ?").get(id))
}

/**
 * 创建媒体记录（含文件路径信息）。
 * @param {object} data
 * @param {string} data.filename
 * @param {string} [data.originalName]
 * @param {string} [data.path]
 * @param {string} [data.url]
 * @param {string} [data.mimeType]
 * @param {number} [data.size]
 * @param {number} [data.width]
 * @param {number} [data.height]
 * @param {string} [data.alt]
 * @param {string[]} [data.tags]
 * @param {string} [data.uploadedBy]
 * @returns {object}
 */
export function create({
  filename,
  originalName = "",
  path: filePath = "",
  url = "",
  mimeType = "",
  size = 0,
  width = 0,
  height = 0,
  alt = "",
  tags = [],
  uploadedBy = null,
}) {
  const id = randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO media
      (id, filename, original_name, path, url, mime_type, size, width, height, alt, tags, created_at, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    filename,
    originalName,
    filePath,
    url,
    mimeType,
    size,
    width,
    height,
    alt,
    JSON.stringify(tags ?? []),
    now,
    uploadedBy
  )
  return getById(id)
}

/**
 * 更新媒体元数据（alt / tags）。
 * @param {string} id
 * @param {object} patch
 * @param {string} [patch.alt]
 * @param {string[]} [patch.tags]
 * @returns {object|undefined}
 */
export function updateMetadata(id, patch = {}) {
  const sets = []
  const params = []
  if (patch.alt !== undefined) {
    sets.push("alt = ?")
    params.push(patch.alt)
  }
  if (patch.tags !== undefined) {
    sets.push("tags = ?")
    params.push(JSON.stringify(patch.tags))
  }
  if (sets.length === 0) return getById(id)

  params.push(id)
  const info = db
    .prepare(`UPDATE media SET ${sets.join(", ")} WHERE id = ?`)
    .run(...params)
  if (info.changes === 0) return undefined
  return getById(id)
}

/**
 * 删除媒体记录（物理删除文件 + 删除记录）。
 * @param {string} id
 * @returns {{ ok: boolean, error?: string }}
 */
export function remove(id) {
  const media = getById(id)
  if (!media) return { ok: false, error: "not_found" }
  // 物理删除文件
  if (media.path && fs.existsSync(media.path)) {
    try {
      fs.unlinkSync(media.path)
    } catch {
      // 文件删除失败不阻塞记录删除
    }
  }
  const info = db.prepare("DELETE FROM media WHERE id = ?").run(id)
  return { ok: info.changes > 0 }
}

/**
 * 批量创建媒体记录。
 * @param {object[]} items 每个元素同 create 参数
 * @returns {object[]}
 */
export function batchCreate(items = []) {
  return items.map((item) => create(item))
}

/**
 * 快捷记录上传文件信息（上传场景的简便方法）。
 * @param {string} filename
 * @param {string} originalName
 * @param {string} mimeType
 * @param {number} size
 * @param {string} [alt]
 * @param {string[]} [tags]
 * @param {number} [width]
 * @param {number} [height]
 * @param {string} [uploadedBy]
 * @returns {object}
 */
export function recordFile({
  filename,
  originalName,
  mimeType,
  size,
  alt = "",
  tags = [],
  width = 0,
  height = 0,
  uploadedBy = null,
}) {
  return create({
    filename,
    originalName,
    path: "",
    url: "",
    mimeType,
    size,
    width,
    height,
    alt,
    tags,
    uploadedBy,
  })
}
