// src/components/Inspector/TreeView.tsx
// 组件树视图：递归渲染 Puck Data.content 的层级结构，支持点击选中和高亮。

import { useMemo, useState } from "react"
import type { Data } from "@measured/puck"

/** 递归构建的树节点 */
export interface InspectorNode {
  id: string
  type: string
  props: Record<string, unknown>
  children: InspectorNode[]
}

export interface TreeViewProps {
  data: Data
  selectedId: string | null
  onSelect: (id: string) => void
}

// ─── 从 Puck Data 递归构建树 ──────────────────────────────────────

const ROOT_NODE_ID = "__root__"

function extractNodes(items: unknown[]): InspectorNode[] {
  if (!Array.isArray(items)) return []
  return items
    .filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === "object",
    )
    .map((item) => {
      const props = (item.props as Record<string, unknown>) || {}
      const id = String(props.id || "")
      const type = String(item.type || "Unknown")
      const node: InspectorNode = {
        id,
        type,
        props: { ...props },
        children: [],
      }
      // 递归处理 children DropZone
      if (Array.isArray(props.children)) {
        node.children = extractNodes(props.children)
      }
      // 处理 zones（如 Card 等有多 zone 的组件）
      if (props.zones && typeof props.zones === "object") {
        for (const zoneKey of Object.keys(props.zones as Record<string, unknown>)) {
          const zoneItems = (props.zones as Record<string, unknown>)[zoneKey]
          if (Array.isArray(zoneItems)) {
            const zoneNodes = extractNodes(zoneItems)
            // 每个 zone 作为一组子节点
            node.children.push(...zoneNodes)
          }
        }
      }
      return node
    })
}

// ─── 单个树节点渲染 ──────────────────────────────────────────────

function TreeNodeItem({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: InspectorNode
  depth: number
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const hasChildren = node.children.length > 0
  const isSelected = node.id === selectedId
  // 获取组件显示名：截掉命名空间前缀，只取最后的 PascalCase 名
  const displayType = node.type.split("/").pop() || node.type

  return (
    <li>
      <div
        className={`group flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 text-xs transition-colors ${
          isSelected
            ? "bg-primary/15 text-primary font-medium"
            : "text-foreground hover:bg-accent"
        }`}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
        onClick={() => onSelect(node.id)}
      >
        {/* 展开/折叠图标 */}
        {hasChildren ? (
          <button
            type="button"
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground rounded"
            onClick={(e) => {
              e.stopPropagation()
              setCollapsed((c) => !c)
            }}
            tabIndex={-1}
          >
            <span className="text-[10px] leading-none">
              {collapsed ? "▶" : "▼"}
            </span>
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        {/* 组件图标 */}
        <span className="flex-shrink-0 text-[10px] opacity-70">
          {COMPONENT_ICONS[displayType] || "📄"}
        </span>

        {/* 组件名 */}
        <span className="truncate flex-1">{displayType}</span>

        {/* 组件 ID 缩略 */}
        {node.id && (
          <span className="flex-shrink-0 text-[9px] text-muted-foreground/50 font-mono hidden group-hover:inline">
            #{node.id.slice(0, 6)}
          </span>
        )}
      </div>

      {/* 子节点 */}
      {hasChildren && !collapsed && (
        <ul className="list-none m-0 p-0">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

// ─── 组件图标映射（常用组件类型） ────────────────────────────────

const COMPONENT_ICONS: Record<string, string> = {
  Heading: "H",
  Text: "T",
  Image: "🖼",
  Button: "🔘",
  Input: "📝",
  Divider: "—",
  Badge: "🏷",
  Alert: "⚠",
  Container: "▣",
  Row: "⇉",
  Column: "⇊",
  Grid: "⊞",
  Card: "⬡",
  Section: "▭",
  Tabs: "📑",
  Accordion: "≡",
  Carousel: "🎠",
  Table: "⊟",
  List: "☰",
  Progress: "📊",
  Video: "🎬",
  Form: "📋",
  FormInput: "✏",
  FormSelect: "▼",
  FormCheckbox: "☑",
  FormSwitch: "⚡",
  Modal: "🪟",
  Drawer: "↔",
  Dropdown: "▾",
  RichText: "📄",
  Upload: "📤",
  Skeleton: "◻",
  CodeBlock: "</>",
  MarkdownPreview: "MD",
  IframeEmbed: "🌐",
  CountUp: "📈",
  DataTable: "⊟",
  EmptyState: "□",
  Stepper: "🔢",
}

// ─── 主组件 ──────────────────────────────────────────────────────

export default function TreeView({ data, selectedId, onSelect }: TreeViewProps) {
  const tree = useMemo(() => {
    if (!data?.content) return []
    // 根容器节点
    const rootNode: InspectorNode = {
      id: ROOT_NODE_ID,
      type: "Page",
      props: {},
      children: extractNodes(data.content),
    }
    return [rootNode]
  }, [data])

  const totalNodes = useMemo(() => {
    const count = (nodes: InspectorNode[]): number =>
      nodes.reduce((acc, n) => acc + 1 + count(n.children), 0)
    return count(tree)
  }, [tree])

  if (tree.length === 0 || tree[0].children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-xs text-muted-foreground">页面内容为空</p>
        <p className="mt-1 text-[10px] text-muted-foreground/60">
          从组件库拖入组件开始构建
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 头部统计 */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-border">
        <span className="text-[10px] font-medium text-muted-foreground">
          组件树
        </span>
        <span className="text-[9px] text-muted-foreground/60">
          {totalNodes} 个节点
        </span>
      </div>

      {/* 树内容 */}
      <div className="flex-1 overflow-y-auto p-1">
        <ul className="list-none m-0 p-0 space-y-px">
          {tree.map((root) => (
            <TreeNodeItem
              key={root.id}
              node={root}
              depth={0}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

export { extractNodes, ROOT_NODE_ID }
