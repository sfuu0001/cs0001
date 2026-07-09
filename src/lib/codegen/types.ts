// src/lib/codegen/types.ts
// 代码生成引擎的类型定义

/** 代码生成选项 */
export interface GenerateOptions {
  /** 是否包含 import 语句 */
  includeImports?: boolean
  /** 导出的组件名 */
  componentName?: string
  /** 是否添加 className prop */
  includeClassName?: boolean
  /** 缩进字符数 */
  indentSize?: number
}

/** Puck 数据中的单个内容节点 */
export interface ContentNode {
  type: string
  props?: Record<string, unknown>
  children?: ContentNode[]
}

/** 渲染器函数签名：接收 props，返回 JSX 字符串 */
export type RendererFn = (
  props: Record<string, unknown>,
  children: ContentNode[],
  indent: string,
  options: GenerateOptions
) => string

export const DEFAULT_OPTIONS: GenerateOptions = {
  includeImports: true,
  componentName: "GeneratedPage",
  includeClassName: true,
  indentSize: 2,
}
