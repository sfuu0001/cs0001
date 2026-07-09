// src/types/media.ts
// 媒体文件类型定义。

export interface Media {
  id: string
  filename: string
  originalName: string
  path: string
  url: string
  mimeType: string
  size: number
  width?: number
  height?: number
  alt: string
  tags: string[]
  createdAt: string
}

/** GET /api/media 查询参数 */
export interface MediaListParams {
  page?: number
  limit?: number
  search?: string
  mimeType?: string
}

/** 列表响应信封 */
export interface MediaListResponse {
  data: Media[]
  total: number
  page: number
  limit: number
}

/** 单资源响应信封 */
export interface MediaResponse {
  media: Media
}

/** 批量上传响应 */
export interface MediaBatchResponse {
  media: Media[]
  count: number
}

/** 更新元数据入参 */
export interface UpdateMediaInput {
  alt?: string
  tags?: string[]
}
