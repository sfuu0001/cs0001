// src/puck/components/form/FormSwitch.tsx
// 表单开关组件：label + switch toggle

import type { ComponentConfig } from "@measured/puck"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export type FormSwitchProps = {
  label: string
  defaultChecked: string
}

export const FormSwitch: ComponentConfig<FormSwitchProps> = {
  fields: {
    label: { type: "text" },
    defaultChecked: {
      type: "radio",
      options: [
        { label: "开启", value: "true" },
        { label: "关闭", value: "false" },
      ],
    },
  },
  defaultProps: {
    label: "开关",
    defaultChecked: "false",
  },
  render: ({ label, defaultChecked }: FormSwitchProps) => (
    <div className="flex items-center space-x-2">
      <Switch id="puck-switch" defaultChecked={defaultChecked === "true"} />
      {label && <Label htmlFor="puck-switch">{label}</Label>}
    </div>
  ),
}
