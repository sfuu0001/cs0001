// src/types/template.ts
// 模板类型定义。

export interface Template {
  id: string
  name: string
  description: string
  content: unknown
  thumbnail?: string
  category: string
  isPreset: boolean
  createdAt: string
  updatedAt: string
}

/** GET /api/templates 查询参数 */
export interface TemplateListParams {
  page?: number
  limit?: number
  category?: string
}

/** 列表响应信封 */
export interface TemplateListResponse {
  data: Template[]
  total: number
  page: number
  limit: number
}

/** 单资源响应信封 */
export interface TemplateResponse {
  template: Template
}
