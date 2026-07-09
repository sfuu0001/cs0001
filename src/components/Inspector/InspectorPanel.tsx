// src/components/Inspector/InspectorPanel.tsx
// Inspector 主面板容器：包含组件树（TreeView）和属性编辑（PropsView），
// 从右侧滑入，支持折叠和拖拽调整宽度。

import { useCallback, useEffect, useRef, useState } from "react"
import type { Data } from "@measured/puck"
import TreeView from "./TreeView"
import PropsView from "./PropsView"

export interface InspectorPanelProps {
  data: Data
  visible: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onPropChange: (id: string, key: string, value: unknown) => void
  onClose: () => void
}

// ─── 拖拽调整宽度 Hook ──────────────────────────────────────────

const MIN_PANEL_WIDTH = 280
const MAX_PANEL_WIDTH = 520
const DEFAULT_PANEL_WIDTH = 340

function useResizable(
  initialWidth: number,
  enabled: boolean,
) {
  const [width, setWidth] = useState(initialWidth)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return
      isDragging.current = true
      startX.current = e.clientX
      startWidth.current = width
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [width, enabled],
  )

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return
    const diff = startX.current - e.clientX
    const newWidth = Math.min(
      MAX_PANEL_WIDTH,
      Math.max(MIN_PANEL_WIDTH, startWidth.current + diff),
    )
    setWidth(newWidth)
  }, [])

  const onMouseUp = useCallback(() => {
    isDragging.current = false
    document.body.style.cursor = ""
    document.body.style.userSelect = ""
    document.removeEventListener("mousemove", onMouseMove)
    document.removeEventListener("mouseup", onMouseUp)
  }, [onMouseMove])

  // 清理
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }
  }, [onMouseMove])

  return { width, onMouseDown }
}

// ─── Inspector Panel 视图切换 ──────────────────────────────────

type PanelView = "tree" | "props"

// ─── 主组件 ──────────────────────────────────────────────────────

export default function InspectorPanel({
  data,
  visible,
  selectedId,
  onSelect,
  onPropChange,
  onClose,
}: InspectorPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const { width, onMouseDown } = useResizable(DEFAULT_PANEL_WIDTH, visible)

  // 视图切换：当选中有组件时自动切换到 props 视图
  const [view, setView] = useState<PanelView>("tree")
  useEffect(() => {
    if (selectedId && selectedId !== "__root__") {
      setView("props")
    }
  }, [selectedId])

  const handleJumpToCode = useCallback(() => {
    // 在 VS Code 环境中，通过 vscode://file 协议打开
    const componentPath = selectedId
      ? `src/puck/components/`
      : ""
    const vscodeUrl = `vscode://file/${encodeURIComponent(
      window.location.pathname.replace(/\/[^/]*$/, "/") + componentPath,
    )}`
    window.open(vscodeUrl, "_blank")
  }, [selectedId])

  // 未找到选中组件时用 null
  const hasSelection = Boolean(selectedId) && selectedId !== "__root__"

  return (
    <>
      {/* 遮罩层（移动端可点关闭） */}
      {visible && (
        <div
          className="fixed inset-0 z-40 bg-black/10 md:hidden"
          onClick={onClose}
        />
      )}

      {/* 面板 */}
      <div
        ref={panelRef}
        className={`fixed md:relative right-0 top-0 h-full z-50 bg-background border-l border-border shadow-lg flex flex-col transition-transform duration-200 ease-in-out ${
          visible ? "translate-x-0" : "translate-x-full md:translate-x-full"
        }`}
        style={{ width: visible ? width : 0 }}
      >
        {/* 拖拽手柄（左侧） */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10"
          onMouseDown={onMouseDown}
        />

        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b border-border px-3 py-2 flex-shrink-0">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span className="text-[10px] opacity-70">🔍</span>
            Inspector
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="关闭 Inspector"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </button>
        </div>

        {/* 视图切换 Tab */}
        <div className="flex border-b border-border flex-shrink-0">
          <button
            type="button"
            className={`flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors ${
              view === "tree"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setView("tree")}
          >
            组件树
          </button>
          <button
            type="button"
            className={`flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors ${
              view === "props"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setView("props")}
            disabled={!hasSelection}
            title={!hasSelection ? "请先选择一个组件" : "Props 视图"}
          >
            属性编辑
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-hidden">
          {view === "tree" ? (
            <TreeView
              data={data}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ) : (
            <PropsView
              data={data}
              selectedId={selectedId}
              onPropChange={onPropChange}
            />
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="border-t border-border px-3 py-2 flex items-center justify-between flex-shrink-0">
          {/* Jump to Code 按钮 */}
          <button
            type="button"
            onClick={handleJumpToCode}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="在 VS Code 中打开"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            Jump to Code
          </button>

          {/* 选中状态 */}
          {hasSelection ? (
            <span className="text-[9px] text-muted-foreground/60">
              已选中 1 个组件
            </span>
          ) : (
            <span className="text-[9px] text-muted-foreground/40">
              未选中
            </span>
          )}
        </div>
      </div>
    </>
  )
}
