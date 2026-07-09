// src/puck/components/advanced/Modal.tsx
// 模态框高级组件：trigger button + overlay + modal

import { useState } from "react"
import type { ComponentConfig } from "@measured/puck"
import { Button } from "@/components/ui/button"

export type ModalProps = {
  triggerText: string
  title: string
  showClose: string
}

export const Modal: ComponentConfig<ModalProps> = {
  fields: {
    triggerText: { type: "text" },
    title: { type: "text" },
    showClose: {
      type: "radio",
      options: [
        { label: "显示", value: "true" },
        { label: "隐藏", value: "false" },
      ],
    },
  },
  defaultProps: {
    triggerText: "打开",
    title: "弹窗标题",
    showClose: "true",
  },
  render: ({ triggerText, title, showClose }: ModalProps) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [open, setOpen] = useState(false)
    const showCloseBool = showClose === "true"

    return (
      <>
        {/* Trigger Button */}
        <Button type="button" onClick={() => setOpen(true)}>
          {triggerText || "打开"}
        </Button>

        {/* Overlay + Modal */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setOpen(false)}
            />
            {/* Modal Panel */}
            <div className="relative z-10 mx-auto w-full max-w-md rounded-lg border border-border bg-background shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {title || "弹窗标题"}
                </h3>
                {showCloseBool && (
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-sm p-1 text-muted-foreground hover:text-foreground focus:outline-none"
                    aria-label="关闭"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
              {/* Body */}
              <div className="px-6 py-4 text-sm text-muted-foreground">
                弹窗内容区
              </div>
            </div>
          </div>
        )}
      </>
    )
  },
}
