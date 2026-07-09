// src/puck/components/layout/Grid.tsx
// 网格布局组件：CSS Grid 排列子组件

import type { ComponentConfig } from "@measured/puck"
import { DropZone } from "@measured/puck"

export type GridProps = {
  columns: "1" | "2" | "3" | "4" | "6"
  gap: "2" | "4" | "8"
}

const columnsMap: Record<GridProps["columns"], string> = {
  "1": "grid-cols-1",
  "2": "grid-cols-2",
  "3": "grid-cols-3",
  "4": "grid-cols-4",
  "6": "grid-cols-6",
}

const gapMap: Record<GridProps["gap"], string> = {
  "2": "gap-2",
  "4": "gap-4",
  "8": "gap-8",
}

export const Grid: ComponentConfig<GridProps> = {
  fields: {
    columns: {
      type: "select",
      options: [
        { label: "1 列", value: "1" },
        { label: "2 列", value: "2" },
        { label: "3 列", value: "3" },
        { label: "4 列", value: "4" },
        { label: "6 列", value: "6" },
      ],
    },
    gap: {
      type: "select",
      options: [
        { label: "2", value: "2" },
        { label: "4", value: "4" },
        { label: "8", value: "8" },
      ],
    },
  },
  defaultProps: {
    columns: "2",
    gap: "4",
  },
  render: ({ columns, gap }: GridProps) => (
    <div
      className={`grid ${columnsMap[columns]} ${gapMap[gap]}`}
    >
      <DropZone zone="content" />
    </div>
  ),
}
