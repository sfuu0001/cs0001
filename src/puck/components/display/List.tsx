// src/puck/components/display/List.tsx
// 列表展示组件：ordered/unordered + marker 样式

import type { ComponentConfig } from "@measured/puck"

export type ListProps = {
  items: { text: string }[]
  type: "ordered" | "unordered"
  marker: "disc" | "decimal" | "square"
}

const markerClass: Record<ListProps["marker"], string> = {
  disc: "list-disc",
  decimal: "list-decimal",
  square: "list-[square]",
}

export const List: ComponentConfig<ListProps> = {
  fields: {
    items: {
      type: "array",
      arrayFields: {
        text: { type: "textarea" },
      },
      getItemSummary: (item: { text?: string }, index?: number) =>
        item?.text?.slice(0, 20) || `项目 ${(index ?? 0) + 1}`,
      defaultItemProps: { text: "列表项" },
    },
    type: {
      type: "select",
      options: [
        { label: "无序", value: "unordered" },
        { label: "有序", value: "ordered" },
      ],
    },
    marker: {
      type: "select",
      options: [
        { label: "圆点", value: "disc" },
        { label: "数字", value: "decimal" },
        { label: "方块", value: "square" },
      ],
    },
  },
  defaultProps: {
    items: [
      { text: "第一项" },
      { text: "第二项" },
      { text: "第三项" },
    ],
    type: "unordered",
    marker: "disc",
  },
  render: ({ items, type, marker }: ListProps) => {
    const className = `${markerClass[marker]} space-y-1 pl-6 text-muted-foreground text-sm`

    if (type === "ordered") {
      return (
        <ol className={className}>
          {items.map((item, index) => (
            <li key={index}>{item.text}</li>
          ))}
        </ol>
      )
    }

    return (
      <ul className={className}>
        {items.map((item, index) => (
          <li key={index}>{item.text}</li>
        ))}
      </ul>
    )
  },
}
