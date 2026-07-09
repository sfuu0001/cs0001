// src/puck/components/basic/Input.tsx
// 输入框基础组件（由现状 InputField 重命名）：label + placeholder

import type { ComponentConfig } from "@measured/puck"

export type InputProps = {
  label: string
  placeholder: string
}

export const Input: ComponentConfig<InputProps> = {
  fields: {
    label: { type: "text" },
    placeholder: { type: "text" },
  },
  defaultProps: { label: "字段名", placeholder: "请输入…" },
  render: ({ label, placeholder }: InputProps) => (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">
        {label}
      </span>
      <input
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
        placeholder={placeholder}
      />
    </label>
  ),
}
