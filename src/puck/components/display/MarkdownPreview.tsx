// src/puck/components/display/MarkdownPreview.tsx
// Markdown 纯展示组件：white-space: pre-wrap + GitHub 风格

import { memo } from "react"
import type { ComponentConfig } from "@measured/puck"

export type MarkdownPreviewProps = {
  content: string
  maxHeight: string
}

const MarkdownPreviewRender = memo(function MarkdownPreviewRender({ content, maxHeight }: MarkdownPreviewProps) {
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-lg border border-border bg-background p-4 font-mono text-sm leading-relaxed text-foreground overflow-auto"
      style={{ maxHeight: maxHeight || "none" }}
    >
      {content}
    </div>
  )
})

MarkdownPreviewRender.displayName = "MarkdownPreviewRender"

export const MarkdownPreview: ComponentConfig<MarkdownPreviewProps> = {
  fields: {
    content: { type: "textarea" },
    maxHeight: { type: "text" },
  },
  defaultProps: {
    content: "# 标题\n\n这是一段 **Markdown** 文本。\n\n- 项目 1\n- 项目 2\n- 项目 3",
    maxHeight: "",
  },
  render: (props: MarkdownPreviewProps) => <MarkdownPreviewRender {...props} />,
}
