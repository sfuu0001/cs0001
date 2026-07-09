// src/puck/components/layout/Container.tsx
// 容器布局组件：padding + backgroundColor + borderRadius + DropZone

import type { ComponentConfig } from "@measured/puck"
import { DropZone } from "@measured/puck"

export type ContainerProps = {
  padding: "0" | "4" | "8"
  backgroundColor: string
  borderRadius: "none" | "sm" | "md" | "lg"
}

const paddingMap: Record<ContainerProps["padding"], string> = {
  "0": "p-0",
  "4": "p-4",
  "8": "p-8",
}

const borderRadiusMap: Record<ContainerProps["borderRadius"], string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
}

export const Container: ComponentConfig<ContainerProps> = {
  fields: {
    padding: {
      type: "select",
      options: [
        { label: "0", value: "0" },
        { label: "4", value: "4" },
        { label: "8", value: "8" },
      ],
    },
    backgroundColor: { type: "text" },
    borderRadius: {
      type: "select",
      options: [
        { label: "无", value: "none" },
        { label: "小", value: "sm" },
        { label: "中", value: "md" },
        { label: "大", value: "lg" },
      ],
    },
  },
  defaultProps: {
    padding: "4",
    backgroundColor: "transparent",
    borderRadius: "md",
  },
  render: ({ padding, backgroundColor, borderRadius }: ContainerProps) => (
    <div
      className={`${paddingMap[padding]} ${borderRadiusMap[borderRadius]}`}
      style={{ backgroundColor: backgroundColor || "transparent" }}
    >
      <DropZone zone="content" />
    </div>
  ),
}
