// src/puck/components/form/FormCheckbox.tsx
// 表单复选框组件：label + checkbox

import type { ComponentConfig } from "@measured/puck"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export type FormCheckboxProps = {
  label: string
  defaultChecked: string
}

export const FormCheckbox: ComponentConfig<FormCheckboxProps> = {
  fields: {
    label: { type: "text" },
    defaultChecked: {
      type: "radio",
      options: [
        { label: "选中", value: "true" },
        { label: "未选", value: "false" },
      ],
    },
  },
  defaultProps: {
    label: "复选框",
    defaultChecked: "false",
  },
  render: ({ label, defaultChecked }: FormCheckboxProps) => (
    <div className="flex items-center space-x-2">
      <Checkbox id="puck-checkbox" defaultChecked={defaultChecked === "true"} />
      {label && <Label htmlFor="puck-checkbox">{label}</Label>}
    </div>
  ),
}
