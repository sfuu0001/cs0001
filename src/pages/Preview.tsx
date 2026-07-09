// src/pages/Preview.tsx
// 预览页：支持 ?pageId= 与 /preview/:pageId。
// 二期改造：加载页面时读取 themeId，注入对应主题 CSS 变量。
// 调用 GET /api/preview/:pageId（后端每次 viewCount + 1），用 <Render> 只读渲染。

import { memo, useEffect, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { Render } from "@measured/puck"
import type { Data } from "@measured/puck"
import { config, emptyData } from "@/puck/config"
import { previewPage, getPage } from "@/lib/api"
import { Button } from "@/components/ui/button"
import ThemeInjector from "@/puck/theme/ThemeInjector"

type LoadStatus = "loading" | "ready" | "notfound" | "noid"

function PreviewInner() {
  const { pageId: routeId } = useParams()
  const [params] = useSearchParams()
  const pageId = routeId || params.get("pageId") || ""

  const [data, setData] = useState<Data>(emptyData)
  const [status, setStatus] = useState<LoadStatus>("loading")
  const [themeVariables, setThemeVariables] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    if (!pageId) {
      setStatus("noid")
      return
    }
    let cancelled = false
    setStatus("loading")
    // 同时获取内容和页面元数据（含 themeId）
    Promise.all([
      previewPage(pageId),
      getPage(pageId),
    ])
      .then(([content, page]) => {
        if (cancelled) return
        setData(content)
        setStatus("ready")

        // 如果有主题，加载主题变量
        const metaThemeId = page.metadata?.themeId as string | undefined
        if (metaThemeId) {
          import("@/lib/api.themes").then(({ getTheme }) => {
            getTheme(metaThemeId).then((theme) => {
              if (!cancelled) setThemeVariables(theme.variables)
            }).catch(() => {})
          })
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("notfound")
      })
    return () => {
      cancelled = true
    }
  }, [pageId])

  if (status === "noid") {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <p className="text-muted-foreground">未指定页面，无法预览。</p>
        <Link to="/admin" className="mt-4 inline-block">
          <Button variant="outline">前往管理后台</Button>
        </Link>
      </div>
    )
  }

  if (status === "notfound") {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <p className="text-muted-foreground">页面不存在或已被删除。</p>
        <Link to="/admin" className="mt-4 inline-block">
          <Button variant="outline">返回管理后台</Button>
        </Link>
      </div>
    )
  }

  if (status === "loading") {
    return <div className="p-8 text-muted-foreground">加载中…</div>
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <ThemeInjector variables={themeVariables} />
      <Render config={config} data={data} />
    </div>
  )
}

/** 带 React.memo 避免无关父组件重渲染 */
const Preview = memo(PreviewInner)
Preview.displayName = "Preview"

export default Preview
