// src/puck/components/form/FormInput.tsx
// 表单输入框组件：label + input

import type { ComponentConfig } from "@measured/puck"
import { Label } from "@/components/ui/label"

export type FormInputProps = {
  label: string
  placeholder: string
  required: string
  type: "text" | "email" | "password" | "number"
}

export const FormInput: ComponentConfig<FormInputProps> = {
  fields: {
    label: { type: "text" },
    placeholder: { type: "text" },
    required: {
      type: "radio",
      options: [
        { label: "必填", value: "true" },
        { label: "选填", value: "false" },
      ],
    },
    type: {
      type: "select",
      options: [
        { label: "文本", value: "text" },
        { label: "邮箱", value: "email" },
        { label: "密码", value: "password" },
        { label: "数字", value: "number" },
      ],
    },
  },
  defaultProps: {
    label: "字段名",
    placeholder: "请输入…",
    required: "false",
    type: "text",
  },
  render: ({ label, placeholder, required, type }: FormInputProps) => (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required === "true" && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}
      <input
        type={type || "text"}
        placeholder={placeholder || ""}
        required={required === "true"}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  ),
}
