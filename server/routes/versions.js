// server/routes/versions.js
// 页面版本历史路由。

import express from "express"
import * as versionRepo from "../repositories/versionRepository.js"
import { getById as getPageById } from "../repositories/pageRepository.js"

const router = express.Router()

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// POST /api/pages/:id/versions — 保存新版本
router.post(
  "/:id/versions",
  asyncHandler(async (req, res) => {
    const page = getPageById(req.params.id)
    if (!page) {
      return res.status(404).json({
        error: "not_found",
        message: "页面不存在",
      })
    }
    const createdBy = req.user?.userId || null
    const version = versionRepo.create(req.params.id, page.content, createdBy)
    res.status(201).json({ version })
  })
)

// GET /api/pages/:id/versions — 获取版本列表
router.get(
  "/:id/versions",
  asyncHandler(async (req, res) => {
    const page = getPageById(req.params.id)
    if (!page) {
      return res.status(404).json({
        error: "not_found",
        message: "页面不存在",
      })
    }
    const versions = versionRepo.list(req.params.id)
    res.json({ data: versions })
  })
)

// POST /api/pages/:id/versions/:vid/restore — 恢复版本
router.post(
  "/:id/versions/:vid/restore",
  asyncHandler(async (req, res) => {
    const result = versionRepo.restore(req.params.id, req.params.vid)
    if (!result) {
      return res.status(404).json({
        error: "not_found",
        message: "版本不存在或页面不匹配",
      })
    }
    res.json({ version: result })
  })
)

export default router
