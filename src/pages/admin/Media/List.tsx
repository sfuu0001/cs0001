// src/pages/admin/Media/List.tsx
// 媒体库：网格展示图片，支持上传、搜索、分页、删除。

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react"
import { listMedia, uploadMedia, deleteMedia } from "@/lib/api.media"
import type { Media } from "@/types/media"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const LIMIT = 20

export default function MediaList() {
  const [items, setItems] = useState<Media[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listMedia({
        page,
        limit: LIMIT,
        search: search || undefined,
      })
      setItems(res.data)
      setTotal(res.total)
    } catch (e) {
      window.alert(`加载失败：${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  // 搜索防抖
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      await uploadMedia(file)
      await fetchList()
    } catch (e) {
      window.alert(`上传失败：${(e as Error).message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = () => {
    const file = fileInputRef.current?.files?.[0]
    if (file && fileInputRef.current) {
      void handleUpload(file)
      fileInputRef.current.value = ""
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      void handleUpload(file)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("确认删除该媒体文件？")) return
    try {
      await deleteMedia(id)
      await fetchList()
    } catch (e) {
      window.alert(`删除失败：${(e as Error).message}`)
    }
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>媒体库</CardTitle>
          <Button
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "上传中…" : "上传图片"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
            placeholder="搜索文件名 / alt 文本"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
          />

          {/* 拖拽上传区 */}
          <div
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <p className="text-sm text-muted-foreground">
              拖拽图片到此处快速上传
            </p>
          </div>

          {/* 网格 */}
          {loading && items.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">加载中…</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              暂无媒体文件
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {items.map((m) => (
                <div
                  key={m.id}
                  className="group relative overflow-hidden rounded-md border"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={m.url}
                      alt={m.alt || m.originalName}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="truncate text-xs text-white">
                      {m.originalName}
                    </p>
                    <p className="text-xs text-white/70">{formatSize(m.size)}</p>
                  </div>
                  <button
                    className="absolute right-1 top-1 rounded bg-destructive/80 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive"
                    onClick={() => handleDelete(m.id)}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
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
        </CardContent>
      </Card>
    </div>
  )
}
