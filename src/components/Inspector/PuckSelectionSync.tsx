// src/components/Inspector/PuckSelectionSync.tsx
// Puck 选择状态同步桥接：在 Puck 子组件中使用 usePuck() 监听/同步画布选中状态。
// 通过 onSelect 回调通知 Editor 当前选中项，通过 selectById 方法从外部设置选中。

import { useCallback, useEffect, useRef } from "react"
import { usePuck } from "@measured/puck"

// ItemSelector 是 Puck 内部类型，未导出，本地定义以匹配 Puck 的 ItemSelector
interface ItemSelector {
  index: number
  zone?: string
}

export interface PuckSelectionSyncHandle {
  /** 按组件 ID 在画布中选中该组件 */
  selectById: (id: string) => void
  /** 清除画布选中 */
  clearSelection: () => void
}

export interface PuckSelectionSyncProps {
  /** Editor 维护的选中 ID */
  selectedId: string | null
  /** 画布选中变化时的回调 */
  onSelect: (id: string | null) => void
  /** 暴露操作句柄的 ref */
  handleRef?: React.MutableRefObject<PuckSelectionSyncHandle | null>
}

/**
 * 必须在 <Puck> 的子组件中使用，因此拥有 usePuck() 上下文。
 * 渲染为空节点，不产生任何可见 UI。
 */
export default function PuckSelectionSync({
  selectedId,
  onSelect,
  handleRef,
}: PuckSelectionSyncProps) {
  const { selectedItem, getSelectorForId, dispatch } = usePuck()
  const lastReportedId = useRef<string | null>(null)
  const selectedIdRef = useRef<string | null>(selectedId)
  const autoSync = useRef(true)

  // 同步 selectedId 到 ref
  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  // ─── 画布 → Editor：监听画布选中变化 ────────────────────────────
  useEffect(() => {
    const canvasId = (selectedItem?.props?.id as string | undefined) ?? null
    if (canvasId !== lastReportedId.current) {
      lastReportedId.current = canvasId
      // 如果这个变化是由树节点点击触发的（autoSync 为 false），不通知 Editor
      if (autoSync.current) {
        onSelect(canvasId)
      }
      autoSync.current = true
    }
  }, [selectedItem, onSelect])

  // ─── Editor → 画布：暴露 selectById 接口 ───────────────────────
  const selectById = useCallback(
    (id: string) => {
      autoSync.current = false // 避免循环
      const selector = getSelectorForId(id) as ItemSelector | undefined
      if (selector) {
        dispatch({
          type: "setUi" as const,
          recordHistory: false,
          ui: { itemSelector: { index: selector.index, zone: selector.zone } },
        })
      }
    },
    [getSelectorForId, dispatch],
  )

  const clearSelection = useCallback(() => {
    autoSync.current = false
    dispatch({
      type: "setUi" as const,
      recordHistory: false,
      ui: { itemSelector: null },
    })
  }, [dispatch])

  // ─── 暴露句柄 ──────────────────────────────────────────────────
  useEffect(() => {
    if (handleRef) {
      handleRef.current = { selectById, clearSelection }
    }
    return () => {
      if (handleRef) {
        handleRef.current = null
      }
    }
  }, [handleRef, selectById, clearSelection])

  return null
}
