// src/pages/admin/Templates/List.tsx
// 模板列表：卡片视图网格，每卡展示名称/分类/是否预设，含"使用此模板"按钮。
// 分类筛选 tabs。预设不可删。

import { useCallback, useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { listTemplates, deleteTemplate } from "@/lib/api.templates"
import { createPage, savePage } from "@/lib/api"
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
  const [searchParams] = useSearchParams()
  const applyTemplateId = searchParams.get("apply")

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
      toast.error(`加载失败：${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [page, category])

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  // Auto-apply template if ?apply= was passed
  useEffect(() => {
    if (applyTemplateId && items.length > 0) {
      const template = items.find((t) => t.id === applyTemplateId)
      if (template) {
        handleUseTemplate(template)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyTemplateId, items])

  const handleDelete = async (id: string) => {
    if (!window.confirm("确认删除该模板？")) return
    try {
      await deleteTemplate(id)
      await fetchList()
    } catch (e) {
      toast.error(`删除失败：${(e as Error).message}`)
    }
  }

  const handleUseTemplate = async (template: Template) => {
    try {
      const page = await createPage({
        title: template.name,
        description: template.description,
      })
      await savePage(page.id, template.content as any)
      navigate(`/editor?pageId=${page.id}`)
    } catch (e) {
      toast.error(`应用模板失败：${(e as Error).message}`)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div className="mx-auto max-w-5xl p-6 page-enter">
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
            <div className="flex flex-col items-center gap-3 py-12">
              <span className="text-4xl">📋</span>
              <p className="text-muted-foreground">No templates yet</p>
              <Button
                size="sm"
                onClick={() => navigate("/admin/templates/create-from-page")}
              >
                Create your first template
              </Button>
            </div>
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
