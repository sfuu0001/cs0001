// src/puck/components/layout/Section.tsx
// 区块布局组件：backgroundColor + padding + maxWidth + rounded + DropZone

import { memo } from "react"
import type { ComponentConfig } from "@measured/puck"
import { DropZone } from "@measured/puck"

export type SectionProps = {
  backgroundColor: string
  padding: "4" | "8" | "12" | "16"
  maxWidth: "full" | "screen-lg" | "screen-xl"
  rounded: "none" | "sm" | "lg"
}

const paddingMap: Record<SectionProps["padding"], string> = {
  "4": "p-4",
  "8": "p-8",
  "12": "p-12",
  "16": "p-16",
}

const maxWidthMap: Record<SectionProps["maxWidth"], string> = {
  full: "w-full",
  "screen-lg": "max-w-screen-lg",
  "screen-xl": "max-w-screen-xl",
}

const roundedMap: Record<SectionProps["rounded"], string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  lg: "rounded-lg",
}

const SectionRender = memo(function SectionRender({
  backgroundColor,
  padding,
  maxWidth,
  rounded,
}: SectionProps) {
  return (
    <section
      className={`mx-auto ${paddingMap[padding]} ${maxWidthMap[maxWidth]} ${roundedMap[rounded]}`}
      style={{ backgroundColor: backgroundColor || "transparent" }}
    >
      <DropZone zone="content" />
    </section>
  )
})

SectionRender.displayName = "SectionRender"

export const Section: ComponentConfig<SectionProps> = {
  fields: {
    backgroundColor: { type: "text" },
    padding: {
      type: "select",
      options: [
        { label: "4", value: "4" },
        { label: "8", value: "8" },
        { label: "12", value: "12" },
        { label: "16", value: "16" },
      ],
    },
    maxWidth: {
      type: "select",
      options: [
        { label: "全宽", value: "full" },
        { label: "大屏", value: "screen-lg" },
        { label: "超大屏", value: "screen-xl" },
      ],
    },
    rounded: {
      type: "select",
      options: [
        { label: "无", value: "none" },
        { label: "小", value: "sm" },
        { label: "大", value: "lg" },
      ],
    },
  },
  defaultProps: {
    backgroundColor: "transparent",
    padding: "8",
    maxWidth: "full",
    rounded: "none",
  },
  render: (props: SectionProps) => <SectionRender {...props} />,
}
