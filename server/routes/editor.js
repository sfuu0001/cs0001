// server/routes/editor.js
// 编辑器路由：按 pageId 载入 / 保存 / 公开预览。
// 注意：资源端点用 :id、编辑器端点用 :pageId，二者语义相同（均为 pages.id）。

import express from "express"
import * as repo from "../repositories/pageRepository.js"

const router = express.Router()

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// 空画布兜底
const EMPTY_DATA = { root: { props: {} }, content: [] }

// GET /api/load/:pageId —— 编辑器载入内容（不存在 / 已软删返回 404）
router.get(
  "/load/:pageId",
  asyncHandler(async (req, res) => {
    const page = repo.getById(req.params.pageId)
    if (!page)
      return res
        .status(404)
        .json({ error: "not_found", message: "页面不存在或已删除" })
    res.json({ content: page.content || EMPTY_DATA })
  })
)

// POST /api/save/:pageId —— 保存内容（不发布，仅更新 updated_at）
router.post(
  "/save/:pageId",
  asyncHandler(async (req, res) => {
    const page = repo.getById(req.params.pageId)
    if (!page)
      return res
        .status(404)
        .json({ error: "not_found", message: "页面不存在或已删除" })
    const body = req.body || {}
    if (body.content === undefined) {
      return res
        .status(400)
        .json({ error: "content_required", message: "缺少 content" })
    }
    repo.update(req.params.pageId, { content: body.content })
    res.json({ ok: true })
  })
)

// GET /api/preview/:pageId —— 公开只读预览 + view_count + 1（不存在 / 已软删返回 404）
router.get(
  "/preview/:pageId",
  asyncHandler(async (req, res) => {
    const page = repo.getById(req.params.pageId)
    if (!page)
      return res
        .status(404)
        .json({ error: "not_found", message: "页面不存在或已删除" })
    repo.incrementView(req.params.pageId)
    res.json({ content: page.content || EMPTY_DATA })
  })
)

export default router
