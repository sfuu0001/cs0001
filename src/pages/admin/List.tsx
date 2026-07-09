// src/pages/admin/List.tsx
// 管理后台列表：搜索 / 状态筛选 / 分页 + 行操作（编辑 / 预览 / 发布 / 取消发布 / 复制 / 删除 / 恢复 / 另存为模板）。
// 三期优化：表格行抽成 PageRow + React.memo
// 四期+：导出 JSON / 版本历史 / 表单数据

import { memo, useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  listPages,
  publishPage,
  unpublishPage,
  duplicatePage,
  deletePage,
  restorePage,
  getPage,
  updatePage,
  createPage,
} from "@/lib/api"
import type { Page, PageListParams, SeoMetadata } from "@/types/page"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { downloadJson } from "@/lib/export"
import { getToken } from "@/lib/auth"

const STATUS_OPTIONS = [
  { value: "", label: "全部状态" },
  { value: "draft", label: "草稿" },
  { value: "published", label: "已发布" },
  { value: "archived", label: "归档" },
]

const LIMIT = 10

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("zh-CN")
}

/** 导出页面的完整 JSON */
async function handleExportPage(pageId: string, title: string): Promise<void> {
  const token = getToken()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`/api/pages/${pageId}/export?format=json`, { headers })
  if (!res.ok) throw new Error("导出失败")
  const body = await res.json()
  downloadJson(body, `${title.replace(/\s+/g, "_")}_export`)
}

// ─── PageRow 子组件（带 React.memo，避免无关行重渲染） ───

interface PageRowProps {
  page: Page
  view: "active" | "trash"
  onAction: (id: string, action: string) => void
  onOpenSeo: (id: string) => void
  onSaveAsTemplate: (id: string) => void
  onExport: (id: string, title: string) => void
  navigate: (path: string) => void
}

const PageRow = memo(function PageRow({
  page: p,
  view,
  onAction,
  onOpenSeo,
  onSaveAsTemplate,
  onExport,
  navigate,
}: PageRowProps) {
  return (
    <tr key={p.id} className="border-t hover:bg-accent/30 border-l-2 border-l-transparent hover:border-l-primary transition-colors">
      <td className="px-3 py-2">{p.title}</td>
      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
        {p.slug}
      </td>
      <td className="px-3 py-2">
        <span
          className={
            p.status === "published"
              ? "text-primary"
              : "text-muted-foreground"
          }
        >
          {p.status === "published"
            ? "已发布"
            : p.status === "archived"
              ? "归档"
              : "草稿"}
        </span>
      </td>
      <td className="px-3 py-2">{p.viewCount}</td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {formatDate(p.updatedAt)}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/editor?pageId=${p.id}`)}
          >
            编辑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/preview?pageId=${p.id}`)}
          >
            预览
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenSeo(p.id)}
          >
            SEO
          </Button>
          {view === "trash" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction(p.id, "restore")}
            >
              恢复
            </Button>
          ) : (
            <>
              {p.status === "published" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAction(p.id, "unpublish")}
                >
                  取消发布
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAction(p.id, "publish")}
                >
                  发布
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAction(p.id, "duplicate")}
              >
                复制
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSaveAsTemplate(p.id)}
              >
                另存为模板
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExport(p.id, p.title)}
              >
                导出
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/admin/version-history?pageId=${p.id}`)}
              >
                版本历史
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/admin/form-submissions?pageId=${p.id}`)}
              >
                表单数据
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => onAction(p.id, "delete")}
              >
                删除
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
})

PageRow.displayName = "PageRow"

// ─── 空状态组件 ────────────────────────────────────────────────────

function EmptyState({
  isTrash,
  onCreatePage,
}: {
  isTrash: boolean
  onCreatePage: () => void
}) {
  return (
    <tr>
      <td colSpan={6} className="px-3 py-12 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">{isTrash ? "🗑️" : "📄"}</span>
          <p className="text-muted-foreground">
            {isTrash ? "回收站是空的" : "还没有创建任何页面"}
          </p>
          {!isTrash && (
            <Button onClick={onCreatePage} size="sm">
              Create your first page
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── 主列表组件 ───

export default function List() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Page[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [view, setView] = useState<"active" | "trash">("active")
  const [loading, setLoading] = useState(false)

  // SEO 弹窗状态
  const [seoModalId, setSeoModalId] = useState<string | null>(null)
  const [seoValues, setSeoValues] = useState<SeoMetadata>({})
  const [seoSaving, setSeoSaving] = useState(false)
  const seoModalPageTitle = seoModalId
    ? items.find((p) => p.id === seoModalId)?.title || ""
    : ""

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const params: PageListParams = {
        page,
        limit: LIMIT,
        status: view === "active" ? statusFilter || undefined : undefined,
        search: search || undefined,
        deleted: view === "trash",
      }
      const res = await listPages(params)
      setItems(res.data)
      setTotal(res.total)
    } catch (e) {
      toast.error(`加载失败：${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search, view])

  // 依赖变化即刷新列表
  useEffect(() => {
    void fetchList()
  }, [fetchList])

  // 搜索防抖（300ms）
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const handleAction = async (
    id: string,
    action: string
  ) => {
    const actionMap: Record<string, () => Promise<unknown>> = {
      publish: () => publishPage(id),
      unpublish: () => unpublishPage(id),
      duplicate: () => duplicatePage(id),
      restore: () => restorePage(id),
    }
    if (action === "delete") {
      if (!window.confirm("确认删除该页面？")) return
      try {
        await deletePage(id)
        await fetchList()
      } catch (e) {
        toast.error(`删除失败：${(e as Error).message}`)
      }
      return
    }
    const fn = actionMap[action]
    if (!fn) return
    try {
      await fn()
      await fetchList()
    } catch (e) {
      toast.error(`${action}失败：${(e as Error).message}`)
    }
  }

  const handleSaveAsTemplate = async (pageId: string) => {
    try {
      await getPage(pageId)
      navigate(`/admin/templates/create-from-page?pageId=${pageId}`)
    } catch (e) {
      toast.error(`加载页面失败：${(e as Error).message}`)
    }
  }

  const handleExport = async (pageId: string, title: string) => {
    try {
      await handleExportPage(pageId, title)
    } catch (e) {
      toast.error(`导出失败：${(e as Error).message}`)
    }
  }

  // SEO 弹窗：打开时加载当前页面的 seo 元数据
  const handleOpenSeo = async (pageId: string) => {
    try {
      const p = await getPage(pageId)
      const seo: SeoMetadata = (p.metadata?.seo as SeoMetadata) || {}
      setSeoValues({
        title: seo.title || "",
        description: seo.description || "",
        keywords: seo.keywords || [],
        ogImage: seo.ogImage || "",
      })
      setSeoModalId(pageId)
    } catch (e) {
      toast.error(`加载页面失败：${(e as Error).message}`)
    }
  }

  // SEO 弹窗：保存
  const handleSaveSeo = async () => {
    if (!seoModalId) return
    setSeoSaving(true)
    try {
      const current = await getPage(seoModalId)
      const metadata = { ...current.metadata, seo: seoValues }
      await updatePage(seoModalId, { metadata })
      setSeoModalId(null)
      await fetchList()
    } catch (e) {
      toast.error(`SEO 保存失败：${(e as Error).message}`)
    } finally {
      setSeoSaving(false)
    }
  }

  const handleSeoKeywordsChange = (val: string) => {
    const keywords = val
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)
    setSeoValues((prev) => ({ ...prev, keywords }))
  }

  const handleCreateFirstPage = async () => {
    try {
      const newPage = await createPage({ title: "Untitled Page" })
      navigate(`/editor?pageId=${newPage.id}`)
    } catch (e) {
      toast.error(`创建页面失败：${(e as Error).message}`)
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6 page-enter">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>管理后台</CardTitle>
          <Button size="sm" onClick={() => navigate("/admin/create")}>
            创建页面
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 工具栏：搜索 + 状态筛选 + 视图切换 */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              placeholder="搜索标题 / 描述 / slug / 内容"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {view === "active" && (
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
            <Button
              variant={view === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setView("active")
                setPage(1)
              }}
            >
              活跃
            </Button>
            <Button
              variant={view === "trash" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setView("trash")
                setPage(1)
              }}
            >
              回收站
            </Button>
          </div>

          {/* 表格 */}
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">标题</th>
                  <th className="px-3 py-2 text-left font-medium">slug</th>
                  <th className="px-3 py-2 text-left font-medium">状态</th>
                  <th className="px-3 py-2 text-left font-medium">浏览量</th>
                  <th className="px-3 py-2 text-left font-medium">更新时间</th>
                  <th className="px-3 py-2 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && !loading && (
                  <EmptyState isTrash={view === "trash"} onCreatePage={handleCreateFirstPage} />
                )}
                {items.length === 0 && loading && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    </td>
                  </tr>
                )}
                {items.map((p) => (
                  <PageRow
                    key={p.id}
                    page={p}
                    view={view}
                    navigate={navigate}
                    onAction={handleAction}
                    onOpenSeo={handleOpenSeo}
                    onSaveAsTemplate={handleSaveAsTemplate}
                    onExport={handleExport}
                  />
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

      {/* SEO 设置弹窗 */}
      {seoModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
            <h3 className="mb-1 text-lg font-semibold">SEO 设置</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              页面：{seoModalPageTitle}
            </p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">SEO 标题</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                  value={seoValues.title || ""}
                  onChange={(e) =>
                    setSeoValues((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="留空则使用页面标题"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">SEO 描述</label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                  value={seoValues.description || ""}
                  onChange={(e) =>
                    setSeoValues((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="页面描述（meta description）"
                  rows={3}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">关键词</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                  value={(seoValues.keywords || []).join(", ")}
                  onChange={(e) => handleSeoKeywordsChange(e.target.value)}
                  placeholder="用逗号分隔，如：新闻, 科技, 教程"
                />
                <p className="text-xs text-muted-foreground">
                  多个关键词用逗号分隔
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">分享图片 URL（OG）</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                  value={seoValues.ogImage || ""}
                  onChange={(e) =>
                    setSeoValues((prev) => ({ ...prev, ogImage: e.target.value }))
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveSeo} disabled={seoSaving}>
                  {seoSaving ? "保存中…" : "保存"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSeoModalId(null)}
                >
                  取消
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
