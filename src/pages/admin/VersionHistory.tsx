// src/pages/admin/VersionHistory.tsx
// 页面版本历史：版本列表（时间戳+版本号+恢复按钮）。

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { getToken } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Version {
  id: string
  pageId: string
  version: number
  createdAt: string
  createdBy: string | null
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("zh-CN")
}

async function fetchVersions(pageId: string): Promise<Version[]> {
  const token = getToken()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`/api/pages/${pageId}/versions`, { headers })
  if (!res.ok) throw new Error("加载版本列表失败")
  const body = (await res.json()) as { data: Version[] }
  return body.data
}

async function restoreVersion(pageId: string, versionId: string): Promise<void> {
  const token = getToken()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`/api/pages/${pageId}/versions/${versionId}/restore`, {
    method: "POST",
    headers,
  })
  if (!res.ok) throw new Error("恢复版本失败")
}

export default function VersionHistory() {
  const [searchParams] = useSearchParams()
  const pageId = searchParams.get("pageId") || ""

  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    if (!pageId) return
    setLoading(true)
    setError("")
    try {
      const data = await fetchVersions(pageId)
      setVersions(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [pageId])

  useEffect(() => {
    void load()
  }, [load])

  const handleRestore = async (vid: string) => {
    if (!window.confirm("确认恢复到该版本？当前内容将被覆盖。")) return
    setRestoring(vid)
    try {
      await restoreVersion(pageId, vid)
      toast.success("Version restored successfully")
      await load()
    } catch (err) {
      toast.error(`恢复失败：${(err as Error).message}`)
    } finally {
      setRestoring(null)
    }
  }

  if (!pageId) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center text-muted-foreground">
        未指定页面 ID
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6 page-enter">
      <Card>
        <CardHeader>
          <CardTitle>版本历史</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">加载中…</div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <span className="text-4xl">📜</span>
              <p className="text-muted-foreground">No version history yet</p>
              <p className="text-xs text-muted-foreground">
                Versions are created automatically when you save your page.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">版本号</th>
                    <th className="px-3 py-2 text-left font-medium">创建时间</th>
                    <th className="px-3 py-2 text-left font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((v) => (
                    <tr key={v.id} className="border-t">
                      <td className="px-3 py-2 font-mono">v{v.version}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {formatDate(v.createdAt)}
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(v.id)}
                          disabled={restoring === v.id}
                        >
                          {restoring === v.id ? "恢复中…" : "恢复"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
