// src/puck/components/advanced/Dropdown.tsx
// 下拉菜单高级组件：trigger + absolute menu

import { useState } from "react"
import type { ComponentConfig } from "@measured/puck"
import { Button } from "@/components/ui/button"

export type DropdownProps = {
  triggerText: string
  items: { label: string; href: string }[]
}

export const Dropdown: ComponentConfig<DropdownProps> = {
  fields: {
    triggerText: { type: "text" },
    items: {
      type: "array",
      arrayFields: {
        label: { type: "text" },
        href: { type: "text" },
      },
      getItemSummary: (item: { label?: string }, index?: number) =>
        item?.label || `菜单项 ${(index ?? 0) + 1}`,
      defaultItemProps: { label: "菜单项", href: "#" },
    },
  },
  defaultProps: {
    triggerText: "菜单",
    items: [
      { label: "操作 1", href: "#" },
      { label: "操作 2", href: "#" },
      { label: "操作 3", href: "#" },
    ],
  },
  render: ({ triggerText, items }: DropdownProps) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [open, setOpen] = useState(false)

    return (
      <div className="relative inline-block">
        {/* Trigger */}
        <Button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-2"
        >
          {triggerText || "菜单"}
          <svg
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </Button>

        {/* Menu */}
        {open && (
          <>
            {/* Click-outside backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            {/* Dropdown list */}
            <div className="absolute left-0 z-20 mt-1 min-w-[180px] rounded-md border border-border bg-background py-1 shadow-lg">
              {items.map((item, index) => (
                <a
                  key={index}
                  href={item.href || "#"}
                  className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    )
  },
}
