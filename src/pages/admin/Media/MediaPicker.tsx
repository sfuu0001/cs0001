// src/pages/admin/Media/MediaPicker.tsx
// 媒体选择器弹窗：接收 onSelect(media) 回调，展示媒体网格，点击选择后回调并关闭弹窗。

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { listMedia } from "@/lib/api.media"
import type { Media } from "@/types/media"
import { Button } from "@/components/ui/button"

const LIMIT = 20

interface MediaPickerProps {
  open: boolean
  onSelect: (media: Media) => void
  onClose: () => void
}

export default function MediaPicker({ open, onSelect, onClose }: MediaPickerProps) {
  const [items, setItems] = useState<Media[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listMedia({ page, limit: LIMIT })
      setItems(res.data)
      setTotal(res.total)
    } catch (e) {
      toast.error(`加载失败：${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    if (open) void fetchList()
  }, [open, fetchList])

  if (!open) return null

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-2xl rounded-lg border bg-background shadow-lg">
        {/* 头 */}
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">选择媒体</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            关闭
          </Button>
        </div>

        {/* 网格 */}
        <div className="max-h-96 overflow-y-auto p-4">
          {loading && items.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">加载中…</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">暂无媒体</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {items.map((m) => (
                <div
                  key={m.id}
                  className="group cursor-pointer overflow-hidden rounded-md border transition-colors hover:border-primary"
                  onClick={() => {
                    onSelect(m)
                    onClose()
                  }}
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={m.url}
                      alt={m.alt || m.originalName}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <p className="truncate px-1 py-0.5 text-xs text-muted-foreground">
                    {m.originalName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 分页 */}
        <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
          <span>共 {total} 条</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </Button>
            <span>
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              下一页
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
