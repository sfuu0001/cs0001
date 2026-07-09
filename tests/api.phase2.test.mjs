// tests/api.phase2.test.mjs
// API 集成测试 —— 二期/三期新增 API：主题、媒体、模板、静态导出。
// 使用 Node 内置 node:test + node:assert，零额外依赖。

import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"

const BASE = "http://localhost:3001"

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

async function api(path, opts = {}) {
  const url = `${BASE}${path}`
  const headers = { ...opts.headers }
  // 仅当不是 FormData 时设置默认 Content-Type
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
  return api(path, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

function put(path, data) {
  return api(path, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

function del(path) {
  return api(path, { method: "DELETE" })
}

function jget(path) {
  return api(path, { method: "GET" })
}

// ---------------------------------------------------------------------------
// 主题 API 测试
// ---------------------------------------------------------------------------

describe("主题 API 测试", () => {
  let presetThemeId
  let customThemeId

  it("GET /api/themes — 初始列表包含 5 个预设主题", async () => {
    const { status, body } = await jget("/api/themes")
    assert.equal(status, 200)
    assert.equal(body.data.length, 5)
    assert.equal(body.total, 5)
    assert.equal(body.data[0].isPreset, true)
    presetThemeId = body.data[0].id
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

  it("GET /api/themes/:id — 获取自定义主题详情", async () => {
    const { status, body } = await jget(`/api/themes/${customThemeId}`)
    assert.equal(status, 200)
    assert.equal(body.theme.name, "我的主题")
    assert.equal(body.theme.isPreset, false)
    assert.deepEqual(body.theme.variables, { "--primary": "#ff0000" })
  })

  it("PUT /api/themes/:id — 更新主题变量", async () => {
    const { status, body } = await put(`/api/themes/${customThemeId}`, {
      variables: { "--primary": "#00ff00", "--background": "#fff" },
      name: "我的主题（已更新）",
    })
    assert.equal(status, 200)
    assert.equal(body.theme.name, "我的主题（已更新）")
    assert.deepEqual(body.theme.variables, {
      "--primary": "#00ff00",
      "--background": "#fff",
    })
  })

  it("POST /api/themes/import — 导入主题", async () => {
    const { status, body } = await post("/api/themes/import", {
      name: "导入主题",
      description: "从JSON导入",
      variables: {
        "--primary": "#00ff00",
        "--background": "#000",
      },
    })
    assert.equal(status, 201)
    assert.equal(body.theme.name, "导入主题")
    assert.equal(body.theme.description, "从JSON导入")
    assert.deepEqual(body.theme.variables, {
      "--primary": "#00ff00",
      "--background": "#000",
    })
    assert.equal(body.theme.isPreset, false)
  })

  it("GET /api/themes/:id/export — 导出主题变量", async () => {
    const { status, body } = await jget(
      `/api/themes/${presetThemeId}/export`
    )
    assert.equal(status, 200)
    assert.ok(body.variables)
    assert.ok(body.variables["--primary"])
    assert.ok(body.variables["--background"])
  })

  it("POST /api/themes/:id/apply — 应用到页面", async () => {
    // 先创建页面
    const pageRes = await post("/api/pages", { title: "主题测试页" })
    assert.equal(pageRes.status, 201)
    const pageId = pageRes.body.page.id

    // 应用主题
    const { status, body } = await post(
      `/api/themes/${presetThemeId}/apply`,
      { pageId }
    )
    assert.equal(status, 200)
    assert.equal(body.ok, true)
    assert.ok(body.page)
    // 验证页面的 metadata 包含主题信息
    assert.equal(body.page.metadata.themeId, presetThemeId)
  })

  it("DELETE /api/themes/:id — 删除自定义主题（200）", async () => {
    const { status, body } = await del(`/api/themes/${customThemeId}`)
    assert.equal(status, 200)
    assert.equal(body.ok, true)

    // 确认已被删除
    const { status: status2 } = await jget(`/api/themes/${customThemeId}`)
    assert.equal(status2, 404)
  })

  it("DELETE /api/themes/:id — 删除预设主题返回 400", async () => {
    const { status, body } = await del(`/api/themes/${presetThemeId}`)
    assert.equal(status, 400)
    assert.equal(body.error, "preset_cannot_be_deleted")
  })
})

// ---------------------------------------------------------------------------
// 媒体 API 测试
// ---------------------------------------------------------------------------

describe("媒体 API 测试", () => {
  let mediaId

  it("POST /api/media — 上传文件", async () => {
    const form = new FormData()
    const blob = new Blob(["fake-image-content"], { type: "image/png" })
    form.set("file", blob, "test.png")
    const res = await fetch(BASE + "/api/media", { method: "POST", body: form })
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

  it("GET /api/media — 列表应有 1 条", async () => {
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

  it("GET /api/media?search= — 通过 search 搜索文件名", async () => {
    const { status, body } = await jget("/api/media?search=test.png")
    assert.equal(status, 200)
    assert.ok(body.data.length >= 1)
    assert.equal(body.data[0].id, mediaId)
  })

  it("GET /api/media?search= — 搜索不存在的文件返回空", async () => {
    const { status, body } = await jget(
      "/api/media?search=nonexistent_xyz.png"
    )
    assert.equal(status, 200)
    assert.equal(body.data.length, 0)
  })

  it("POST /api/media/batch — 批量上传", async () => {
    const form = new FormData()
    const blob1 = new Blob(["batch-file-1"], { type: "image/png" })
    const blob2 = new Blob(["batch-file-2"], { type: "image/jpeg" })
    form.append("files", blob1, "batch1.png")
    form.append("files", blob2, "batch2.jpg")
    const res = await fetch(BASE + "/api/media/batch", {
      method: "POST",
      body: form,
    })
    const body = await res.json()
    assert.equal(res.status, 201)
    assert.equal(body.count, 2)
    assert.equal(body.media.length, 2)
    assert.equal(body.media[0].originalName, "batch1.png")
    assert.equal(body.media[1].originalName, "batch2.jpg")
  })
})

// ---------------------------------------------------------------------------
// 模板 API 测试
// ---------------------------------------------------------------------------

describe("模板 API 测试", () => {
  let presetTemplateId
  let customTemplateId

  it("GET /api/templates — 列表包含 5 个预设模板", async () => {
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
      content: [
        {
          type: "Heading",
          props: { text: "我的模板标题", level: "h1" },
        },
      ],
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

  it("GET /api/templates/:id — 获取自定义模板详情", async () => {
    const { status, body } = await jget(`/api/templates/${customTemplateId}`)
    assert.equal(status, 200)
    assert.equal(body.template.name, "我的模板")
    assert.equal(body.template.isPreset, false)
    assert.equal(body.template.category, "custom")
  })

  it("POST /api/templates/:id/apply — 应用到页面", async () => {
    // 先创建页面
    const pageRes = await post("/api/pages", { title: "模板测试页" })
    assert.equal(pageRes.status, 201)
    const pageId = pageRes.body.page.id

    // 应用模板
    const { status, body } = await post(
      `/api/templates/${customTemplateId}/apply`,
      { pageId }
    )
    assert.equal(status, 200)
    assert.equal(body.ok, true)

    // 验证 page.content 与模板一致
    const pageDetail = await jget(`/api/pages/${pageId}`)
    assert.equal(pageDetail.status, 200)
    assert.deepEqual(pageDetail.body.page.content, {
      root: { props: {} },
      content: [
        {
          type: "Heading",
          props: { text: "我的模板标题", level: "h1" },
        },
      ],
    })
  })

  it("POST /api/templates/:id/apply — 应用到不存在的页面返回 404", async () => {
    const fakePageId = "00000000-0000-0000-0000-000000000000"
    const { status, body } = await post(
      `/api/templates/${customTemplateId}/apply`,
      { pageId: fakePageId }
    )
    assert.equal(status, 404)
    assert.equal(body.error, "page_not_found")
  })

  it("DELETE /api/templates/:id — 删除自定义模板", async () => {
    const { status, body } = await del(`/api/templates/${customTemplateId}`)
    assert.equal(status, 200)
    assert.equal(body.ok, true)

    // 确认被删除
    const { status: status2 } = await jget(
      `/api/templates/${customTemplateId}`
    )
    assert.equal(status2, 404)
  })

  it("DELETE /api/templates/:id — 预设模板返回 400", async () => {
    const { status, body } = await del(`/api/templates/${presetTemplateId}`)
    assert.equal(status, 400)
    assert.equal(body.error, "preset_cannot_be_deleted")
  })
})

// ---------------------------------------------------------------------------
// 静态导出测试
// ---------------------------------------------------------------------------

describe("静态导出测试", () => {
  let pageId

  it("先创建页面并保存内容", async () => {
    const pageRes = await post("/api/pages", { title: "导出测试页" })
    assert.equal(pageRes.status, 201)
    pageId = pageRes.body.page.id

    const puckData = {
      root: { props: {} },
      content: [
        { type: "Heading", props: { text: "导出内容", level: "h1" } },
      ],
    }
    const saveRes = await post(`/api/save/${pageId}`, { content: puckData })
    assert.equal(saveRes.status, 200)
    assert.equal(saveRes.body.ok, true)
  })

  it("GET /api/pages/:id/export?format=html — 返回合法 HTML", async () => {
    const res = await fetch(`${BASE}/api/pages/${pageId}/export?format=html`)
    assert.equal(res.status, 200)
    const html = await res.text()
    assert.ok(html.includes("<!DOCTYPE html>"), "应包含 DOCTYPE")
    assert.ok(html.includes("<html"), "应包含 html 开标签")
    assert.ok(html.includes("<head>"), "应包含 head")
    assert.ok(html.includes("<body"), "应包含 body")
    assert.ok(html.includes("</html>"), "应包含 html 闭标签")
    assert.ok(html.includes("</body>"), "应包含 body 闭标签")
    assert.ok(html.includes("导出内容"), "应包含页面内容文本")
  })
})
