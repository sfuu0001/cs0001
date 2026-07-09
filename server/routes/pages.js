// server/routes/pages.js
// 管理后台资源路由（pages API）。
// 端点：列表 / 创建 / 详情 / 更新 / 软删 / 发布 / 取消发布 / 复制 / 恢复 / 导出(占位)。
// Express 5 不会自动捕获 async 路由的 rejection，统一用 asyncHandler 将错误转发到错误中间件。

import express from "express"
import * as repo from "../repositories/pageRepository.js"
import { toKebabCase, sanitizeSlug, uniqueSlug } from "../utils/slug.js"

const router = express.Router()

// Express 5：async 路由里的异常需显式转发给错误处理中间件
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

const isEmptyContent = (content) =>
  !content || !Array.isArray(content.content) || content.content.length === 0

// GET /api/pages —— 列表（分页 / 状态筛选 / 搜索 / 回收站）
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Number.parseInt(req.query.page, 10)
    const limit = Number.parseInt(req.query.limit, 10)
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined
    const deleted = req.query.deleted === "1" || req.query.deleted === "true"

    const result = repo.list({ page, limit, status, search, deleted })
    res.json({
      data: result.rows,
      total: result.total,
      page: result.page,
      limit: result.limit,
    })
  })
)

// POST /api/pages —— 创建草稿
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = req.body || {}
    const title = typeof body.title === "string" ? body.title.trim() : ""
    if (!title) {
      return res
        .status(400)
        .json({ error: "title_required", message: "标题不能为空" })
    }
    // slug：用户提供的优先（规范化），否则由 title 生成
    const provided = body.slug ? sanitizeSlug(body.slug) : ""
    const base = provided || toKebabCase(title) || "page"
    const slug = uniqueSlug(base, (s) => repo.findBySlug(s))

    const page = repo.create({
      title,
      slug,
      description: typeof body.description === "string" ? body.description : "",
      metadata:
        body.metadata && typeof body.metadata === "object" ? body.metadata : {},
      status: "draft",
    })
    res.status(201).json({ page })
  })
)

// GET /api/pages/:id —— 详情
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const page = repo.getById(req.params.id)
    if (!page)
      return res
        .status(404)
        .json({ error: "not_found", message: "页面不存在" })
    res.json({ page })
  })
)

// PUT /api/pages/:id —— 局部更新
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const body = req.body || {}
    const patch = {}
    if (body.title !== undefined) patch.title = String(body.title)
    if (body.description !== undefined)
      patch.description = String(body.description)
    if (body.content !== undefined) patch.content = body.content
    if (body.status !== undefined) patch.status = String(body.status)
    if (body.slug !== undefined) {
      const desired = sanitizeSlug(String(body.slug))
      if (desired) {
        const owner = repo.findBySlug(desired)
        if (owner && owner.id !== req.params.id) {
          return res
            .status(409)
            .json({ error: "slug_conflict", message: "slug 已存在" })
        }
        patch.slug = desired
      }
    }
    if (body.metadata !== undefined && typeof body.metadata === "object") {
      patch.metadata = body.metadata
    }

    if (Object.keys(patch).length === 0) {
      return res
        .status(400)
        .json({ error: "empty_patch", message: "无可更新字段" })
    }
    const page = repo.update(req.params.id, patch)
    if (!page)
      return res
        .status(404)
        .json({ error: "not_found", message: "页面不存在" })
    res.json({ page })
  })
)

// DELETE /api/pages/:id —— 软删除
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const ok = repo.softDelete(req.params.id)
    if (!ok)
      return res
        .status(404)
        .json({ error: "not_found", message: "页面不存在" })
    res.json({ ok: true })
  })
)

// POST /api/pages/:id/publish —— 发布（校验内容非空）
router.post(
  "/:id/publish",
  asyncHandler(async (req, res) => {
    const page = repo.getById(req.params.id)
    if (!page)
      return res
        .status(404)
        .json({ error: "not_found", message: "页面不存在" })
    if (isEmptyContent(page.content)) {
      return res
        .status(400)
        .json({ error: "empty_content", message: "内容为空，无法发布" })
    }
    const updated = repo.update(req.params.id, {
      status: "published",
      publishedAt: new Date().toISOString(),
    })
    res.json({ page: updated })
  })
)

// POST /api/pages/:id/unpublish —— 取消发布
router.post(
  "/:id/unpublish",
  asyncHandler(async (req, res) => {
    const page = repo.getById(req.params.id)
    if (!page)
      return res
        .status(404)
        .json({ error: "not_found", message: "页面不存在" })
    const updated = repo.update(req.params.id, {
      status: "draft",
      publishedAt: null,
    })
    res.json({ page: updated })
  })
)

// POST /api/pages/:id/duplicate —— 复制
router.post(
  "/:id/duplicate",
  asyncHandler(async (req, res) => {
    const page = repo.duplicate(req.params.id)
    if (!page)
      return res
        .status(404)
        .json({ error: "not_found", message: "页面不存在" })
    res.status(201).json({ page })
  })
)

// POST /api/pages/:id/restore —— 恢复软删（T8/T12 回收站所需）
router.post(
  "/:id/restore",
  asyncHandler(async (req, res) => {
    const ok = repo.restore(req.params.id)
    if (!ok)
      return res
        .status(404)
        .json({ error: "not_found", message: "页面不存在或未被删除" })
    const page = repo.getById(req.params.id)
    res.json({ page })
  })
)

// GET /api/pages/:id/export —— 静态 HTML 导出 / JSON 导出
// 查询参数 format=html（默认）| json
import renderStaticHtml from "../utils/renderStaticHtml.js"
router.get(
  "/:id/export",
  asyncHandler(async (req, res) => {
    const page = repo.getById(req.params.id)
    if (!page)
      return res
        .status(404)
        .json({ error: "not_found", message: "页面不存在" })
    const format = typeof req.query.format === "string" ? req.query.format : "html"
    if (format === "json") {
      return res.json({ page })
    }
    // 默认 format=html
    const html = renderStaticHtml(page)
    res.setHeader("Content-Type", "text/html; charset=utf-8")
    return res.send(html)
  })
)

export default router
