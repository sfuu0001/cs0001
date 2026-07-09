// src/puck/components/form/Form.tsx
// 表单容器组件：action + method + submit button + DropZone

import type { ComponentConfig } from "@measured/puck"
import { DropZone } from "@measured/puck"
import { Button } from "@/components/ui/button"

export type FormProps = {
  action: string
  method: "get" | "post"
  submitText: string
}

export const Form: ComponentConfig<FormProps> = {
  fields: {
    action: { type: "text" },
    method: {
      type: "select",
      options: [
        { label: "GET", value: "get" },
        { label: "POST", value: "post" },
      ],
    },
    submitText: { type: "text" },
  },
  defaultProps: {
    action: "#",
    method: "post",
    submitText: "提交",
  },
  render: ({ action, method, submitText }: FormProps) => (
    <form
      action={action || "#"}
      method={method || "post"}
      className="space-y-4 rounded-lg border border-border p-4"
    >
      <DropZone zone="content" />
      <div className="flex justify-end">
        <Button type="submit">{submitText || "提交"}</Button>
      </div>
    </form>
  ),
}
