// server/db.js
// SQLite 连接初始化 + 所有表的建表逻辑（幂等）。
// 驱动优先级：better-sqlite3（同步，预编译二进制）→ Node 22+ 内置 node:sqlite（零依赖兜底）。
// 无论使用哪个驱动，对外暴露的 db 实例接口保持一致（prepare/get/all/run/exec），
// 上层 repository 与路由无需感知驱动差异（DAL 封装在 repository 层）。

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { randomUUID } from "node:crypto"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// SQLite 文件存放目录（已被 .gitignore 忽略）
const DATA_DIR = path.join(__dirname, "data")
fs.mkdirSync(DATA_DIR, { recursive: true })
export const DB_PATH = path.join(DATA_DIR, "app.db")

/**
 * 创建并初始化数据库连接。
 * 优先尝试 better-sqlite3；若缺失或加载失败，则回退到内置 node:sqlite。
 * @returns {{ db: any, driver: "better-sqlite3" | "node:sqlite" }}
 */
async function createConnection() {
  // 1) 优先 better-sqlite3
  try {
    const mod = await import("better-sqlite3")
    const Database = mod.default
    const connection = new Database(DB_PATH)
    connection.pragma("journal_mode = WAL")
    return { db: connection, driver: "better-sqlite3" }
  } catch {
    // 2) 兜底 node:sqlite（Node 22.5+ 内置，零依赖）
    const { DatabaseSync } = await import("node:sqlite")
    const connection = new DatabaseSync(DB_PATH)
    connection.exec("PRAGMA journal_mode = WAL")
    return { db: connection, driver: "node:sqlite" }
  }
}

const { db, driver } = await createConnection()

// ── 建表（幂等）─────────────────────────────────────────────────────────
// 字段命名用 snake_case；content / metadata / variables 等以 JSON 文本存储。

// pages 表（一期已有，此处保持完整定义）
db.exec(`
  CREATE TABLE IF NOT EXISTS pages (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    slug        TEXT UNIQUE NOT NULL,
    description TEXT,
    content     TEXT,
    status      TEXT NOT NULL DEFAULT 'draft',
    view_count  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT,
    updated_at  TEXT,
    published_at TEXT,
    deleted_at  TEXT,
    metadata    TEXT
  );
`)

// 幂等地给 pages 表追加 theme_id 列
const pagesColumns = db.prepare("PRAGMA table_info(pages)").all()
if (!pagesColumns.some((col) => col.name === "theme_id")) {
  db.exec("ALTER TABLE pages ADD COLUMN theme_id TEXT")
}

// themes 表 —— 主题 / 设计变量
db.exec(`
  CREATE TABLE IF NOT EXISTS themes (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    description   TEXT,
    variables     TEXT,
    is_preset     INTEGER NOT NULL DEFAULT 0,
    preview_image TEXT,
    created_at    TEXT,
    updated_at    TEXT
  );
`)

// media 表 —— 上传的媒体文件元数据
db.exec(`
  CREATE TABLE IF NOT EXISTS media (
    id            TEXT PRIMARY KEY,
    filename      TEXT NOT NULL,
    original_name TEXT,
    path          TEXT,
    url           TEXT,
    mime_type     TEXT,
    size          INTEGER,
    width         INTEGER,
    height        INTEGER,
    alt           TEXT,
    tags          TEXT,
    created_at    TEXT,
    uploaded_by   TEXT
  );
`)

// templates 表 —— 页面模板（预设或用户创建）
db.exec(`
  CREATE TABLE IF NOT EXISTS templates (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    content     TEXT,
    thumbnail   TEXT,
    category    TEXT,
    is_preset   INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT,
    updated_at  TEXT
  );
`)

// users 表 —— JWT 用户认证
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT UNIQUE NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user',
    created_at    TEXT
  );
`)

// page_versions 表 —— 页面版本历史
db.exec(`
  CREATE TABLE IF NOT EXISTS page_versions (
    id         TEXT PRIMARY KEY,
    page_id    TEXT NOT NULL,
    content    TEXT,
    version    INTEGER NOT NULL DEFAULT 1,
    created_at TEXT,
    created_by TEXT,
    FOREIGN KEY (page_id) REFERENCES pages(id)
  );
`)

// form_submissions 表 —— 表单数据收集
db.exec(`
  CREATE TABLE IF NOT EXISTS form_submissions (
    id          TEXT PRIMARY KEY,
    page_id     TEXT NOT NULL,
    form_config TEXT,
    data        TEXT,
    created_at  TEXT,
    ip          TEXT
  );
`)

// ── 预设种子数据 ──────────────────────────────────────────────────────────
// 启动时检查 themes 表是否为空，若为空则 INSERT 5 个预设主题。
// 同样检查 templates 表，若为空则 INSERT 5 个预设模板。

function seedThemes() {
  const count = db.prepare("SELECT COUNT(*) AS cnt FROM themes").all()
  const row = count[0]
  if (row && row.cnt > 0) return // 已有数据，跳过

  const now = new Date().toISOString()

  const presetThemeData = [
    {
      name: "浅色",
      description: "明亮的浅色默认主题，适合大多数页面",
      variables: {
        "--primary": "#6366f1",
        "--primary-foreground": "#ffffff",
        "--background": "#ffffff",
        "--foreground": "#0f172a",
        "--muted": "#f1f5f9",
        "--muted-foreground": "#64748b",
        "--accent": "#f1f5f9",
        "--accent-foreground": "#0f172a",
        "--border": "#e2e8f0",
        "--ring": "#6366f1",
        "--radius": "0.5rem",
        "--font-family": "Inter, system-ui, -apple-system, sans-serif",
        "--card-background": "#ffffff",
        "--card-border": "#e2e8f0",
        "--input-background": "#ffffff",
        "--input-border": "#e2e8f0",
      },
    },
    {
      name: "深色",
      description: "深色背景主题，适合夜间阅读或暗色风格页面",
      variables: {
        "--primary": "#818cf8",
        "--primary-foreground": "#0f172a",
        "--background": "#0f172a",
        "--foreground": "#e2e8f0",
        "--muted": "#1e293b",
        "--muted-foreground": "#94a3b8",
        "--accent": "#1e293b",
        "--accent-foreground": "#e2e8f0",
        "--border": "#334155",
        "--ring": "#818cf8",
        "--radius": "0.5rem",
        "--font-family": "Inter, system-ui, -apple-system, sans-serif",
        "--card-background": "#1e293b",
        "--card-border": "#334155",
        "--input-background": "#1e293b",
        "--input-border": "#334155",
      },
    },
    {
      name: "科技蓝",
      description: "蓝色科技感主题，适合技术类或企业页面",
      variables: {
        "--primary": "#2563eb",
        "--primary-foreground": "#ffffff",
        "--background": "#f8fafc",
        "--foreground": "#0f172a",
        "--muted": "#eff6ff",
        "--muted-foreground": "#64748b",
        "--accent": "#dbeafe",
        "--accent-foreground": "#1e40af",
        "--border": "#bfdbfe",
        "--ring": "#2563eb",
        "--radius": "0.375rem",
        "--font-family": "Inter, system-ui, -apple-system, sans-serif",
        "--card-background": "#ffffff",
        "--card-border": "#bfdbfe",
        "--input-background": "#ffffff",
        "--input-border": "#bfdbfe",
      },
    },
    {
      name: "自然绿",
      description: "自然绿色主题，适合环保、健康或户外类页面",
      variables: {
        "--primary": "#16a34a",
        "--primary-foreground": "#ffffff",
        "--background": "#f0fdf4",
        "--foreground": "#052e16",
        "--muted": "#dcfce7",
        "--muted-foreground": "#166534",
        "--accent": "#bbf7d0",
        "--accent-foreground": "#14532d",
        "--border": "#86efac",
        "--ring": "#16a34a",
        "--radius": "0.5rem",
        "--font-family": "Inter, system-ui, -apple-system, sans-serif",
        "--card-background": "#ffffff",
        "--card-border": "#86efac",
        "--input-background": "#ffffff",
        "--input-border": "#86efac",
      },
    },
    {
      name: "暖色",
      description: "温暖橙色调主题，适合博客、lifestyle 或创意页面",
      variables: {
        "--primary": "#ea580c",
        "--primary-foreground": "#ffffff",
        "--background": "#fffcf5",
        "--foreground": "#1c1917",
        "--muted": "#fff7ed",
        "--muted-foreground": "#78716c",
        "--accent": "#ffedd5",
        "--accent-foreground": "#9a3412",
        "--border": "#fed7aa",
        "--ring": "#ea580c",
        "--radius": "0.5rem",
        "--font-family": "Inter, system-ui, -apple-system, sans-serif",
        "--card-background": "#ffffff",
        "--card-border": "#fed7aa",
        "--input-background": "#ffffff",
        "--input-border": "#fed7aa",
      },
    },
  ]

  const stmt = db.prepare(
    `INSERT INTO themes (id, name, description, variables, is_preset, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`
  )

  for (const t of presetThemeData) {
    stmt.run(
      randomUUID(),
      t.name,
      t.description,
      JSON.stringify(t.variables),
      now,
      now
    )
  }

  console.log("[seed] Inserted 5 preset themes")
}

function seedTemplates() {
  const count = db.prepare("SELECT COUNT(*) AS cnt FROM templates").all()
  const row = count[0]
  if (row && row.cnt > 0) return

  const now = new Date().toISOString()

  const EMPTY_CONTENT = { root: { props: {} }, content: [], zones: {} }

  const presetTemplates = [
    {
      name: "Landing 首页",
      description: "简洁的落地页模板，包含 Hero、功能介绍和 CTA 区域",
      category: "landing",
      content: {
        root: { props: {} },
        content: [
          {
            type: "Heading",
            props: { text: "欢迎访问我们的网站", level: "h1", align: "center", id: "hero-title" },
          },
          {
            type: "Text",
            props: { text: "这是一个使用 Puck 构建的 Landing 页面模板，您可以自由编辑和替换内容。", align: "center", id: "hero-desc" },
          },
          {
            type: "Section",
            props: { padding: "2rem", backgroundColor: "#f8fafc", id: "features-section" },
          },
        ],
        zones: {},
      },
    },
    {
      name: "About 关于我们",
      description: "关于页面模板，展示团队信息和公司介绍",
      category: "about",
      content: {
        root: { props: {} },
        content: [
          {
            type: "Heading",
            props: { text: "关于我们", level: "h1", align: "center", id: "about-title" },
          },
          {
            type: "Text",
            props: { text: "我们是一支充满热情的团队，致力于为客户提供最优质的服务。", id: "about-text-1" },
          },
          {
            type: "Divider",
            props: { id: "about-divider" },
          },
          {
            type: "Text",
            props: { text: "成立于 2024 年，我们已服务超过 100 家客户。", id: "about-text-2" },
          },
        ],
        zones: {},
      },
    },
    {
      name: "Contact 联系我们",
      description: "联系方式页面模板，包含联系信息和表单",
      category: "contact",
      content: {
        root: { props: {} },
        content: [
          {
            type: "Heading",
            props: { text: "联系我们", level: "h1", align: "center", id: "contact-title" },
          },
          {
            type: "Text",
            props: { text: "如有任何问题，欢迎随时与我们取得联系。", align: "center", id: "contact-desc" },
          },
          {
            type: "Input",
            props: { label: "姓名", placeholder: "请输入您的姓名", id: "contact-name" },
          },
          {
            type: "Input",
            props: { label: "邮箱", placeholder: "请输入您的邮箱", id: "contact-email" },
          },
        ],
        zones: {},
      },
    },
    {
      name: "Blog 博客",
      description: "博客文章页面模板，适合个人或企业博客",
      category: "blog",
      content: {
        root: { props: {} },
        content: [
          {
            type: "Heading",
            props: { text: "博客文章", level: "h1", align: "center", id: "blog-title" },
          },
          {
            type: "Text",
            props: { text: "发布日期：2024 年 1 月 1 日", align: "center", id: "blog-date" },
          },
          {
            type: "Divider",
            props: { id: "blog-divider" },
          },
          {
            type: "Heading",
            props: { text: "引言", level: "h2", id: "blog-intro" },
          },
          {
            type: "Text",
            props: { text: "这是博客文章的内容区域。您可以在这里写文章正文，插入图片和其他组件。", id: "blog-body" },
          },
        ],
        zones: {},
      },
    },
    {
      name: "Gallery 作品集",
      description: "作品集/图库页面模板，网格展示图片作品",
      category: "gallery",
      content: {
        root: { props: {} },
        content: [
          {
            type: "Heading",
            props: { text: "作品集", level: "h1", align: "center", id: "gallery-title" },
          },
          {
            type: "Text",
            props: { text: "以下是我们精选的作品展示。", align: "center", id: "gallery-desc" },
          },
          {
            type: "Grid",
            props: { columns: 3, gap: "1rem", id: "gallery-grid" },
          },
        ],
        zones: {},
      },
    },
  ]

  const stmt = db.prepare(
    `INSERT INTO templates (id, name, description, content, category, is_preset, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
  )

  for (const t of presetTemplates) {
    stmt.run(
      randomUUID(),
      t.name,
      t.description,
      JSON.stringify(t.content),
      t.category,
      now,
      now
    )
  }

  console.log("[seed] Inserted 5 preset templates")
}

// 执行种子数据
seedThemes()
seedTemplates()

export { db, driver }
export const DB_DRIVER = driver
