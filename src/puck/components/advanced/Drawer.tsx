// src/puck/components/advanced/Drawer.tsx
// 抽屉高级组件：slide-in panel from left/right

import { useState } from "react"
import type { ComponentConfig } from "@measured/puck"
import { Button } from "@/components/ui/button"

export type DrawerProps = {
  triggerText: string
  title: string
  side: "left" | "right"
  width: "sm" | "md" | "lg" | "full"
}

const widthMap: Record<DrawerProps["width"], string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  full: "max-w-full",
}

export const Drawer: ComponentConfig<DrawerProps> = {
  fields: {
    triggerText: { type: "text" },
    title: { type: "text" },
    side: {
      type: "select",
      options: [
        { label: "左侧", value: "left" },
        { label: "右侧", value: "right" },
      ],
    },
    width: {
      type: "select",
      options: [
        { label: "小", value: "sm" },
        { label: "中", value: "md" },
        { label: "大", value: "lg" },
        { label: "全屏", value: "full" },
      ],
    },
  },
  defaultProps: {
    triggerText: "打开抽屉",
    title: "抽屉标题",
    side: "right",
    width: "md",
  },
  render: ({ triggerText, title, side, width }: DrawerProps) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [open, setOpen] = useState(false)

    const sideClasses = side === "left" ? "left-0" : "right-0"
    const transformOpen =
      side === "left" ? "translate-x-0" : "translate-x-0"
    const transformClosed =
      side === "left" ? "-translate-x-full" : "translate-x-full"

    return (
      <>
        {/* Trigger Button */}
        <Button type="button" onClick={() => setOpen(true)}>
          {triggerText || "打开抽屉"}
        </Button>

        {/* Overlay */}
        {open && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Drawer Panel */}
        <div
          className={`fixed top-0 z-50 h-full ${sideClasses} ${widthMap[width]} w-full border-l border-border bg-background shadow-xl transition-transform duration-300 ${
            open ? transformOpen : transformClosed
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="text-lg font-semibold text-foreground">
              {title || "抽屉标题"}
            </h3>
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
          </div>
          {/* Body */}
          <div className="p-6 text-sm text-muted-foreground">
            抽屉内容区
          </div>
        </div>
      </>
    )
  },
}
