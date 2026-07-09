// src/puck/components/display/EmptyState.tsx
// 空态展示组件：flex-col 居中 + SVG icon + 按钮

import { memo } from "react"
import type { ComponentConfig } from "@measured/puck"

export type EmptyStateProps = {
  icon: "inbox" | "search" | "file" | "box"
  title: string
  description: string
  actionText: string
  actionLink: string
}

const ICON_MAP: Record<EmptyStateProps["icon"], React.ReactNode> = {
  inbox: (
    <svg className="h-12 w-12 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
    </svg>
  ),
  search: (
    <svg className="h-12 w-12 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  file: (
    <svg className="h-12 w-12 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  box: (
    <svg className="h-12 w-12 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
}

const EmptyStateRender = memo(function EmptyStateRender({ icon, title, description, actionText, actionLink }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-4">
      <div className="flex-shrink-0">
        {ICON_MAP[icon]}
      </div>
      <div className="text-center">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        )}
      </div>
      {actionText && (
        <a
          href={actionLink || "#"}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          {actionText}
        </a>
      )}
    </div>
  )
})

EmptyStateRender.displayName = "EmptyStateRender"

export const EmptyState: ComponentConfig<EmptyStateProps> = {
  fields: {
    icon: {
      type: "select",
      options: [
        { label: "收件箱", value: "inbox" },
        { label: "搜索", value: "search" },
        { label: "文件", value: "file" },
        { label: "盒子", value: "box" },
      ],
    },
    title: { type: "text" },
    description: { type: "textarea" },
    actionText: { type: "text" },
    actionLink: { type: "text" },
  },
  defaultProps: {
    icon: "inbox",
    title: "暂无数据",
    description: "当前还没有任何内容，请添加后重试。",
    actionText: "开始",
    actionLink: "#",
  },
  render: (props: EmptyStateProps) => <EmptyStateRender {...props} />,
}
