// src/pages/admin/Themes/List.tsx
// 主题管理列表：表格展示名称/描述/是否预设/操作，顶栏新建/导入按钮。
// 预设不可删（隐藏删除按钮），导出按钮下载变量的 JSON。

import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { listThemes, deleteTheme, exportTheme } from "@/lib/api.themes"
import type { Theme } from "@/types/theme"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const LIMIT = 20

export default function ThemeList() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Theme[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listThemes({ page, limit: LIMIT })
      setItems(res.data)
      setTotal(res.total)
    } catch (e) {
      toast.error(`加载失败：${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  const handleDelete = async (id: string) => {
    if (!window.confirm("确认删除该主题？")) return
    try {
      await deleteTheme(id)
      await fetchList()
    } catch (e) {
      toast.error(`删除失败：${(e as Error).message}`)
    }
  }

  const handleExport = async (theme: Theme) => {
    try {
      const data = await exportTheme(theme.id)
      const blob = new Blob(
        [
          JSON.stringify(
            { name: theme.name, description: theme.description, variables: data.variables },
            null,
            2
          ),
        ],
        { type: "application/json" }
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${theme.name.replace(/\s+/g, "_")}_theme.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(`导出失败：${(e as Error).message}`)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div className="mx-auto max-w-4xl p-6 page-enter">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>主题管理</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => navigate("/admin/themes/import")}>
              导入主题
            </Button>
            <Button size="sm" onClick={() => navigate("/admin/themes/create")}>
              新建主题
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">名称</th>
                  <th className="px-3 py-2 text-left font-medium">描述</th>
                  <th className="px-3 py-2 text-left font-medium">预设</th>
                  <th className="px-3 py-2 text-left font-medium">变量数</th>
                  <th className="px-3 py-2 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-3 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-4xl">🎨</span>
                        <p className="text-muted-foreground">No themes yet</p>
                        <Button
                          size="sm"
                          onClick={() => navigate("/admin/themes/create")}
                        >
                          Create theme
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
                {items.length === 0 && loading && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                      加载中…
                    </td>
                  </tr>
                )}
                {items.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="px-3 py-2 font-medium">{t.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {t.description || "—"}
                    </td>
                    <td className="px-3 py-2">
                      {t.isPreset ? (
                        <span className="text-primary">是</span>
                      ) : (
                        <span className="text-muted-foreground">否</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {t.variables ? Object.keys(t.variables).length : 0}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/themes/${t.id}/edit`)}
                        >
                          编辑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExport(t)}
                        >
                          导出
                        </Button>
                        {!t.isPreset && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDelete(t.id)}
                          >
                            删除
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {items.length > 0 && (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
