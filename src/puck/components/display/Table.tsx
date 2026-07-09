// src/puck/components/display/Table.tsx
// 表格展示组件：动态表头 + 行数据

import type { ComponentConfig } from "@measured/puck"

export type TableProps = {
  headers: { label: string }[]
  rows: { cells: string[] }[]
}

export const Table: ComponentConfig<TableProps> = {
  fields: {
    headers: {
      type: "array",
      arrayFields: {
        label: { type: "text" },
      },
      getItemSummary: (item: { label?: string }, index?: number) =>
        item?.label || `表头 ${(index ?? 0) + 1}`,
      defaultItemProps: { label: "列名" },
    },
    rows: {
      type: "array",
      arrayFields: {
        cells: { type: "array", arrayFields: { "": { type: "text" } } },
      },
      getItemSummary: (_item: unknown, index?: number) =>
        `行 ${(index ?? 0) + 1}`,
      defaultItemProps: { cells: ["数据"] },
    },
  },
  defaultProps: {
    headers: [
      { label: "姓名" },
      { label: "年龄" },
      { label: "城市" },
    ],
    rows: [
      { cells: ["张三", "28", "北京"] },
      { cells: ["李四", "32", "上海"] },
      { cells: ["王五", "25", "广州"] },
    ],
  },
  render: ({ headers, rows }: TableProps) => (
    <div className="w-full overflow-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left font-medium text-foreground"
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b last:border-0 hover:bg-muted/30"
            >
              {row.cells.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
}
