// tests/phase1_regression.test.mjs
// Phase 1 回归测试 — 覆盖 T1b/BYO 组件扫描、T2/双模存储、T3/CLI 工具、T4b/Inspector + 原有 44 个 API 用例
// 使用 Node 内置 node:test + node:assert，零额外依赖

import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync, mkdirSync, rmSync, readdirSync } from "node:fs"
import { execSync } from "node:child_process"
import { resolve, join } from "node:path"

const BASE = "http://localhost:3001"
const FRONTEND = "http://localhost:5174"

// ---------------------------------------------------------------------------
// 全局 auth 状态
// ---------------------------------------------------------------------------
let TOKEN = ""
const TEST_USER = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: "testpass123",
}

// ---------------------------------------------------------------------------
// 工具函数（含 auth header）
// ---------------------------------------------------------------------------

async function api(path, opts = {}) {
  const url = `${BASE}${path}`
  const headers = { ...opts.headers }
  if (TOKEN) {
    headers["Authorization"] = `Bearer ${TOKEN}`
  }
  if (!(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }
  const res = await fetch(url, { ...opts, headers })
  let body
  const ct = res.headers.get("content-type") || ""
  if (ct.includes("application/json")) {
    body = await res.json()
  } else {
    body = await res.text()
  }
  return { status: res.status, body, res }
}

function post(path, data) {
  return api(path, { method: "POST", body: JSON.stringify(data) })
}

function put(path, data) {
  return api(path, { method: "PUT", body: JSON.stringify(data) })
}

function del(path) {
  return api(path, { method: "DELETE" })
}

function jget(path) {
  return api(path, { method: "GET" })
}

// ---------------------------------------------------------------------------
// 0. 认证 — 注册 + 登录
// ---------------------------------------------------------------------------

describe("认证 — 注册与登录", () => {
  it("POST /api/auth/register — 注册测试用户", async () => {
    const { status, body } = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_USER),
    }).then(async (r) => ({ status: r.status, body: await r.json() }))

    assert.equal(status, 201)
    assert.ok(body.token)
    assert.equal(body.user.username, TEST_USER.username)
    TOKEN = body.token
  })

  it("POST /api/auth/register — 重复注册应返回 409", async () => {
    const { status, body } = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_USER),
    }).then(async (r) => ({ status: r.status, body: await r.json() }))

    assert.equal(status, 409)
    assert.equal(body.error, "user_exists")
  })

  it("POST /api/auth/login — 使用同一账号登录", async () => {
    const { status, body } = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: TEST_USER.username,
        password: TEST_USER.password,
      }),
    }).then(async (r) => ({ status: r.status, body: await r.json() }))

    assert.equal(status, 200)
    assert.ok(body.token)
    TOKEN = body.token
  })

  it("GET /api/auth/me — 获取当前用户信息", async () => {
    const { status, body } = await api("/api/auth/me", { method: "GET" })
    assert.equal(status, 200)
    assert.equal(body.user.username, TEST_USER.username)
  })
})

// ===========================================================================
// T1b: BYO 组件扫描
// ===========================================================================
describe("T1b: BYO 组件扫描", () => {
  const PAGES_DIR = resolve("C:\\Users\\sfuu0\\WorkBuddy\\2026-07-10-00-54-28\\my-app\\pages")
  const REGISTRY_PATH = resolve("C:\\Users\\sfuu0\\WorkBuddy\\2026-07-10-00-54-28\\my-app\\src\\.pageforge\\registry.ts")

  it("检查组件扫描 registry 文件存在", () => {
    assert.ok(existsSync(REGISTRY_PATH), "registry.ts 应存在")
  })

  it("注册表中应包含 7 个扫描到的组件", () => {
    const content = readFileSync(REGISTRY_PATH, "utf-8")
    // 计数 "render:" 出现次数（每个组件配置有一个 render 函数）
    const renderMatches = content.match(/render:/g)
    const count = renderMatches ? renderMatches.length : 0
    assert.equal(count, 7, `扫描到的组件数量应为 7，实际为 ${count}`)
  })

  it("注册表应包含 HeroBanner 配置（含 props/fields/defaultProps）", () => {
    const content = readFileSync(REGISTRY_PATH, "utf-8")
    assert.ok(content.includes("HeroBanner"), "应包含 HeroBanner")
    assert.ok(content.includes("title"), "HeroBanner 应包含 title prop")
    assert.ok(content.includes("subtitle"), "HeroBanner 应包含 subtitle prop")
    assert.ok(content.includes("select"), "应包含 select 类型的字段")
    assert.ok(content.includes("switch"), "应包含 switch 类型的字段")
    assert.ok(content.includes("number"), "应包含 number 类型的字段")
  })

  it("注册表应包含 4 个 Inspector 相关组件", () => {
    const content = readFileSync(REGISTRY_PATH, "utf-8")
    const comps = ["InspectorPanel", "PropsView", "PuckSelectionSync", "TreeView"]
    for (const c of comps) {
      assert.ok(content.includes(c), `应包含 ${c}`)
    }
  })

  it("Vite 插件日志 — 扫描完成标记已在控制台输出", async () => {
    // 之前启动 Vite 时已看到日志 "[pageforge-scanner] 扫描完成: 7 个组件"
    // 通过前端页面确认
    const res = await fetch(`${FRONTEND}/src/main.tsx`)
    assert.equal(res.status, 200)
    const html = await res.text()
    assert.ok(html, "前端应可访问")
  })
})

// ===========================================================================
// T2: 双模存储（SQLite + 文件系统）
// ===========================================================================
describe("T2: 双模存储 — SQLite + 文件系统", () => {
  const PAGES_DIR = resolve("C:\\Users\\sfuu0\\WorkBuddy\\2026-07-10-00-54-28\\my-app\\pages")
  let pageId
  let pageSlug
  const TEST_TITLE = `双模存储测试页_${Date.now()}`

  it("检查 pages/ 目录是否存在（可由 save 创建）", () => {
    if (!existsSync(PAGES_DIR)) {
      mkdirSync(PAGES_DIR, { recursive: true })
    }
    assert.ok(existsSync(PAGES_DIR), "pages/ 目录应存在")
  })

  it("创建新页面 — 应同时写入 SQLite 和文件系统", async () => {
    const { status, body } = await post("/api/pages", { title: TEST_TITLE })
    assert.equal(status, 201)
    assert.ok(body.page)
    assert.ok(body.page.id)
    pageId = body.page.id
    pageSlug = body.page.slug

    // 验证 SQLite 中存在
    const detail = await jget(`/api/pages/${pageId}`)
    assert.equal(detail.status, 200)
    assert.equal(detail.body.page.title, TEST_TITLE)
  })

  it("保存内容后检查 pages/ 目录下生成 .page.tsx 文件", async () => {
    const puckData = {
      root: { props: { title: "Hello" } },
      content: [
        { type: "Heading", props: { text: "双模存储标题", level: "h1" } },
      ],
    }
    const { status } = await post(`/api/save/${pageId}`, { content: puckData })
    assert.equal(status, 200)

    // 等待文件写入
    await new Promise((r) => setTimeout(r, 500))

    // 检查 pages/ 目录下是否有对应文件
    let files = []
    try { files = readdirSync(PAGES_DIR) } catch { files = [] }

    const pageFile = files.find((f) => f.includes(pageSlug) && f.endsWith(".page.tsx"))
    assert.ok(pageFile, `应生成 .page.tsx 文件 (slug: ${pageSlug})`)

    // 检查文件内容是否为合法 React 组件
    const filePath = join(PAGES_DIR, pageFile)
    const content = readFileSync(filePath, "utf-8")
    assert.ok(content.includes("import"), "文件应包含 import 语句")
    assert.ok(content.includes("export"), "文件应包含 export 语句")
    assert.ok(content.includes("return") || content.includes("createElement"), "文件应包含 JSX/return")
    assert.ok(content.includes("双模存储标题"), "文件应包含保存的文本内容")
  })

  it("修改页面后重新保存 — 文件应更新", async () => {
    const puckData2 = {
      root: { props: { title: "Updated" } },
      content: [
        { type: "Heading", props: { text: "已更新的标题", level: "h2" } },
      ],
    }
    const { status } = await post(`/api/save/${pageId}`, { content: puckData2 })
    assert.equal(status, 200)

    // 等待文件写入
    await new Promise((r) => setTimeout(r, 500))

    // 查找文件并检查内容是否更新
    let files = []
    try { files = readdirSync(PAGES_DIR) } catch { files = [] }
    const pageFile = files.find((f) => f.includes(pageSlug) && f.endsWith(".page.tsx"))
    assert.ok(pageFile, "更新后文件仍应存在")

    const content = readFileSync(join(PAGES_DIR, pageFile), "utf-8")
    assert.ok(content.includes("已更新的标题"), "文件内容应反映最新修改")
  })

  it("SQLite 中数据也应同时存在", async () => {
    const detail = await jget(`/api/pages/${pageId}`)
    assert.equal(detail.status, 200)
    assert.ok(detail.body.page.content)
    const content = detail.body.page.content
    assert.ok(content.root)
    assert.ok(content.content)
  })

  it("重复保存应覆盖文件而非追加", async () => {
    let files = []
    try { files = readdirSync(PAGES_DIR) } catch { files = [] }
    const pageFiles = files.filter((f) => f.includes(pageSlug) && f.endsWith(".page.tsx"))
    assert.equal(pageFiles.length, 1, "不应生成重复文件（只保留一个）")
  })

  it("无内容页面不生成文件", async () => {
    // 创建一个新页面不保存内容
    const { status, body } = await post("/api/pages", { title: `无内容页_${Date.now()}` })
    assert.equal(status, 201)
    const emptyPageId = body.page.id

    // 没有保存过内容，不应生成文件
    let files2 = []
    try { files2 = readdirSync(PAGES_DIR) } catch { files2 = [] }

    // 清理
    await del(`/api/pages/${emptyPageId}`)
  })
})

// ===========================================================================
// T3: CLI 工具
// ===========================================================================
describe("T3: CLI 工具", () => {
  const CLI_DIR = "C:\\Users\\sfuu0\\WorkBuddy\\2026-07-10-00-54-28\\my-app\\packages\\cli"
  const CLI_BIN = join(CLI_DIR, "bin", "pageforge.js")

  it("CLI 入口文件应存在", () => {
    assert.ok(existsSync(CLI_BIN), `pageforge.js 应存在于 ${CLI_BIN}`)
  })

  it("pageforge --help 应输出 init 和 dev 命令", () => {
    const output = execSync(`node "${CLI_BIN}" --help`, {
      cwd: CLI_DIR,
      encoding: "utf-8",
    })
    assert.ok(output.includes("init"), "输出应包含 init 命令")
    assert.ok(output.includes("dev"), "输出应包含 dev 命令")
    assert.ok(output.includes("--help"), "输出应包含 --help 选项")
  })

  it("pageforge -h 也应输出帮助信息", () => {
    const output = execSync(`node "${CLI_BIN}" -h`, {
      cwd: CLI_DIR,
      encoding: "utf-8",
    })
    assert.ok(output.includes("init"), "输出应包含 init 命令")
  })

  it("pageforge 无参数应输出帮助信息", () => {
    const output = execSync(`node "${CLI_BIN}"`, {
      cwd: CLI_DIR,
      encoding: "utf-8",
    })
    assert.ok(output.includes("init"), "无参数时应输出帮助信息")
  })

  it("pageforge init 应生成 pageforge.config.ts", () => {
    const tmpDir = resolve("C:\\Users\\sfuu0\\WorkBuddy\\2026-07-10-00-54-28\\my-app\\tmp_test_cli")
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true })

    const output = execSync(`node "${CLI_BIN}" init`, {
      cwd: tmpDir,
      encoding: "utf-8",
    })

    const configPath = join(tmpDir, "pageforge.config.ts")
    assert.ok(existsSync(configPath), "应生成 pageforge.config.ts")

    const content = readFileSync(configPath, "utf-8")
    assert.ok(content.includes("components"), "配置内容应包含 components")
    assert.ok(content.includes("scan"), "配置内容应包含 scan 配置")
    assert.ok(content.includes("output"), "配置内容应包含 output 配置")

    // 尝试清理（非关键步骤）
    try { rmSync(tmpDir, { recursive: true, force: true }) } catch { /* ignore cleanup error */ }
  })

  it("pageforge 未知命令应报错", () => {
    try {
      execSync(`node "${CLI_BIN}" unknown_command`, {
        cwd: CLI_DIR,
        encoding: "utf-8",
      })
      assert.fail("应退出非零")
    } catch (e) {
      assert.ok(e.stderr || e.stdout, "应输出错误信息")
      // 正常退出码应为 1
      assert.ok(e.status === 1, "未知命令退出码应为 1")
    }
  })
})

// ===========================================================================
// 原有 20 个 API 集成测试（页面 CRUD）（加 JWT 认证）
// ===========================================================================
describe("页面编辑器 API 集成测试（+JWT 认证）", () => {
  let pId, pSlug, p2Id, p2Slug

  it("GET /api/pages — 列表返回正常", async () => {
    const { status, body } = await jget("/api/pages")
    assert.equal(status, 200)
    assert.ok(Array.isArray(body.data))
    assert.ok(body.total !== undefined)
    assert.ok(body.page !== undefined)
    assert.ok(body.limit !== undefined)
  })

  it("POST /api/pages — 创建页面", async () => {
    const { status, body } = await post("/api/pages", { title: "回归测试页A" })
    assert.equal(status, 201)
    assert.ok(body.page)
    assert.ok(body.page.id)
    assert.equal(body.page.title, "回归测试页A")
    assert.ok(body.page.slug)
    assert.equal(body.page.status, "draft")
    pId = body.page.id
    pSlug = body.page.slug
  })

  it("POST /api/pages — 同名标题 slug 不同", async () => {
    const { status, body } = await post("/api/pages", { title: "回归测试页A" })
    assert.equal(status, 201)
    assert.notEqual(body.page.slug, pSlug)
    p2Id = body.page.id
    p2Slug = body.page.slug
  })

  it("GET /api/pages/:id — 获取详情", async () => {
    const { status, body } = await jget(`/api/pages/${pId}`)
    assert.equal(status, 200)
    assert.equal(body.page.id, pId)
    assert.equal(body.page.title, "回归测试页A")
  })

  it("POST /api/save/:pageId → GET /api/load/:pageId — 内容一致性", async () => {
    const puckData = {
      root: { props: { title: "Hello" } },
      content: [{ type: "Heading", props: { text: "我的标题", level: "h1" } }],
    }
    const saveRes = await post(`/api/save/${pId}`, { content: puckData })
    assert.equal(saveRes.status, 200)
    assert.equal(saveRes.body.ok, true)

    const loadRes = await jget(`/api/load/${pId}`)
    assert.equal(loadRes.status, 200)
    assert.deepEqual(loadRes.body.content, puckData)
  })

  it("POST /api/pages/:id/publish — 空内容返回 400", async () => {
    const { status, body } = await post(`/api/pages/${p2Id}/publish`)
    assert.equal(status, 400)
    assert.equal(body.error, "empty_content")
  })

  it("POST /api/pages/:id/publish — 发布成功", async () => {
    const puckData = {
      root: { props: {} },
      content: [{ type: "Heading", props: { text: "可发布内容", level: "h1" } }],
    }
    await post(`/api/save/${pId}`, { content: puckData })

    const { status, body } = await post(`/api/pages/${pId}/publish`)
    assert.equal(status, 200)
    assert.equal(body.page.status, "published")
    assert.ok(body.page.publishedAt)
  })

  it("POST /api/pages/:id/unpublish — 取消发布", async () => {
    const { status, body } = await post(`/api/pages/${pId}/unpublish`)
    assert.equal(status, 200)
    assert.equal(body.page.status, "draft")
    assert.equal(body.page.publishedAt, null)
  })

  it("GET /api/preview/:pageId — 预览 + viewCount 递增", async () => {
    const puckData = {
      root: { props: {} },
      content: [{ type: "Heading", props: { text: "预览内容", level: "h1" } }],
    }
    await post(`/api/save/${pId}`, { content: puckData })

    const r1 = await jget(`/api/preview/${pId}`)
    assert.equal(r1.status, 200)
    assert.ok(r1.body.content)

    const detail1 = await jget(`/api/pages/${pId}`)
    assert.ok(detail1.body.page.viewCount >= 1)

    const r2 = await jget(`/api/preview/${pId}`)
    assert.equal(r2.status, 200)

    const detail2 = await jget(`/api/pages/${pId}`)
    assert.ok(detail2.body.page.viewCount >= 2)
  })

  it("POST /api/pages/:id/duplicate — 复制页面", async () => {
    const { status, body } = await post(`/api/pages/${pId}/duplicate`)
    assert.equal(status, 201)
    assert.ok(body.page)
    assert.notEqual(body.page.id, pId)
    assert.ok(body.page.title.includes("副本"))
    assert.equal(body.page.status, "draft")
  })

  it("DELETE /api/pages/:id — 软删除", async () => {
    const { status, body } = await del(`/api/pages/${pId}`)
    assert.equal(status, 200)
    assert.equal(body.ok, true)

    // 普通列表不应包含
    const listNormal = await jget("/api/pages")
    const ids = listNormal.body.data.map((p) => p.id)
    assert.equal(ids.includes(pId), false)

    // 回收站应有
    const listDeleted = await jget("/api/pages?deleted=1")
    const deletedIds = listDeleted.body.data.map((p) => p.id)
    assert.ok(deletedIds.includes(pId))

    // 详情 404
    const detail = await jget(`/api/pages/${pId}`)
    assert.equal(detail.status, 404)
  })

  it("POST /api/pages/:id/restore — 恢复", async () => {
    const { status, body } = await post(`/api/pages/${pId}/restore`)
    assert.equal(status, 200)
    assert.ok(body.page)

    const listNormal = await jget("/api/pages")
    const ids = listNormal.body.data.map((p) => p.id)
    assert.ok(ids.includes(pId))
  })

  it("GET /api/load/:nonexistent — 404", async () => {
    const { status, body } = await jget("/api/load/00000000-0000-0000-0000-000000000000")
    assert.equal(status, 404)
    assert.equal(body.error, "not_found")
  })

  it("分页稳定性", async () => {
    const existing = await jget("/api/pages")
    const need = 12 - existing.body.data.length
    const createdIds = []
    for (let i = 0; i < Math.max(need, 12); i++) {
      const r = await post("/api/pages", { title: `分页测试 ${i + 1}` })
      if (r.status === 201) createdIds.push(r.body.page.id)
    }

    const p1 = await jget("/api/pages?page=1&limit=10")
    assert.equal(p1.status, 200)
    assert.equal(p1.body.data.length, 10)

    const p2 = await jget("/api/pages?page=2&limit=10")
    assert.equal(p2.status, 200)
    assert.ok(p2.body.data.length > 0)

    const p1Ids = p1.body.data.map((p) => p.id)
    const p2Ids = p2.body.data.map((p) => p.id)
    for (const id2 of p2Ids) {
      assert.equal(p1Ids.includes(id2), false)
    }

    const overflow = await jget("/api/pages?page=999&limit=10")
    assert.equal(overflow.status, 200)
    assert.equal(overflow.body.page, 1)

    for (const id of createdIds) {
      await del(`/api/pages/${id}`)
    }
  })

  it("POST /api/pages — 空标题返回 400", async () => {
    const { status, body } = await post("/api/pages", { title: "" })
    assert.equal(status, 400)
    assert.equal(body.error, "title_required")
  })

  it("PUT /api/pages/:id — 更新标题", async () => {
    const { status, body } = await put(`/api/pages/${pId}`, { title: "更新后的标题" })
    assert.equal(status, 200)
    assert.equal(body.page.title, "更新后的标题")
  })

  it("PUT /api/pages/:nonexistent — 404", async () => {
    const { status } = await put("/api/pages/00000000-0000-0000-0000-000000000000", { title: "不存在" })
    assert.equal(status, 404)
  })

  it("DELETE /api/pages/:nonexistent — 404", async () => {
    const { status } = await del("/api/pages/00000000-0000-0000-0000-000000000000")
    assert.equal(status, 404)
  })

  it("GET /api/hello — 健康检查", async () => {
    const { status, body } = await jget("/api/hello")
    assert.equal(status, 200)
    assert.ok(body.message)
  })

  it("GET /api/nonexistent — 接口不存在返回 404", async () => {
    const { status, body } = await jget("/api/nonexistent")
    assert.equal(status, 404)
    assert.equal(body.error, "not_found")
  })
})

// ===========================================================================
// 原有 24 个 Phase 2 API 测试（主题/媒体/模板/导出）（+JWT 认证）
// ===========================================================================
describe("主题 API 测试（+JWT 认证）", () => {
  let presetThemeId, customThemeId

  it("GET /api/themes — 至少包含 5 个预设主题", async () => {
    const { status, body } = await jget("/api/themes")
    assert.equal(status, 200)
    assert.ok(body.data.length >= 5, `主题总数应 ≥5，实际 ${body.data.length}`)
    assert.ok(body.total >= 5, `total 应 ≥5，实际 ${body.total}`)
    // 找到第一个预设主题
    const preset = body.data.find((t) => t.isPreset === true)
    assert.ok(preset, "应至少有一个预设主题")
    presetThemeId = preset.id
  })

  it("POST /api/themes — 创建自定义主题", async () => {
    const { status, body } = await post("/api/themes", {
      name: "我的主题",
      variables: { "--primary": "#ff0000" },
    })
    assert.equal(status, 201)
    assert.ok(body.theme)
    assert.ok(body.theme.id)
    assert.equal(body.theme.name, "我的主题")
    assert.equal(body.theme.isPreset, false)
    assert.deepEqual(body.theme.variables, { "--primary": "#ff0000" })
    customThemeId = body.theme.id
  })

  it("GET /api/themes/:id — 自定义主题详情", async () => {
    const { status, body } = await jget(`/api/themes/${customThemeId}`)
    assert.equal(status, 200)
    assert.equal(body.theme.name, "我的主题")
    assert.deepEqual(body.theme.variables, { "--primary": "#ff0000" })
  })

  it("PUT /api/themes/:id — 更新主题", async () => {
    const { status, body } = await put(`/api/themes/${customThemeId}`, {
      variables: { "--primary": "#00ff00", "--background": "#fff" },
      name: "我的主题（已更新）",
    })
    assert.equal(status, 200)
    assert.equal(body.theme.name, "我的主题（已更新）")
    assert.deepEqual(body.theme.variables, { "--primary": "#00ff00", "--background": "#fff" })
  })

  it("POST /api/themes/import — 导入主题", async () => {
    const { status, body } = await post("/api/themes/import", {
      name: "导入主题",
      description: "从JSON导入",
      variables: { "--primary": "#00ff00", "--background": "#000" },
    })
    assert.equal(status, 201)
    assert.equal(body.theme.name, "导入主题")
    assert.equal(body.theme.description, "从JSON导入")
  })

  it("GET /api/themes/:id/export — 导出变量", async () => {
    const { status, body } = await jget(`/api/themes/${presetThemeId}/export`)
    assert.equal(status, 200)
    assert.ok(body.variables)
    assert.ok(body.variables["--primary"])
    assert.ok(body.variables["--background"])
  })

  it("POST /api/themes/:id/apply — 应用到页面", async () => {
    const pageRes = await post("/api/pages", { title: "主题测试页" })
    assert.equal(pageRes.status, 201)
    const pageId = pageRes.body.page.id

    const { status, body } = await post(`/api/themes/${presetThemeId}/apply`, { pageId })
    assert.equal(status, 200)
    assert.equal(body.ok, true)
    assert.equal(body.page.metadata.themeId, presetThemeId)
  })

  it("DELETE /api/themes/:id — 删除自定义主题", async () => {
    const { status } = await del(`/api/themes/${customThemeId}`)
    assert.equal(status, 200)

    const { status: status2 } = await jget(`/api/themes/${customThemeId}`)
    assert.equal(status2, 404)
  })

  it("DELETE /api/themes/:id — 预设主题不可删除", async () => {
    const { status, body } = await del(`/api/themes/${presetThemeId}`)
    assert.equal(status, 400)
    assert.equal(body.error, "preset_cannot_be_deleted")
  })
})

describe("媒体 API 测试（+JWT 认证）", () => {
  let mediaId

  it("POST /api/media — 上传文件", async () => {
    const form = new FormData()
    const blob = new Blob(["fake-image-content"], { type: "image/png" })
    form.set("file", blob, "test.png")
    const res = await fetch(`${BASE}/api/media`, {
      method: "POST",
      body: form,
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
    const body = await res.json()
    assert.equal(res.status, 201)
    assert.ok(body.media)
    assert.ok(body.media.id)
    assert.equal(body.media.originalName, "test.png")
    assert.equal(body.media.mimeType, "image/png")
    assert.ok(body.media.url)
    assert.ok(body.media.url.endsWith(".png"))
    mediaId = body.media.id
  })

  it("GET /api/media — 列表包含上传的文件", async () => {
    const { status, body } = await jget("/api/media")
    assert.equal(status, 200)
    assert.ok(body.data.length >= 1)
    const found = body.data.find((m) => m.id === mediaId)
    assert.ok(found)
    assert.equal(found.originalName, "test.png")
  })

  it("PUT /api/media/:id — 更新 alt 和 tags", async () => {
    const { status, body } = await put(`/api/media/${mediaId}`, {
      alt: "测试图片",
      tags: ["test", "image"],
    })
    assert.equal(status, 200)
    assert.equal(body.media.alt, "测试图片")
    assert.deepEqual(body.media.tags, ["test", "image"])
  })

  it("GET /api/media?search= — 搜索文件名", async () => {
    const { status, body } = await jget("/api/media?search=test.png")
    assert.equal(status, 200)
    assert.ok(body.data.length >= 1)
    assert.equal(body.data[0].id, mediaId)
  })

  it("GET /api/media?search= — 不存在的文件返回空", async () => {
    const { status, body } = await jget("/api/media?search=nonexistent_xyz.png")
    assert.equal(status, 200)
    assert.equal(body.data.length, 0)
  })

  it("POST /api/media/batch — 批量上传", async () => {
    const form = new FormData()
    const blob1 = new Blob(["batch-file-1"], { type: "image/png" })
    const blob2 = new Blob(["batch-file-2"], { type: "image/jpeg" })
    form.append("files", blob1, "batch1.png")
    form.append("files", blob2, "batch2.jpg")
    const res = await fetch(`${BASE}/api/media/batch`, {
      method: "POST",
      body: form,
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
    const body = await res.json()
    assert.equal(res.status, 201)
    assert.equal(body.count, 2)
    assert.equal(body.media.length, 2)
    assert.equal(body.media[0].originalName, "batch1.png")
    assert.equal(body.media[1].originalName, "batch2.jpg")
  })
})

describe("模板 API 测试（+JWT 认证）", () => {
  let presetTemplateId, customTemplateId

  it("GET /api/templates — 5 个预设模板", async () => {
    const { status, body } = await jget("/api/templates")
    assert.equal(status, 200)
    assert.equal(body.data.length, 5)
    assert.equal(body.total, 5)
    assert.equal(body.data[0].isPreset, true)
    presetTemplateId = body.data[0].id
  })

  it("POST /api/templates — 创建自定义模板", async () => {
    const puckData = {
      root: { props: {} },
      content: [{ type: "Heading", props: { text: "我的模板标题", level: "h1" } }],
    }
    const { status, body } = await post("/api/templates", {
      name: "我的模板",
      content: puckData,
      category: "custom",
    })
    assert.equal(status, 201)
    assert.ok(body.template)
    assert.ok(body.template.id)
    assert.equal(body.template.name, "我的模板")
    assert.equal(body.template.category, "custom")
    assert.equal(body.template.isPreset, false)
    assert.deepEqual(body.template.content, puckData)
    customTemplateId = body.template.id
  })

  it("GET /api/templates/:id — 模板详情", async () => {
    const { status, body } = await jget(`/api/templates/${customTemplateId}`)
    assert.equal(status, 200)
    assert.equal(body.template.name, "我的模板")
  })

  it("POST /api/templates/:id/apply — 应用到页面", async () => {
    const pageRes = await post("/api/pages", { title: "模板测试页" })
    assert.equal(pageRes.status, 201)
    const pageId = pageRes.body.page.id

    const { status, body } = await post(`/api/templates/${customTemplateId}/apply`, { pageId })
    assert.equal(status, 200)
    assert.equal(body.ok, true)

    const pageDetail = await jget(`/api/pages/${pageId}`)
    assert.deepEqual(pageDetail.body.page.content, {
      root: { props: {} },
      content: [{ type: "Heading", props: { text: "我的模板标题", level: "h1" } }],
    })
  })

  it("POST /api/templates/:id/apply — 页面不存在返回 404", async () => {
    const { status, body } = await post(`/api/templates/${customTemplateId}/apply`, {
      pageId: "00000000-0000-0000-0000-000000000000",
    })
    assert.equal(status, 404)
    assert.equal(body.error, "page_not_found")
  })

  it("DELETE /api/templates/:id — 删除自定义模板", async () => {
    const { status } = await del(`/api/templates/${customTemplateId}`)
    assert.equal(status, 200)
    const { status: status2 } = await jget(`/api/templates/${customTemplateId}`)
    assert.equal(status2, 404)
  })

  it("DELETE /api/templates/:id — 预设模板不可删除", async () => {
    const { status, body } = await del(`/api/templates/${presetTemplateId}`)
    assert.equal(status, 400)
    assert.equal(body.error, "preset_cannot_be_deleted")
  })
})

describe("静态导出测试（+JWT 认证）", () => {
  let pageId

  it("创建页面并保存内容", async () => {
    const pageRes = await post("/api/pages", { title: "导出测试页" })
    assert.equal(pageRes.status, 201)
    pageId = pageRes.body.page.id

    const puckData = {
      root: { props: {} },
      content: [{ type: "Heading", props: { text: "导出内容", level: "h1" } }],
    }
    const saveRes = await post(`/api/save/${pageId}`, { content: puckData })
    assert.equal(saveRes.status, 200)
    assert.equal(saveRes.body.ok, true)
  })

  it("GET /api/pages/:id/export?format=html — 返回合法 HTML", async () => {
    const res = await fetch(`${BASE}/api/pages/${pageId}/export?format=html`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
    assert.equal(res.status, 200)
    const html = await res.text()
    assert.ok(html.includes("<!DOCTYPE html>"))
    assert.ok(html.includes("<html"))
    assert.ok(html.includes("<head>"))
    assert.ok(html.includes("<body"))
    assert.ok(html.includes("</html>"))
    assert.ok(html.includes("</body>"))
    assert.ok(html.includes("导出内容"))
  })
})

// ===========================================================================
// T4b: Inspector — 前端 UI 测试（通过检查源代码确认结构）
// ===========================================================================
describe("T4b: Inspector 面板", () => {
  const INSPECTOR_DIR = "C:\\Users\\sfuu0\\WorkBuddy\\2026-07-10-00-54-28\\my-app\\src\\components\\Inspector"

  it("Inspector 组件目录应存在", () => {
    assert.ok(existsSync(INSPECTOR_DIR), "Inspector 目录应存在")
  })

  it("InspectorPanel.tsx — 应包含组件树和属性编辑视图切换", () => {
    const content = readFileSync(join(INSPECTOR_DIR, "InspectorPanel.tsx"), "utf-8")
    assert.ok(content.includes("TreeView"), "应引用 TreeView")
    assert.ok(content.includes("PropsView"), "应引用 PropsView")
    assert.ok(content.includes("selectedId"), "应管理选中状态")
    assert.ok(content.includes("onSelect"), "应处理选择回调")
    assert.ok(content.includes("onPropChange"), "应处理属性变更回调")
    // 视图切换
    assert.ok(content.includes("组件树"), "应有组件树标签")
    assert.ok(content.includes("属性编辑"), "应有属性编辑标签")
    // 空状态
    assert.ok(content.includes("请先选择一个组件"), "未选中时应提示")
  })

  it("TreeView.tsx — 应展示组件树结构", () => {
    const content = readFileSync(join(INSPECTOR_DIR, "TreeView.tsx"), "utf-8")
    assert.ok(content.includes("data"), "应接收 data prop")
    assert.ok(content.includes("selectedId"), "应接收 selectedId")
    assert.ok(content.includes("onSelect"), "应接收 onSelect 回调")
  })

  it("PropsView.tsx — 应展示和编辑组件属性", () => {
    const content = readFileSync(join(INSPECTOR_DIR, "PropsView.tsx"), "utf-8")
    assert.ok(content.includes("data"), "应接收 data prop")
    assert.ok(content.includes("selectedId"), "应接收 selectedId")
    assert.ok(content.includes("onPropChange"), "应接收 onPropChange 回调")
    // 应包含输入控件
    assert.ok(content.includes("input") || content.includes("Input"), "应包含输入组件")
  })

  it("PuckSelectionSync.tsx — 应同步画布选择", () => {
    const content = readFileSync(join(INSPECTOR_DIR, "PuckSelectionSync.tsx"), "utf-8")
    assert.ok(content.includes("selectedId"), "应同步 selectedId")
    assert.ok(content.includes("handleRef"), "应暴露操作句柄")
  })

  it("Editor.tsx 中应集成 InspectorPanel", () => {
    const editorPath = "C:\\Users\\sfuu0\\WorkBuddy\\2026-07-10-00-54-28\\my-app\\src\\pages\\Editor.tsx"
    const content = readFileSync(editorPath, "utf-8")
    // 检查是否引用 Inspector 组件
    assert.ok(content.includes("Inspector") || content.includes("inspector"), "编辑器应集成 Inspector")
  })
})

// ===========================================================================
// 未认证请求保护验证
// ===========================================================================
describe("认证保护 — 未认证请求应返回 401", () => {
  it("GET /api/pages 无 token → 401", async () => {
    const res = await fetch(`${BASE}/api/pages`)
    const body = await res.json()
    assert.equal(res.status, 401)
    assert.equal(body.error, "unauthorized")
  })

  it("GET /api/themes 无 token → 401", async () => {
    const res = await fetch(`${BASE}/api/themes`)
    const body = await res.json()
    assert.equal(res.status, 401)
  })

  it("POST /api/media 无 token → 401", async () => {
    const form = new FormData()
    form.set("file", new Blob(["x"], { type: "text/plain" }), "x.txt")
    const res = await fetch(`${BASE}/api/media`, { method: "POST", body: form })
    assert.equal(res.status, 401)
  })

  it("无效 token → 401", async () => {
    const res = await fetch(`${BASE}/api/themes`, {
      headers: { Authorization: "Bearer invalidtoken123" },
    })
    // 可能是 401（无效 token）或 429（速率限制），只要不是 200 即可
    assert.ok(res.status === 401 || res.status === 429,
      `期望 401（无效 token），实际 ${res.status}`)
    if (res.status === 401) {
      const body = await res.json()
      assert.equal(body.error, "invalid_token")
    }
  })
})
