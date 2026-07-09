// src/puck/components/layout/Tabs.tsx
// 标签页布局组件：多 tab 切换 + 各自 DropZone

import { useState } from "react"
import type { ComponentConfig } from "@measured/puck"
import { DropZone } from "@measured/puck"

export type TabsProps = {
  tabs: { label: string; content: string }[]
}

export const Tabs: ComponentConfig<TabsProps> = {
  fields: {
    tabs: {
      type: "array",
      arrayFields: {
        label: { type: "text" },
        content: { type: "textarea" },
      },
      getItemSummary: (item: { label?: string }, index?: number) =>
        item?.label || `标签 ${(index ?? 0) + 1}`,
      defaultItemProps: { label: "新标签", content: "" },
    },
  },
  defaultProps: {
    tabs: [
      { label: "标签 1", content: "" },
      { label: "标签 2", content: "" },
    ],
  },
  render: ({ tabs }: TabsProps) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [activeIndex, setActiveIndex] = useState(0)

    return (
      <div className="w-full">
        {/* Tab 按钮栏 */}
        <div className="flex border-b border-border">
          {tabs.map((tab, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
                index === activeIndex
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* 当前激活 Tab 内容 */}
        <div className="pt-4">
          {tabs.map((_tab, index) => (
            <div
              key={index}
              style={{ display: index === activeIndex ? "block" : "none" }}
            >
              <DropZone zone={`tab-${index}`} />
            </div>
          ))}
        </div>
      </div>
    )
  },
}
