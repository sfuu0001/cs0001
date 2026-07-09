// server/routes/submissions.js
// 表单数据收集路由。

import express from "express"
import { randomUUID } from "node:crypto"
import { db } from "../db.js"

const router = express.Router()

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// POST /api/submissions — 保存表单提交
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { pageId, formConfig, data } = req.body || {}

    if (!pageId || !data) {
      return res.status(400).json({
        error: "missing_fields",
        message: "缺少必要字段：pageId, data",
      })
    }

    const id = randomUUID()
    const now = new Date().toISOString()
    const ip = req.ip || req.socket?.remoteAddress || ""

    db.prepare(
      `INSERT INTO form_submissions (id, page_id, form_config, data, created_at, ip)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      pageId,
      JSON.stringify(formConfig || {}),
      JSON.stringify(data),
      now,
      ip
    )

    res.status(201).json({ id, createdAt: now })
  })
)

// GET /api/submissions?pageId=xxx — 查询表单提交
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const pageId = typeof req.query.pageId === "string" ? req.query.pageId : ""

    if (!pageId) {
      return res.status(400).json({
        error: "missing_pageId",
        message: "缺少 pageId 参数",
      })
    }

    const rows = db
      .prepare(
        `SELECT id, page_id, form_config, data, created_at, ip
         FROM form_submissions
         WHERE page_id = ?
         ORDER BY created_at DESC`
      )
      .all(pageId)

    const submissions = rows.map((r) => {
      let formConfig = {}
      let data = {}
      try {
        formConfig = r.form_config ? JSON.parse(r.form_config) : {}
      } catch {
        formConfig = {}
      }
      try {
        data = r.data ? JSON.parse(r.data) : {}
      } catch {
        data = {}
      }
      return {
        id: r.id,
        pageId: r.page_id,
        formConfig,
        data,
        createdAt: r.created_at,
        ip: r.ip,
      }
    })

    res.json({ data: submissions })
  })
)

export default router
