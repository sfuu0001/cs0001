// src/puck/components/form/FormSelect.tsx
// 表单下拉选择组件：label + select options

import type { ComponentConfig } from "@measured/puck"
import { Label } from "@/components/ui/label"

export type FormSelectProps = {
  label: string
  options: { value: string; label: string }[]
  placeholder: string
}

export const FormSelect: ComponentConfig<FormSelectProps> = {
  fields: {
    label: { type: "text" },
    options: {
      type: "array",
      arrayFields: {
        value: { type: "text" },
        label: { type: "text" },
      },
      getItemSummary: (item: { label?: string }, index?: number) =>
        item?.label || `选项 ${(index ?? 0) + 1}`,
      defaultItemProps: { value: "option", label: "选项" },
    },
    placeholder: { type: "text" },
  },
  defaultProps: {
    label: "选择字段",
    options: [
      { value: "option1", label: "选项 1" },
      { value: "option2", label: "选项 2" },
      { value: "option3", label: "选项 3" },
    ],
    placeholder: "请选择…",
  },
  render: ({ label, options, placeholder }: FormSelectProps) => (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
        {placeholder && (
          <option value="" disabled selected>
            {placeholder}
          </option>
        )}
        {options.map((opt, index) => (
          <option key={index} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
}
