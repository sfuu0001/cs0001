// src/pages/admin/FormSubmissions.tsx
// 表单数据收集：展示某页面的表单提交记录。

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { getToken } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Submission {
  id: string
  pageId: string
  formConfig: Record<string, unknown>
  data: Record<string, unknown>
  createdAt: string
  ip: string
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("zh-CN")
}

async function fetchSubmissions(pageId: string): Promise<Submission[]> {
  const token = getToken()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`/api/submissions?pageId=${encodeURIComponent(pageId)}`, { headers })
  if (!res.ok) throw new Error("加载表单提交记录失败")
  const body = (await res.json()) as { data: Submission[] }
  return body.data
}

export default function FormSubmissions() {
  const [searchParams] = useSearchParams()
  const pageId = searchParams.get("pageId") || ""

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    if (!pageId) return
    setLoading(true)
    setError("")
    try {
      const data = await fetchSubmissions(pageId)
      setSubmissions(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [pageId])

  useEffect(() => {
    void load()
  }, [load])

  if (!pageId) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center text-muted-foreground">
        未指定页面 ID
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-6 page-enter">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>表单数据收集</CardTitle>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            刷新
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">加载中…</div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <span className="text-4xl">📋</span>
              <p className="text-muted-foreground">No form submissions yet</p>
              <p className="text-xs text-muted-foreground">
                Form submissions will appear here once users start filling out
                forms on your published pages.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-md border p-4 text-sm"
                >
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(s.createdAt)}</span>
                    <span>IP: {s.ip || "—"}</span>
                  </div>
                  <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
                    {JSON.stringify(s.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
