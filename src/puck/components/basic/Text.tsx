// src/puck/components/basic/Text.tsx
// 文本段落基础组件

import type { ComponentConfig } from "@measured/puck"

export type TextProps = {
  content: string
}

export const Text: ComponentConfig<TextProps> = {
  fields: {
    content: { type: "textarea" },
  },
  defaultProps: { content: "在这里输入一段文字说明。" },
  render: ({ content }: TextProps) => (
    <p className="whitespace-pre-wrap leading-7 text-muted-foreground">
      {content}
    </p>
  ),
}
