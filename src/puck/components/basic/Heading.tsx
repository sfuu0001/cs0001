// src/puck/components/basic/Heading.tsx
// 标题基础组件：text + level(h1/h2/h3)

import { createElement } from "react"
import type { ComponentConfig } from "@measured/puck"

export type HeadingProps = {
  text: string
  level: "h1" | "h2" | "h3"
}

const sizeByLevel: Record<HeadingProps["level"], string> = {
  h1: "text-4xl",
  h2: "text-2xl",
  h3: "text-xl",
}

export const Heading: ComponentConfig<HeadingProps> = {
  fields: {
    text: { type: "text" },
    level: {
      type: "select",
      options: [
        { label: "H1", value: "h1" },
        { label: "H2", value: "h2" },
        { label: "H3", value: "h3" },
      ],
    },
  },
  defaultProps: { text: "标题文字", level: "h2" },
  render: ({ text, level }: HeadingProps) =>
    createElement(
      level,
      { className: `font-bold text-foreground ${sizeByLevel[level]}` },
      text
    ),
}
