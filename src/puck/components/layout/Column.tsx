// src/puck/components/layout/Column.tsx
// 列布局组件：垂直 flex 排列子组件

import type { ComponentConfig } from "@measured/puck"
import { DropZone } from "@measured/puck"

export type ColumnProps = {
  width: "1" | "2" | "3" | "4" | "6" | "8" | "12"
  gap: "0" | "2" | "4" | "8"
}

const widthMap: Record<ColumnProps["width"], string> = {
  "1": "w-1/12",
  "2": "w-2/12",
  "3": "w-3/12",
  "4": "w-4/12",
  "6": "w-6/12",
  "8": "w-8/12",
  "12": "w-full",
}

const gapMap: Record<ColumnProps["gap"], string> = {
  "0": "gap-0",
  "2": "gap-2",
  "4": "gap-4",
  "8": "gap-8",
}

export const Column: ComponentConfig<ColumnProps> = {
  fields: {
    width: {
      type: "select",
      options: [
        { label: "1/12", value: "1" },
        { label: "2/12", value: "2" },
        { label: "3/12", value: "3" },
        { label: "4/12", value: "4" },
        { label: "6/12", value: "6" },
        { label: "8/12", value: "8" },
        { label: "12/12", value: "12" },
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
    width: "12",
    gap: "4",
  },
  render: ({ width, gap }: ColumnProps) => (
    <div
      className={`flex flex-col ${widthMap[width]} ${gapMap[gap]}`}
    >
      <DropZone zone="content" />
    </div>
  ),
}
