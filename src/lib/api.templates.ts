// src/lib/api.templates.ts
// 模板 API 调用封装（参考一期 api.ts 模式）。

import type {
  Template,
  TemplateListParams,
  TemplateListResponse,
  TemplateResponse,
} from "@/types/template"
import type { OkResponse } from "@/types/page"

const BASE = "/api/templates"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    let body: { error?: string; message?: string } = { error: "unknown" }
    try {
      body = (await res.json()) as { error?: string; message?: string }
    } catch {
      // ignore
    }
    throw new Error(body.message || body.error || `HTTP ${res.status}`)
  }
  return (await res.json()) as T
}

/** 列表 */
export async function listTemplates(
  params: TemplateListParams = {}
): Promise<TemplateListResponse> {
  const qs = new URLSearchParams()
  if (params.page) qs.set("page", String(params.page))
  if (params.limit) qs.set("limit", String(params.limit))
  if (params.category) qs.set("category", params.category)
  const query = qs.toString()
  return request<TemplateListResponse>(`${query ? `?${query}` : ""}`)
}

/** 详情 */
export async function getTemplate(id: string): Promise<Template> {
  const res = await request<TemplateResponse>(`/${id}`)
  return res.template
}

/** 创建 */
export async function createTemplate(data: {
  name: string
  description?: string
  content?: unknown
  category?: string
}): Promise<Template> {
  const res = await request<TemplateResponse>("", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return res.template
}

/** 删除 */
export async function deleteTemplate(id: string): Promise<void> {
  await request<OkResponse>(`/${id}`, { method: "DELETE" })
}

/** 应用到页面 */
export async function applyTemplate(
  id: string,
  pageId?: string
): Promise<void> {
  await request<OkResponse>(`/${id}/apply`, {
    method: "POST",
    body: JSON.stringify({ pageId }),
  })
}
