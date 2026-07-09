// src/types/theme.ts
// 主题类型定义。

export interface ThemeVariables {
  [key: string]: string
}

export interface Theme {
  id: string
  name: string
  description: string
  variables: ThemeVariables
  isPreset: boolean
  previewImage?: string
  createdAt: string
  updatedAt: string
}

/** GET /api/themes 查询参数 */
export interface ThemeListParams {
  page?: number
  limit?: number
  search?: string
}

/** 列表响应信封 */
export interface ThemeListResponse {
  data: Theme[]
  total: number
  page: number
  limit: number
}

/** 单资源响应信封 */
export interface ThemeResponse {
  theme: Theme
}
