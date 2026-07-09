// src/puck/components/basic/Divider.tsx
// 分割线基础组件

import type { ComponentConfig } from "@measured/puck"

export type DividerProps = {
  label: string
}

export const Divider: ComponentConfig<DividerProps> = {
  fields: {
    label: { type: "text" },
  },
  defaultProps: { label: "" },
  render: ({ label }: DividerProps) =>
    label ? (
      <div className="flex items-center gap-3 py-2 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>{label}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    ) : (
      <hr className="border-border" />
    ),
}
