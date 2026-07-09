// server/index.js
// Express 启动入口：挂载 pages / editor / themes / media / templates 路由。
// 开发：监听 3001，代理由 Vite 处理。
// 生产（Docker 全栈容器）：监听 PORT 环境变量（默认 3000），同时 serve 前端静态文件。

import express from "express"
import cors from "cors"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pagesRouter from "./routes/pages.js"
import editorRouter from "./routes/editor.js"
import themeRoutes from "./routes/themes.js"
import mediaRoutes from "./routes/media.js"
import templateRoutes from "./routes/templates.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(cors())
app.use(express.json({ limit: "10mb" }))

// ── 静态文件 ────────────────────────────────────────────────────

// 服务上传的媒体文件
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// 生产模式：服务前端构建产物（Docker 全栈容器）
const distPath = path.resolve(__dirname, "..", "dist")
app.use(express.static(distPath))

// ── API 路由 ────────────────────────────────────────────────────

// 健康检查
app.get("/api/hello", (_req, res) => {
  res.json({ message: "Hello from the backend! 👋" })
})

// 管理后台资源路由
app.use("/api/pages", pagesRouter)
// 编辑器路由（按 pageId 载入 / 保存 / 预览）
app.use("/api", editorRouter)
// 主题路由
app.use("/api/themes", themeRoutes)
// 媒体路由
app.use("/api/media", mediaRoutes)
// 模板路由
app.use("/api/templates", templateRoutes)

// ── SPA 兜底 ────────────────────────────────────────────────────
// 所有非 /api 的非文件请求 fallback 到 index.html（支持 React Router 客户端路由）
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"))
})

// 404 兜底（仅针对 /api/* 未匹配的路径）
app.use((_req, res) => {
  res.status(404).json({ error: "not_found", message: "接口不存在" })
})

// ── 统一错误处理（Express 5：async 路由异常经 asyncHandler 转发至此） ──
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[server] 未捕获错误:", err)
  // multer 错误（文件大小超限 / MIME 不合法）
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: "file_too_large",
      message: "文件大小不能超过 10MB",
    })
  }
  if (err.message && err.message.startsWith("不支持的图片格式")) {
    return res.status(400).json({
      error: "unsupported_mime",
      message: err.message,
    })
  }
  res.status(500).json({
    error: "internal_error",
    message: err?.message || "服务器内部错误",
  })
})

// ── 启动 ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  const mode = process.env.NODE_ENV === "production" ? "production" : "development"
  console.log(`[server] API server running at http://localhost:${PORT} (${mode})`)
})
