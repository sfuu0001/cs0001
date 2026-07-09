// src/puck/components/advanced/RichText.tsx
// 富文本展示组件：dangerouslySetInnerHTML + 可选工具栏

import type { ComponentConfig } from "@measured/puck"

export type RichTextProps = {
  content: string
  toolbar: string
}

const toolbarButtons = [
  { label: "B", tag: "b", title: "粗体" },
  { label: "I", tag: "i", title: "斜体" },
  { label: "U", tag: "u", title: "下划线" },
]

export const RichText: ComponentConfig<RichTextProps> = {
  fields: {
    content: { type: "textarea" },
    toolbar: {
      type: "radio",
      options: [
        { label: "显示", value: "true" },
        { label: "隐藏", value: "false" },
      ],
    },
  },
  defaultProps: {
    content: "<h2>富文本标题</h2><p>这是一段<strong>富文本</strong>内容。</p>",
    toolbar: "true",
  },
  render: ({ content, toolbar }: RichTextProps) => (
    <div className="w-full space-y-2">
      {/* Toolbar */}
      {toolbar === "true" && (
        <div className="flex items-center gap-1 rounded-t-lg border border-border bg-muted/50 p-2">
          {toolbarButtons.map((btn) => (
            <button
              key={btn.label}
              type="button"
              title={btn.title}
              className="rounded px-2 py-1 text-sm font-bold text-foreground hover:bg-muted focus:outline-none"
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
      {/* Content */}
      <div
        className={`prose prose-sm max-w-none rounded-b-lg border border-border p-4 text-foreground ${
          toolbar === "true" ? "rounded-t-none border-t-0" : "rounded-lg"
        }`}
        dangerouslySetInnerHTML={{ __html: content || "" }}
      />
    </div>
  ),
}
