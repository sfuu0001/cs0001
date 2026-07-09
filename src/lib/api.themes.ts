// src/lib/api.themes.ts
// 主题 API 调用封装（参考一期 api.ts 模式）。

import type {
  Theme,
  ThemeListParams,
  ThemeListResponse,
  ThemeResponse,
} from "@/types/theme"
import type { OkResponse } from "@/types/page"

const BASE = "/api/themes"

/**
 * 底层请求封装。
 */
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
export async function listThemes(
  params: ThemeListParams = {}
): Promise<ThemeListResponse> {
  const qs = new URLSearchParams()
  if (params.page) qs.set("page", String(params.page))
  if (params.limit) qs.set("limit", String(params.limit))
  if (params.search) qs.set("search", params.search)
  const query = qs.toString()
  return request<ThemeListResponse>(`${query ? `?${query}` : ""}`)
}

/** 详情 */
export async function getTheme(id: string): Promise<Theme> {
  const res = await request<ThemeResponse>(`/${id}`)
  return res.theme
}

/** 创建 */
export async function createTheme(data: {
  name: string
  description?: string
  variables?: Record<string, string>
}): Promise<Theme> {
  const res = await request<ThemeResponse>("", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return res.theme
}

/** 更新 */
export async function updateTheme(
  id: string,
  data: { name?: string; description?: string; variables?: Record<string, string> }
): Promise<Theme> {
  const res = await request<ThemeResponse>(`/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return res.theme
}

/** 删除 */
export async function deleteTheme(id: string): Promise<void> {
  await request<OkResponse>(`/${id}`, { method: "DELETE" })
}

/** 导入主题 */
export async function importTheme(data: {
  name: string
  description?: string
  variables: Record<string, string>
}): Promise<Theme> {
  const res = await request<ThemeResponse>("/import", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return res.theme
}

/** 导出主题 */
export async function exportTheme(id: string): Promise<{ variables: Record<string, string> }> {
  return request<{ variables: Record<string, string> }>(`/${id}/export`)
}

/** 应用到页面 */
export async function applyThemeToPage(
  themeId: string,
  pageId: string
): Promise<void> {
  await request<OkResponse>(`/${themeId}/apply`, {
    method: "POST",
    body: JSON.stringify({ pageId }),
  })
}
