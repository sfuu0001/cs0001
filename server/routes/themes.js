// server/routes/themes.js
// 主题管理 API 路由。
// 端点：列表 / 创建 / 详情 / 更新 / 删除 / 导入 / 导出 / 应用到页面。
// Express 5 不会自动捕获 async 路由的 rejection，统一用 asyncHandler 将错误转发到错误中间件。

import express from "express"
import * as repo from "../repositories/themeRepository.js"

const router = express.Router()

// Express 5：async 路由里的异常需显式转发给错误处理中间件
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// GET /api/themes —— 列表（分页 / 搜索）
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Number.parseInt(req.query.page, 10)
    const limit = Number.parseInt(req.query.limit, 10)
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined

    const result = repo.list({ page, limit, search })
    res.json({
      data: result.rows,
      total: result.total,
      page: result.page,
      limit: result.limit,
    })
  })
)

// POST /api/themes —— 创建主题
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = req.body || {}
    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (!name) {
      return res
        .status(400)
        .json({ error: "name_required", message: "主题名称不能为空" })
    }
    const theme = repo.create({
      name,
      description: typeof body.description === "string" ? body.description : "",
      variables:
        body.variables && typeof body.variables === "object"
          ? body.variables
          : {},
    })
    res.status(201).json({ theme })
  })
)

// GET /api/themes/:id —— 详情
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const theme = repo.getById(req.params.id)
    if (!theme)
      return res
        .status(404)
        .json({ error: "not_found", message: "主题不存在" })
    res.json({ theme })
  })
)

// PUT /api/themes/:id —— 更新
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const body = req.body || {}
    const patch = {}
    if (body.name !== undefined) patch.name = String(body.name)
    if (body.description !== undefined)
      patch.description = String(body.description)
    if (body.variables !== undefined && typeof body.variables === "object")
      patch.variables = body.variables

    if (Object.keys(patch).length === 0) {
      return res
        .status(400)
        .json({ error: "empty_patch", message: "无可更新字段" })
    }
    const theme = repo.update(req.params.id, patch)
    if (!theme)
      return res
        .status(404)
        .json({ error: "not_found", message: "主题不存在" })
    res.json({ theme })
  })
)

// DELETE /api/themes/:id —— 删除（预设不可删）
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = repo.remove(req.params.id)
    if (!result.ok && result.error === "not_found") {
      return res
        .status(404)
        .json({ error: "not_found", message: "主题不存在" })
    }
    if (!result.ok && result.error === "preset_cannot_be_deleted") {
      return res
        .status(400)
        .json({ error: "preset_cannot_be_deleted", message: "预设主题不可删除" })
    }
    res.json({ ok: true })
  })
)

// POST /api/themes/import —— 导入主题（先于 /:id 注册，避免被 catch-all 捕获）
router.post(
  "/import",
  asyncHandler(async (req, res) => {
    const body = req.body || {}
    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (!name) {
      return res
        .status(400)
        .json({ error: "name_required", message: "主题名称不能为空" })
    }
    const theme = repo.create({
      name,
      description: typeof body.description === "string" ? body.description : "",
      variables:
        body.variables && typeof body.variables === "object"
          ? body.variables
          : {},
      isPreset: false,
    })
    res.status(201).json({ theme })
  })
)

// GET /api/themes/:id/export —— 导出主题变量
router.get(
  "/:id/export",
  asyncHandler(async (req, res) => {
    const theme = repo.getById(req.params.id)
    if (!theme)
      return res
        .status(404)
        .json({ error: "not_found", message: "主题不存在" })
    res.json({ variables: theme.variables })
  })
)

// POST /api/themes/:id/apply —— 应用到页面
router.post(
  "/:id/apply",
  asyncHandler(async (req, res) => {
    const theme = repo.getById(req.params.id)
    if (!theme)
      return res
        .status(404)
        .json({ error: "not_found", message: "主题不存在" })
    const body = req.body || {}
    const pageId = typeof body.pageId === "string" ? body.pageId : ""
    if (!pageId) {
      return res
        .status(400)
        .json({ error: "pageId_required", message: "缺少 pageId" })
    }
    // 应用主题：将 theme_id 写入目标页面（后续前端可根据 theme_id 读取变量）
    const pageRepo = await import(
      "../repositories/pageRepository.js"
    )
    const page = pageRepo.update(pageId, {
      metadata: { themeId: theme.id, themeVariables: theme.variables },
    })
    if (!page) {
      return res
        .status(404)
        .json({ error: "page_not_found", message: "页面不存在" })
    }
    res.json({ ok: true, page })
  })
)

export default router
