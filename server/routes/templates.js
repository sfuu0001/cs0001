// server/routes/templates.js
// 模板管理 API 路由。
// 端点：列表 / 创建 / 详情 / 删除 / 应用到页面。
// Express 5 不会自动捕获 async 路由的 rejection，统一用 asyncHandler 将错误转发到错误中间件。

import express from "express"
import * as repo from "../repositories/templateRepository.js"

const router = express.Router()

// Express 5：async 路由里的异常需显式转发给错误处理中间件
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// GET /api/templates —— 列表（分页 / 分类筛选）
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Number.parseInt(req.query.page, 10)
    const limit = Number.parseInt(req.query.limit, 10)
    const category =
      typeof req.query.category === "string" ? req.query.category : undefined

    const result = repo.list({ page, limit, category })
    res.json({
      data: result.rows,
      total: result.total,
      page: result.page,
      limit: result.limit,
    })
  })
)

// POST /api/templates —— 创建模板
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = req.body || {}
    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (!name) {
      return res
        .status(400)
        .json({ error: "name_required", message: "模板名称不能为空" })
    }
    const template = repo.create({
      name,
      description: typeof body.description === "string" ? body.description : "",
      content:
        body.content && typeof body.content === "object" ? body.content : {},
      category: typeof body.category === "string" ? body.category : null,
    })
    res.status(201).json({ template })
  })
)

// GET /api/templates/:id —— 详情
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const template = repo.getById(req.params.id)
    if (!template)
      return res
        .status(404)
        .json({ error: "not_found", message: "模板不存在" })
    res.json({ template })
  })
)

// DELETE /api/templates/:id —— 删除（预设不可删）
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = repo.remove(req.params.id)
    if (!result.ok && result.error === "not_found") {
      return res
        .status(404)
        .json({ error: "not_found", message: "模板不存在" })
    }
    if (!result.ok && result.error === "preset_cannot_be_deleted") {
      return res
        .status(400)
        .json({
          error: "preset_cannot_be_deleted",
          message: "预设模板不可删除",
        })
    }
    res.json({ ok: true })
  })
)

// POST /api/templates/:id/apply —— 应用到页面
router.post(
  "/:id/apply",
  asyncHandler(async (req, res) => {
    const body = req.body || {}
    const pageId = typeof body.pageId === "string" ? body.pageId : ""
    if (!pageId) {
      return res
        .status(400)
        .json({ error: "pageId_required", message: "缺少 pageId" })
    }

    const template = repo.getById(req.params.id)
    if (!template) {
      return res
        .status(404)
        .json({ error: "not_found", message: "模板不存在" })
    }

    const result = repo.applyToPage(req.params.id, pageId)
    if (!result) {
      return res.status(404).json({
        error: "template_not_found",
        message: "模板不存在",
      })
    }
    if (!result.ok && result.error === "page_not_found") {
      return res
        .status(404)
        .json({ error: "page_not_found", message: "页面不存在" })
    }
    res.json({ ok: true })
  })
)

export default router
