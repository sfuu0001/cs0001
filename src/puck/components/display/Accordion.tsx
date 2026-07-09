// src/puck/components/display/Accordion.tsx
// 手风琴展示组件：可展开/折叠内容项，一次一个展开

import { useState } from "react"
import type { ComponentConfig } from "@measured/puck"

export type AccordionProps = {
  items: { title: string; content: string }[]
}

export const Accordion: ComponentConfig<AccordionProps> = {
  fields: {
    items: {
      type: "array",
      arrayFields: {
        title: { type: "text" },
        content: { type: "textarea" },
      },
      getItemSummary: (item: { title?: string }, index?: number) =>
        item?.title || `项目 ${(index ?? 0) + 1}`,
      defaultItemProps: { title: "标题", content: "内容" },
    },
  },
  defaultProps: {
    items: [
      { title: "标题 1", content: "内容 1" },
      { title: "标题 2", content: "内容 2" },
    ],
  },
  render: ({ items }: AccordionProps) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    const toggle = (index: number) => {
      setOpenIndex(openIndex === index ? null : index)
    }

    return (
      <div className="w-full divide-y divide-border rounded-lg border border-border">
        {items.map((item, index) => (
          <div key={index}>
            <button
              type="button"
              onClick={() => toggle(index)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/50 focus:outline-none"
            >
              <span>{item.title}</span>
              <svg
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  openIndex === index ? "rotate-180" : ""
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {openIndex === index && (
              <div className="px-4 pb-3 text-sm text-muted-foreground">
                {item.content}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  },
}
