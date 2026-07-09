// src/pages/admin/Templates/CreateFromPage.tsx
// 从当前页面保存为模板：接收来自 Editor 或 List 页面的 pageId 和 content，
// 表单有 name/description/category，保存调 createTemplate。

import { useEffect, useState, type FormEvent } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { getPage } from "@/lib/api"
import { createTemplate } from "@/lib/api.templates"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const CATEGORY_OPTIONS = ["landing", "about", "contact", "blog", "gallery", "other"]

export default function CreateFromPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const pageId = params.get("pageId") || ""

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("landing")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [pageTitle, setPageTitle] = useState("")

  useEffect(() => {
    if (!pageId) return
    setLoading(true)
    getPage(pageId)
      .then((page) => {
        setPageTitle(page.title)
        setName(`模板：${page.title}`)
        setDescription(page.description || "")
      })
      .catch(() => {
        // ignore
      })
      .finally(() => setLoading(false))
  }, [pageId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("名称不能为空")
      return
    }
    if (!pageId) {
      setError("缺少页面 ID")
      return
    }

    setSubmitting(true)
    setError("")
    try {
      const page = await getPage(pageId)
      await createTemplate({
        name: name.trim(),
        description: description.trim(),
        content: page.content,
        category: category === "other" ? "" : category,
      })
      navigate("/admin/templates")
    } catch (err) {
      setError((err as { message?: string }).message || "创建模板失败")
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>从页面创建模板</CardTitle>
          <CardDescription>
            将现有页面保存为模板，供后续快速创建相似页面。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!pageId ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                请先在编辑器或页面列表中打开一个页面，再使用此功能。
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin")}
                >
                  返回页面列表
                </Button>
                <Button onClick={() => navigate("/admin/create")}>
                  创建新页面
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">加载页面信息…</p>
              ) : (
                <>
                  {pageTitle && (
                    <p className="text-xs text-muted-foreground">
                      基于页面：{pageTitle}
                    </p>
                  )}
                  <div className="space-y-1">
                    <label className="text-sm font-medium">名称 *</label>
                    <input
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="模板名称"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">描述</label>
                    <textarea
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="模板描述（可选）"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">分类</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "创建中…" : "创建模板"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/admin/templates")}
                    >
                      取消
                    </Button>
                  </div>
                </>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
