// src/lib/codegen/index.ts
// 代码生成引擎主入口：将 Puck Data 转换为 React JSX 源码

import type { Data } from "@measured/puck"
import type { ContentNode, GenerateOptions } from "./types"
import { DEFAULT_OPTIONS } from "./types"
import { renderNode } from "./renderers"

/** 从 Puck Data 的 content 数组中递归提取组件树 */
function extractContent(content: unknown[]): ContentNode[] {
  if (!Array.isArray(content)) return []
  return content
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === "object")
    .map((item) => {
      const node: ContentNode = {
        type: String(item.type || "Unknown"),
        props: (item.props as Record<string, unknown>) || {},
      }
      const props = item.props as Record<string, unknown> | undefined
      if (props && Array.isArray(props.children)) {
        node.children = extractContent(props.children)
      }
      return node
    })
}

/**
 * 将 Puck Data 生成为 React JSX 源码字符串
 * @param data - Puck 编辑器数据
 * @param options - 生成选项
 * @returns 完整的 .tsx 文件内容
 */
export function generateComponent(data: Data, options?: Partial<GenerateOptions>): string {
  const opts: GenerateOptions = { ...DEFAULT_OPTIONS, ...options }
  const nodes = extractContent(data.content)
  const compName = opts.componentName || "GeneratedPage"

  const lines: string[] = []

  // imports
  if (opts.includeImports) {
    lines.push(`import React from "react"`)
    lines.push("")
  }

  // 接口定义
  lines.push(`interface ${compName}Props {`)
  if (opts.includeClassName) {
    lines.push(`  className?: string`)
  }
  lines.push("}")
  lines.push("")

  // 组件函数
  lines.push(`export default function ${compName}({ ${opts.includeClassName ? "className" : ""} }: ${compName}Props) {`)
  lines.push(`  return (`)
  lines.push(`    <div className={${opts.includeClassName ? '"' + cls("max-w-7xl mx-auto px-4 py-8", "") + '" + (className ? " " + className : "")' : '"max-w-7xl mx-auto px-4 py-8"'}}>`)

  if (nodes.length === 0) {
    lines.push("      {/* 页面内容为空 */}")
  } else {
    nodes.forEach((node) => {
      const rendered = renderNode(node, 3, opts)
      lines.push(rendered)
    })
  }

  lines.push("    </div>")
  lines.push("  )")
  lines.push("}")
  lines.push("")

  // 工具函数
  if (!opts.includeImports) {
    lines.push("function cn(...classes: (string | undefined)[]) {")
    lines.push('  return classes.filter(Boolean).join(" ")')
    lines.push("}")
  }

  return lines.join("\n")
}

function cls(...items: (string | undefined)[]): string {
  return items.filter(Boolean).join(" ")
}

/** 获取所有已注册组件类型列表 */
export function getRegisteredComponentTypes(): string[] {
  // 从 renderers 中反查，提供一个已知的键列表
  return [
    // 一期基础
    "Heading", "Text", "Image", "Button", "Input", "Divider", "Badge", "Alert",
    // 二期布局
    "Container", "Row", "Column", "Grid", "Card", "Section", "Tabs",
    // 二期展示
    "Accordion", "Carousel", "Table", "List", "Progress", "Video",
    // 二期表单
    "Form", "FormInput", "FormSelect", "FormCheckbox", "FormSwitch",
    // 二期高级
    "Modal", "Drawer", "Dropdown", "RichText", "Upload",
    // P0 新展示
    "Skeleton", "CodeBlock", "MarkdownPreview", "IframeEmbed", "CountUp", "DataTable", "EmptyState", "Stepper",
  ]
}
