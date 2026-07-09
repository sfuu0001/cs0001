// src/puck/components/layout/Row.tsx
// 行布局组件：水平 flex 排列子组件

import type { ComponentConfig } from "@measured/puck"
import { DropZone } from "@measured/puck"

export type RowProps = {
  justifyContent: "flex-start" | "center" | "flex-end" | "space-between"
  alignItems: "flex-start" | "center" | "flex-end" | "stretch"
  gap: "0" | "2" | "4" | "8"
}

const justifyContentMap: Record<RowProps["justifyContent"], string> = {
  "flex-start": "justify-start",
  center: "justify-center",
  "flex-end": "justify-end",
  "space-between": "justify-between",
}

const alignItemsMap: Record<RowProps["alignItems"], string> = {
  "flex-start": "items-start",
  center: "items-center",
  "flex-end": "items-end",
  stretch: "items-stretch",
}

const gapMap: Record<RowProps["gap"], string> = {
  "0": "gap-0",
  "2": "gap-2",
  "4": "gap-4",
  "8": "gap-8",
}

export const Row: ComponentConfig<RowProps> = {
  fields: {
    justifyContent: {
      type: "select",
      options: [
        { label: "左对齐", value: "flex-start" },
        { label: "居中", value: "center" },
        { label: "右对齐", value: "flex-end" },
        { label: "两端对齐", value: "space-between" },
      ],
    },
    alignItems: {
      type: "select",
      options: [
        { label: "顶部", value: "flex-start" },
        { label: "居中", value: "center" },
        { label: "底部", value: "flex-end" },
        { label: "拉伸", value: "stretch" },
      ],
    },
    gap: {
      type: "select",
      options: [
        { label: "0", value: "0" },
        { label: "2", value: "2" },
        { label: "4", value: "4" },
        { label: "8", value: "8" },
      ],
    },
  },
  defaultProps: {
    justifyContent: "flex-start",
    alignItems: "stretch",
    gap: "4",
  },
  render: ({ justifyContent, alignItems, gap }: RowProps) => (
    <div
      className={`flex flex-row ${justifyContentMap[justifyContent]} ${alignItemsMap[alignItems]} ${gapMap[gap]}`}
    >
      <DropZone zone="content" />
    </div>
  ),
}
