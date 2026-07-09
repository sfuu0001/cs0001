// src/pages/admin/Create.tsx
// 创建页：标题（必填）/ slug（可选）/ 描述 表单；提交 POST /api/pages 后跳转到编辑器。

import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { createPage } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Create() {
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError("标题不能为空")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const page = await createPage({
        title: title.trim(),
        slug: slug.trim() || undefined,
        description: description.trim(),
      })
      // 成功后跳转编辑器
      navigate(`/editor?pageId=${page.id}`)
    } catch (err) {
      setError((err as { message?: string }).message || "创建失败")
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>创建页面</CardTitle>
          <CardDescription>
            填写标题即可创建草稿，随后进入编辑器排版。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">标题 *</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="页面标题"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                slug（可选，留空由标题生成）
              </label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-page"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">描述（可选）</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="页面描述"
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "创建中…" : "创建并进入编辑器"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin")}
              >
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
