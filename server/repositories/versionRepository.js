// server/repositories/versionRepository.js
// page_versions 表的数据访问层。

import { randomUUID } from "node:crypto"
import { db } from "../db.js"

/**
 * 创建新版本：自动计算版本号（+1）。
 * @param {string} pageId
 * @param {object} content - Puck Data
 * @param {string|null} createdBy - 用户 ID
 * @returns {object}
 */
export function create(pageId, content, createdBy = null) {
  // 获取当前最大版本号
  const maxRow = db
    .prepare(
      "SELECT COALESCE(MAX(version), 0) AS maxVer FROM page_versions WHERE page_id = ?"
    )
    .get(pageId)
  const version = (maxRow?.maxVer || 0) + 1

  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO page_versions (id, page_id, content, version, created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, pageId, JSON.stringify(content), version, now, createdBy)

  return { id, pageId, content, version, createdAt: now, createdBy }
}

/**
 * 获取某页面的版本列表（按版本号降序）。
 * @param {string} pageId
 * @param {number} [limit=50]
 * @returns {object[]}
 */
export function list(pageId, limit = 50) {
  const safeLimit = Math.min(200, Math.max(1, Math.floor(Number(limit) || 50)))
  const rows = db
    .prepare(
      `SELECT id, page_id, version, created_at, created_by
       FROM page_versions
       WHERE page_id = ?
       ORDER BY version DESC
       LIMIT ?`
    )
    .all(pageId, safeLimit)

  return rows.map((r) => ({
    id: r.id,
    pageId: r.page_id,
    version: r.version,
    createdAt: r.created_at,
    createdBy: r.created_by,
  }))
}

/**
 * 按版本 ID 获取版本详情（含 content）。
 * @param {string} id
 * @returns {object|null}
 */
export function getById(id) {
  const row = db.prepare("SELECT * FROM page_versions WHERE id = ?").get(id)
  if (!row) return null

  let content = {}
  try {
    content = row.content ? JSON.parse(row.content) : {}
  } catch {
    content = {}
  }

  return {
    id: row.id,
    pageId: row.page_id,
    content,
    version: row.version,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }
}

/**
 * 恢复指定版本：将版本 content 写入 pages 表。
 * @param {string} pageId
 * @param {string} versionId
 * @returns {object|null} 恢复后的版本数据，失败返回 null
 */
export function restore(pageId, versionId) {
  const versionData = getById(versionId)
  if (!versionData || versionData.pageId !== pageId) return null

  // 将 content 写回 pages 表
  const now = new Date().toISOString()
  db.prepare(
    "UPDATE pages SET content = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL"
  ).run(JSON.stringify(versionData.content), now, pageId)

  return versionData
}
