// src/pages/admin/Templates/List.tsx
// 模板列表：卡片视图网格，每卡展示名称/分类/是否预设，含"使用此模板"按钮。
// 分类筛选 tabs。预设不可删。

import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { listTemplates, deleteTemplate } from "@/lib/api.templates"
import type { Template } from "@/types/template"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const LIMIT = 20
const CATEGORIES = ["全部", "landing", "about", "contact", "blog", "gallery"]

export default function TemplateList() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Template[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(false)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listTemplates({
        page,
        limit: LIMIT,
        category: category || undefined,
      })
      setItems(res.data)
      setTotal(res.total)
    } catch (e) {
      window.alert(`加载失败：${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [page, category])

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  const handleDelete = async (id: string) => {
    if (!window.confirm("确认删除该模板？")) return
    try {
      await deleteTemplate(id)
      await fetchList()
    } catch (e) {
      window.alert(`删除失败：${(e as Error).message}`)
    }
  }

  const handleUseTemplate = async (template: Template) => {
    // 使用模板 → 确认后直接创建页面（通过后端 apply 到新建页面）
    try {
      const { createPage } = await import("@/lib/api")
      // 先创建页面，再用模板内容填充
      const page = await createPage({
        title: template.name,
        description: template.description,
      })
      // 保存模板内容到页面
      const { savePage } = await import("@/lib/api")
      await savePage(page.id, template.content as any)
      navigate(`/editor?pageId=${page.id}`)
    } catch (e) {
      window.alert(`应用模板失败：${(e as Error).message}`)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div className="mx-auto max-w-5xl p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>模板库</CardTitle>
          <Button size="sm" onClick={() => navigate("/admin/templates/create-from-page")}>
            从页面创建模板
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 分类 tabs */}
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={category === cat || (cat === "全部" && !category) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCategory(cat === "全部" ? "" : cat)
                  setPage(1)
                }}
              >
                {cat === "全部" ? "全部" : cat}
              </Button>
            ))}
          </div>

          {loading && items.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">加载中…</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">暂无模板</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((t) => (
                <div
                  key={t.id}
                  className="group relative rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="font-medium">{t.name}</h3>
                    {t.isPreset && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                        预设
                      </span>
                    )}
                  </div>
                  {t.description && (
                    <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
                      {t.description}
                    </p>
                  )}
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {t.category || "未分类"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleUseTemplate(t)}
                    >
                      使用此模板
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
