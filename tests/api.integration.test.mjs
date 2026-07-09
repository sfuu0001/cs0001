// tests/api.integration.test.mjs
// API 集成测试 —— 覆盖页面 CRUD、编辑器、发布/预览、回收站、分页等核心流。
// 使用 Node 内置 node:test + node:assert，零额外依赖。

import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"

const BASE = "http://localhost:3001"

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

async function api(path, opts = {}) {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  })
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
// 测试套件
// ---------------------------------------------------------------------------

describe("页面编辑器 API 集成测试", () => {
  // 用于测试的页面 ID 引用
  let pageId
  let pageSlug
  let page2Id
  let page2Slug

  // ----- 1. 空列表 ------------------------------------------------
  it("GET /api/pages — 初始列表为空", async () => {
    const { status, body } = await jget("/api/pages")
    assert.equal(status, 200)
    assert.deepEqual(body.data, [])
    assert.equal(body.total, 0)
    assert.ok(body.page !== undefined)
    assert.ok(body.limit !== undefined)
  })

  // ----- 2. 创建页面 ------------------------------------------------
  it("POST /api/pages — 创建「测试页A」，应返回 201 + page，slug 自动生成", async () => {
    const { status, body } = await post("/api/pages", { title: "测试页A" })
    assert.equal(status, 201)
    assert.ok(body.page)
    assert.ok(body.page.id)
    assert.equal(body.page.title, "测试页A")
    assert.ok(body.page.slug)
    assert.equal(body.page.status, "draft")
    pageId = body.page.id
    pageSlug = body.page.slug
  })

  // ----- 3. 同名标题 slug 唯一化 ------------------------------------
  it("POST /api/pages — 再创建同名「测试页A」，slug 应不同", async () => {
    const { status, body } = await post("/api/pages", { title: "测试页A" })
    assert.equal(status, 201)
    assert.ok(body.page.slug)
    assert.notEqual(body.page.slug, pageSlug, "同名标题的 slug 应唯一")
    page2Id = body.page.id
    page2Slug = body.page.slug
  })

  // ----- 4. GET 详情 ------------------------------------------------
  it("GET /api/pages/:id — 按 id 获取页面详情", async () => {
    const { status, body } = await jget(`/api/pages/${pageId}`)
    assert.equal(status, 200)
    assert.ok(body.page)
    assert.equal(body.page.id, pageId)
    assert.equal(body.page.title, "测试页A")
  })

  // ----- 5. Save → Load 内容一致性 ---------------------------------
  it("POST /api/save/:pageId → GET /api/load/:pageId — 写入并读取内容一致", async () => {
    const puckData = {
      root: { props: { title: "Hello" } },
      content: [
        {
          type: "HeadingBlock",
          props: { text: "我的标题" },
        },
      ],
    }
    // 保存
    const saveRes = await post(`/api/save/${pageId}`, { content: puckData })
    assert.equal(saveRes.status, 200)
    assert.equal(saveRes.body.ok, true)

    // 载入
    const loadRes = await jget(`/api/load/${pageId}`)
    assert.equal(loadRes.status, 200)
    assert.deepEqual(loadRes.body.content, puckData)
  })

  // ----- 6. 空内容发布 → 400 ---------------------------------------
  it("POST /api/pages/:id/publish — 空内容应返回 400 empty_content", async () => {
    const { status, body } = await post(`/api/pages/${page2Id}/publish`)
    assert.equal(status, 400)
    assert.equal(body.error, "empty_content")
  })

  // ----- 7. 非空内容 → 发布成功 ------------------------------------
  it("POST /api/pages/:id/publish — 填入内容后发布成功", async () => {
    // 先保存内容
    const puckData = {
      root: { props: {} },
      content: [{ type: "HeadingBlock", props: { text: "可发布内容" } }],
    }
    await post(`/api/save/${pageId}`, { content: puckData })

    const { status, body } = await post(`/api/pages/${pageId}/publish`)
    assert.equal(status, 200)
    assert.equal(body.page.status, "published")
    assert.ok(body.page.publishedAt, "publishedAt 应存在")
  })

  // ----- 8. 取消发布 ------------------------------------------------
  it("POST /api/pages/:id/unpublish — 取消发布后 status 应为 draft", async () => {
    const { status, body } = await post(`/api/pages/${pageId}/unpublish`)
    assert.equal(status, 200)
    assert.equal(body.page.status, "draft")
    assert.equal(body.page.publishedAt, null)
  })

  // ----- 9. 预览 + view_count 递增 ----------------------------------
  it("GET /api/preview/:pageId — 预览返回内容且 view_count 递增", async () => {
    // 先发布以便有内容（预览不检查 content）
    const puckData = {
      root: { props: {} },
      content: [{ type: "HeadingBlock", props: { text: "预览内容" } }],
    }
    await post(`/api/save/${pageId}`, { content: puckData })

    // 第一次预览：view_count 应为 1
    const r1 = await jget(`/api/preview/${pageId}`)
    assert.equal(r1.status, 200)
    assert.ok(r1.body.content)

    // 获取页面详情确认 view_count
    const detail1 = await jget(`/api/pages/${pageId}`)
    assert.equal(detail1.body.page.viewCount, 1, "首次预览后 viewCount 应为 1")

    // 第二次预览：view_count 应为 2
    const r2 = await jget(`/api/preview/${pageId}`)
    assert.equal(r2.status, 200)
    assert.ok(r2.body.content)

    const detail2 = await jget(`/api/pages/${pageId}`)
    assert.equal(detail2.body.page.viewCount, 2, "二次预览后 viewCount 应为 2")
  })

  // ----- 10. 复制页面 -----------------------------------------------
  it("POST /api/pages/:id/duplicate — 复制页面", async () => {
    const { status, body } = await post(`/api/pages/${pageId}/duplicate`)
    assert.equal(status, 201)
    assert.ok(body.page)
    assert.notEqual(body.page.id, pageId, "复制页应有新 id")
    assert.ok(body.page.title.includes("副本"), "标题应含「副本」")
    assert.equal(body.page.status, "draft", "复制页状态应为 draft")
    // content 应与源一致
    assert.ok(body.page.content)
    assert.equal(body.page.status, "draft")
  })

  // ----- 11. 软删除 -------------------------------------------------
  it("DELETE /api/pages/:id — 软删除页面", async () => {
    // 删除前列表应有页面
    const beforeList = await jget("/api/pages")
    assert.ok(beforeList.body.data.length > 0)

    // 删除
    const { status, body } = await del(`/api/pages/${pageId}`)
    assert.equal(status, 200)
    assert.equal(body.ok, true)

    // 普通列表不应包含
    const listNormal = await jget("/api/pages")
    const ids = listNormal.body.data.map((p) => p.id)
    assert.equal(ids.includes(pageId), false, "普通列表不应含已删页面")

    // 回收站列表应出现
    const listDeleted = await jget("/api/pages?deleted=1")
    const deletedIds = listDeleted.body.data.map((p) => p.id)
    assert.ok(deletedIds.includes(pageId), "回收站列表应含已删页面")

    // 详情应 404
    const detail = await jget(`/api/pages/${pageId}`)
    assert.equal(detail.status, 404)
  })

  // ----- 12. 恢复软删 -----------------------------------------------
  it("POST /api/pages/:id/restore — 恢复已删页面", async () => {
    const { status, body } = await post(`/api/pages/${pageId}/restore`)
    assert.equal(status, 200)
    assert.ok(body.page)
    assert.equal(body.page.id, pageId)

    // 列表应恢复
    const listNormal = await jget("/api/pages")
    const ids = listNormal.body.data.map((p) => p.id)
    assert.ok(ids.includes(pageId), "恢复后普通列表应含该页面")

    // 回收站不应再出现
    const listDeleted = await jget("/api/pages?deleted=1")
    const deletedIds = listDeleted.body.data.map((p) => p.id)
    assert.equal(deletedIds.includes(pageId), false, "回收站不应含已恢复页面")
  })

  // ----- 13. 不存在 load → 404 --------------------------------------
  it("GET /api/load/:nonexistent — 不存在页面应返回 404", async () => {
    const { status, body } = await jget("/api/load/00000000-0000-0000-0000-000000000000")
    assert.equal(status, 404)
    assert.equal(body.error, "not_found")
  })

  // ----- 14. 分页稳定性 ---------------------------------------------
  it("分页 — 创建 ≥12 条后验证 page=2, limit=10 及越界回退", async () => {
    // 创建批量页面（确保总数 ≥ 12）
    const existing = await jget("/api/pages")
    const need = 12 - existing.body.data.length
    const createdIds = []
    for (let i = 0; i < Math.max(need, 12); i++) {
      const r = await post("/api/pages", { title: `分页测试页 ${i + 1}` })
      if (r.status === 201) createdIds.push(r.body.page.id)
    }

    // 第 1 页 limit=10
    const p1 = await jget("/api/pages?page=1&limit=10")
    assert.equal(p1.status, 200)
    assert.equal(p1.body.data.length, 10)
    assert.ok(p1.body.total >= 12)

    // 第 2 页 limit=10（应返回剩余条目）
    const p2 = await jget("/api/pages?page=2&limit=10")
    assert.equal(p2.status, 200)
    assert.ok(p2.body.data.length > 0)
    assert.equal(p2.body.page, 2)

    // 两页数据不重复
    const p1Ids = p1.body.data.map((p) => p.id)
    const p2Ids = p2.body.data.map((p) => p.id)
    for (const id2 of p2Ids) {
      assert.equal(p1Ids.includes(id2), false, "分页不应有重复数据")
    }

    // 越界 page 应回退到第 1 页
    const overflow = await jget("/api/pages?page=999&limit=10")
    assert.equal(overflow.status, 200)
    assert.equal(overflow.body.page, 1)
    assert.ok(overflow.body.data.length > 0)

    // 清理批量创建的页面（软删以便后续测试干净）
    for (const id of createdIds) {
      await del(`/api/pages/${id}`)
    }
  })

  // ----- 15. 创建时 title 为空 → 400 --------------------------------
  it("POST /api/pages — 空标题返回 400", async () => {
    const { status, body } = await post("/api/pages", { title: "" })
    assert.equal(status, 400)
    assert.equal(body.error, "title_required")
  })

  // ----- 16. 更新页面标题 -------------------------------------------
  it("PUT /api/pages/:id — 更新页面标题", async () => {
    const { status, body } = await put(`/api/pages/${pageId}`, {
      title: "更新后的标题",
    })
    assert.equal(status, 200)
    assert.equal(body.page.title, "更新后的标题")
  })

  // ----- 17. 更新不存在页面 → 404 -----------------------------------
  it("PUT /api/pages/:nonexistent — 不存在页面返回 404", async () => {
    const { status } = await put(
      "/api/pages/00000000-0000-0000-0000-000000000000",
      { title: "不存在" }
    )
    assert.equal(status, 404)
  })

  // ----- 18. 删除不存在页面 → 404 -----------------------------------
  it("DELETE /api/pages/:nonexistent — 不存在页面返回 404", async () => {
    const { status } = await del(
      "/api/pages/00000000-0000-0000-0000-000000000000"
    )
    assert.equal(status, 404)
  })

  // ----- 19. 健康检查 -----------------------------------------------
  it("GET /api/hello — 健康检查", async () => {
    const { status, body } = await jget("/api/hello")
    assert.equal(status, 200)
    assert.ok(body.message)
  })

  // ----- 20. 404 兜底 -----------------------------------------------
  it("GET /api/nonexistent — 接口不存在返回 404", async () => {
    const { status, body } = await jget("/api/nonexistent")
    assert.equal(status, 404)
    assert.equal(body.error, "not_found")
  })
})
