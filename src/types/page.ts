// src/types/page.ts
// 前端 Page 类型与各 API 响应类型（字段与后端模型对齐：camelCase）。
// T02: 扩展 PageMetadata 接口支持 SEO 元数据。

import type { Data } from "@measured/puck"

/** 页面状态 */
export type PageStatus = "draft" | "published" | "archived"

/** SEO 元数据 */
export interface SeoMetadata {
  /** SEO 标题（覆盖 page.title） */
  title?: string
  /** SEO 描述 */
  description?: string
  /** SEO 关键词列表 */
  keywords?: string[]
  /** Open Graph 分享图片 URL */
  ogImage?: string
}

/** 页面元数据 */
export interface PageMetadata {
  /** SEO 设置 */
  seo?: SeoMetadata
  /** 关联主题 ID */
  themeId?: string
  /** 其他自定义元数据 */
  [key: string]: unknown
}

/** 前端页面对象（与后端 camelCase 响应一致） */
export interface Page {
  id: string
  title: string
  slug: string
  description: string
  /** Puck Data 结构：{ root, content, zones? } */
  content: Data
  status: PageStatus
  viewCount: number
  createdAt: string | null
  updatedAt: string | null
  publishedAt: string | null
  deletedAt: string | null
  metadata: PageMetadata
}

/** GET /api/pages 查询参数 */
export interface PageListParams {
  page?: number
  limit?: number
  status?: string
  search?: string
  /** true 时仅列出已软删（回收站） */
  deleted?: boolean
}

/** 列表响应信封 */
export interface PageListResponse {
  data: Page[]
  total: number
  page: number
  limit: number
}

/** 单资源响应信封 */
export interface PageResponse {
  page: Page
}

/** 写操作成功信封 */
export interface OkResponse {
  ok: true
}

/** 内容响应信封（load / preview） */
export interface ContentResponse {
  content: Data
}

/** 错误响应信封 */
export interface ApiErrorBody {
  error: string
  message?: string
}
