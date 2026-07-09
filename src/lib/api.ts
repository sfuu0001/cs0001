// src/lib/api.ts
// 统一封装全部后端接口调用（listPages / getPage / createPage / updatePage / deletePage /
// publish / unpublish / duplicate / restore / loadPage / savePage / previewPage）。
// 约定：非 2xx 响应抛出 ApiClientError（携带状态码），由调用方 try/catch 处理。

import type { Data } from "@measured/puck"
import type {
  Page,
  PageListParams,
  PageListResponse,
  PageResponse,
  OkResponse,
  ContentResponse,
  ApiErrorBody,
} from "@/types/page"

const BASE = "/api"

/** 带状态码的 API 错误 */
export class ApiClientError extends Error {
  status: number
  error: string
  constructor(status: number, error: string, message?: string) {
    super(message || error)
    this.name = "ApiClientError"
    this.status = status
    this.error = error
  }
}

/**
 * 底层请求封装：统一设置 JSON 头，非 2xx 抛出 ApiClientError。
 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    let body: ApiErrorBody = { error: "unknown" }
    try {
      body = (await res.json()) as ApiErrorBody
    } catch {
      // 响应体非 JSON 时忽略，保留默认错误结构
    }
    throw new ApiClientError(res.status, body.error, body.message)
  }
  return (await res.json()) as T
}

/** POST/PUT 的 JSON body 封装 */
function jsonBody(body: unknown): RequestInit {
  return { method: "POST", body: JSON.stringify(body) }
}

/** 列表（分页 / 状态筛选 / 搜索 / 回收站） */
export async function listPages(
  params: PageListParams = {}
): Promise<PageListResponse> {
  const qs = new URLSearchParams()
  if (params.page) qs.set("page", String(params.page))
  if (params.limit) qs.set("limit", String(params.limit))
  if (params.status) qs.set("status", params.status)
  if (params.search) qs.set("search", params.search)
  if (params.deleted) qs.set("deleted", "1")
  const query = qs.toString()
  return request<PageListResponse>(`/pages${query ? `?${query}` : ""}`)
}

/** 详情 */
export async function getPage(id: string): Promise<Page> {
  const res = await request<PageResponse>(`/pages/${id}`)
  return res.page
}

/** 创建页面入参 */
export interface CreatePageInput {
  title: string
  slug?: string
  description?: string
}

/** 创建草稿 */
export async function createPage(input: CreatePageInput): Promise<Page> {
  const res = await request<PageResponse>("/pages", jsonBody(input))
  return res.page
}

/** 更新页面入参 */
export interface UpdatePageInput {
  title?: string
  description?: string
  content?: Data
  status?: string
  slug?: string
  metadata?: Record<string, unknown>
}

/** 局部更新 */
export async function updatePage(
  id: string,
  patch: UpdatePageInput
): Promise<Page> {
  const res = await request<PageResponse>(`/pages/${id}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  })
  return res.page
}

/** 软删除 */
export async function deletePage(id: string): Promise<void> {
  await request<OkResponse>(`/pages/${id}`, { method: "DELETE" })
}

/** 发布 */
export async function publishPage(id: string): Promise<Page> {
  const res = await request<PageResponse>(`/pages/${id}/publish`, {
    method: "POST",
  })
  return res.page
}

/** 取消发布 */
export async function unpublishPage(id: string): Promise<Page> {
  const res = await request<PageResponse>(`/pages/${id}/unpublish`, {
    method: "POST",
  })
  return res.page
}

/** 复制 */
export async function duplicatePage(id: string): Promise<Page> {
  const res = await request<PageResponse>(`/pages/${id}/duplicate`, {
    method: "POST",
  })
  return res.page
}

/** 恢复软删 */
export async function restorePage(id: string): Promise<Page> {
  const res = await request<PageResponse>(`/pages/${id}/restore`, {
    method: "POST",
  })
  return res.page
}

/** 编辑器载入内容 */
export async function loadPage(pageId: string): Promise<Data> {
  const res = await request<ContentResponse>(`/load/${pageId}`)
  return res.content
}

/** 编辑器保存内容 */
export async function savePage(pageId: string, content: Data): Promise<void> {
  await request<OkResponse>(
    `/save/${pageId}`,
    jsonBody({ content })
  )
}

/** 公开只读预览（后端每次 viewCount + 1） */
export async function previewPage(pageId: string): Promise<Data> {
  const res = await request<ContentResponse>(`/preview/${pageId}`)
  return res.content
}
