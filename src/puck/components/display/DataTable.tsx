// src/puck/components/display/DataTable.tsx
// 数据表格增强组件：headers + rows + 条纹/边框/响应式

import { memo } from "react"
import type { ComponentConfig } from "@measured/puck"

export type DataTableProps = {
  headers: { label: string; key: string }[]
  rows: { cells: string[] }[]
  striped: "true" | "false"
  bordered: "true" | "false"
  responsive: "true" | "false"
}

const DataTableRender = memo(function DataTableRender({ headers, rows, striped, bordered, responsive }: DataTableProps) {
  const isStriped = striped === "true"
  const isBordered = bordered === "true"
  const isResponsive = responsive === "true"
  const container = (
    <table
      className={`w-full text-sm ${
        isBordered
          ? "border border-border"
          : ""
      }`}
    >
      <thead>
        <tr className="bg-muted/50">
          {headers.map((h, i) => (
            <th
              key={i}
              className={`px-3 py-2 text-left font-medium text-muted-foreground ${
                isBordered ? "border border-border" : "border-b border-border"
              }`}
            >
              {h.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr
            key={ri}
            className={
              isStriped && ri % 2 === 1 ? "bg-muted/20" : ""
            }
          >
            {row.cells.map((cell, ci) => (
              <td
                key={ci}
                className={`px-3 py-2 ${
                  isBordered
                    ? "border border-border"
                    : "border-b border-border"
                }`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )

  if (isResponsive) {
    return <div className="overflow-x-auto rounded-lg border border-border">{container}</div>
  }

  return container
})

DataTableRender.displayName = "DataTableRender"

export const DataTable: ComponentConfig<DataTableProps> = {
  fields: {
    headers: {
      type: "array",
      arrayFields: {
        label: { type: "text" },
        key: { type: "text" },
      },
      getItemSummary: (item: { label?: string }, index?: number) =>
        item?.label || `列 ${(index ?? 0) + 1}`,
      defaultItemProps: { label: "列名", key: "col" },
    },
    rows: {
      type: "array",
      arrayFields: {
        cells: { type: "array", arrayFields: { "": { type: "text" } } },
      },
      getItemSummary: (_item: unknown, index?: number) =>
        `行 ${(index ?? 0) + 1}`,
      defaultItemProps: { cells: [""] },
    },
    striped: {
      type: "select",
      options: [
        { label: "是", value: "true" },
        { label: "否", value: "false" },
      ],
    },
    bordered: {
      type: "select",
      options: [
        { label: "是", value: "true" },
        { label: "否", value: "false" },
      ],
    },
    responsive: {
      type: "select",
      options: [
        { label: "是", value: "true" },
        { label: "否", value: "false" },
      ],
    },
  },
  defaultProps: {
    headers: [
      { label: "名称", key: "name" },
      { label: "值", key: "value" },
    ],
    rows: [
      { cells: ["项目 A", "100"] },
      { cells: ["项目 B", "200"] },
      { cells: ["项目 C", "300"] },
    ],
    striped: "true",
    bordered: "false",
    responsive: "true",
  },
  render: (props: DataTableProps) => <DataTableRender {...props} />,
}
