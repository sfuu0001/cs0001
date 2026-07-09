// server/routes/media.js
// 媒体（图片）管理 API 路由。
// 端点：列表 / 单文件上传 / 更新元数据 / 删除 / 批量上传。
// Express 5 不会自动捕获 async 路由的 rejection，统一用 asyncHandler 将错误转发到错误中间件。

import express from "express"
import multer from "multer"
import { randomUUID } from "node:crypto"
import path from "node:path"
import fs from "node:fs"
import { fileURLToPath } from "node:url"
import * as repo from "../repositories/mediaRepository.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.join(__dirname, "..", "uploads")

// 确保上传目录存在
fs.mkdirSync(UPLOADS_DIR, { recursive: true })

// multer 存储配置
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ""
    cb(null, `${randomUUID()}${ext}`)
  },
})

// 允许的 MIME 类型
const ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]

// multer 实例：单文件上传
const uploadSingle = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(
        new Error(
          `不支持的图片格式：${file.mimetype}。允许：${ALLOWED_MIMES.join(", ")}`
        )
      )
    }
  },
}).single("file")

// multer 实例：批量上传
const uploadArray = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(
        new Error(
          `不支持的图片格式：${file.mimetype}。允许：${ALLOWED_MIMES.join(", ")}`
        )
      )
    }
  },
}).array("files", 20) // 最多 20 个文件

const router = express.Router()

// Express 5：async 路由里的异常需显式转发给错误处理中间件
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

/**
 * 从 multer 上传的文件对象创建媒体记录。
 * @param {object} file - multer file 对象
 * @param {object} [body] - 请求体，可含 alt / tags
 * @returns {object} 创建的媒体条目
 */
function createMediaFromFile(file, body = {}) {
  const relativePath = path.join("uploads", file.filename)
  const url = `/uploads/${file.filename}`
  let tags = []
  try {
    tags = body.tags ? JSON.parse(body.tags) : []
  } catch {
    tags = []
  }
  if (!Array.isArray(tags)) tags = []

  return repo.create({
    filename: file.filename,
    originalName: file.originalname,
    path: file.path,
    url,
    mimeType: file.mimetype,
    size: file.size,
    width: 0, // 后续可扩展 image-size 解析
    height: 0,
    alt: typeof body.alt === "string" ? body.alt : "",
    tags,
    uploadedBy: null,
  })
}

// GET /api/media —— 列表（分页 / 搜索 / MIME 筛选）
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Number.parseInt(req.query.page, 10)
    const limit = Number.parseInt(req.query.limit, 10)
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined
    const mimeType =
      typeof req.query.mimeType === "string" ? req.query.mimeType : undefined

    const result = repo.list({ page, limit, search, mimeType })
    res.json({
      data: result.rows,
      total: result.total,
      page: result.page,
      limit: result.limit,
    })
  })
)

// POST /api/media —— 单文件上传
router.post(
  "/",
  asyncHandler(async (req, res) => {
    // 用 Promise 包装 multer（它不是 async 原生）
    await new Promise((resolve, reject) => {
      uploadSingle(req, res, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })

    if (!req.file) {
      return res
        .status(400)
        .json({ error: "file_required", message: "请选择要上传的图片" })
    }

    const media = createMediaFromFile(req.file, req.body)
    res.status(201).json({ media })
  })
)

// PUT /api/media/:id —— 更新元数据（alt / tags）
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const body = req.body || {}
    const patch = {}
    if (body.alt !== undefined) patch.alt = String(body.alt)
    if (body.tags !== undefined) {
      patch.tags = Array.isArray(body.tags) ? body.tags : []
    }

    if (Object.keys(patch).length === 0) {
      return res
        .status(400)
        .json({ error: "empty_patch", message: "无可更新字段" })
    }
    const media = repo.updateMetadata(req.params.id, patch)
    if (!media)
      return res
        .status(404)
        .json({ error: "not_found", message: "媒体不存在" })
    res.json({ media })
  })
)

// DELETE /api/media/:id —— 删除（物理文件 + 记录）
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = repo.remove(req.params.id)
    if (!result.ok && result.error === "not_found") {
      return res
        .status(404)
        .json({ error: "not_found", message: "媒体不存在" })
    }
    res.json({ ok: true })
  })
)

// POST /api/media/batch —— 批量上传
router.post(
  "/batch",
  asyncHandler(async (req, res) => {
    await new Promise((resolve, reject) => {
      uploadArray(req, res, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })

    const files = req.files || []
    if (files.length === 0) {
      return res
        .status(400)
        .json({ error: "files_required", message: "请选择要上传的图片" })
    }

    const mediaItems = files.map((file) => createMediaFromFile(file, req.body))
    res.status(201).json({ media: mediaItems, count: mediaItems.length })
  })
)

export default router
