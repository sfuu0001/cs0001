// src/lib/api.media.ts
// 媒体 API 调用封装。上传使用 multipart/form-data（FormData），其余使用 JSON。

import type {
  Media,
  MediaListParams,
  MediaListResponse,
  MediaResponse,
  MediaBatchResponse,
  UpdateMediaInput,
} from "@/types/media"
import type { OkResponse } from "@/types/page"

const BASE = "/api/media"

/**
 * JSON 请求封装。
 */
async function jsonRequest<T>(path: string, options?: RequestInit): Promise<T> {
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
export async function listMedia(
  params: MediaListParams = {}
): Promise<MediaListResponse> {
  const qs = new URLSearchParams()
  if (params.page) qs.set("page", String(params.page))
  if (params.limit) qs.set("limit", String(params.limit))
  if (params.search) qs.set("search", params.search)
  if (params.mimeType) qs.set("mimeType", params.mimeType)
  const query = qs.toString()
  return jsonRequest<MediaListResponse>(`${query ? `?${query}` : ""}`)
}

/** 单文件上传（使用 FormData） */
export async function uploadMedia(
  file: File,
  alt?: string,
  tags?: string[]
): Promise<Media> {
  const formData = new FormData()
  formData.append("file", file)
  if (alt) formData.append("alt", alt)
  if (tags && tags.length > 0) formData.append("tags", JSON.stringify(tags))

  const res = await fetch(BASE, {
    method: "POST",
    body: formData,
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
  const data = (await res.json()) as MediaResponse
  return data.media
}

/** 更新元数据 */
export async function updateMediaMeta(
  id: string,
  data: UpdateMediaInput
): Promise<Media> {
  const res = await jsonRequest<MediaResponse>(`/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return res.media
}

/** 删除 */
export async function deleteMedia(id: string): Promise<void> {
  await jsonRequest<OkResponse>(`/${id}`, { method: "DELETE" })
}

/** 批量上传 */
export async function batchUpload(files: File[]): Promise<Media[]> {
  const formData = new FormData()
  files.forEach((f) => formData.append("files", f))

  const res = await fetch(`${BASE}/batch`, {
    method: "POST",
    body: formData,
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
  const data = (await res.json()) as MediaBatchResponse
  return data.media
}
