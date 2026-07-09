// src/pages/Editor.tsx
// 可视化编辑器页：支持 ?pageId= 与 /editor/:pageId。
// 二期改造：添加主题选择器 + "另存为模板"按钮 + 页面载入时加载主题变量。
// 三期优化：React.memo + 响应式设备预览切换

import { memo, useEffect, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { Puck } from "@measured/puck"
import type { Data } from "@measured/puck"
import { config, emptyData } from "@/puck/config"
import {
  loadPage,
  savePage,
  getPage,
  updatePage,
  publishPage,
  unpublishPage,
} from "@/lib/api"
import { listThemes } from "@/lib/api.themes"
import { createTemplate } from "@/lib/api.templates"
import type { Page } from "@/types/page"
import type { Theme } from "@/types/theme"
import { Button } from "@/components/ui/button"
import ThemeInjector from "@/puck/theme/ThemeInjector"

type LoadStatus = "loading" | "ready" | "notfound" | "noid"

type DeviceMode = "desktop" | "tablet" | "mobile"

const DEVICE_ICONS: Record<DeviceMode, string> = {
  desktop: "🖥",
  tablet: "📱",
  mobile: "📲",
}

const DEVICE_LABELS: Record<DeviceMode, string> = {
  desktop: "桌面",
  tablet: "平板",
  mobile: "手机",
}

const DEVICE_CLASSES: Record<DeviceMode, string> = {
  desktop: "max-w-none",
  tablet: "max-w-3xl mx-auto",
  mobile: "max-w-sm mx-auto",
}

function EditorInner() {
  const { pageId: routeId } = useParams()
  const [params] = useSearchParams()
  const pageId = routeId || params.get("pageId") || ""

  const [data, setData] = useState<Data>(emptyData)
  const [page, setPage] = useState<Page | null>(null)
  const [status, setStatus] = useState<LoadStatus>("loading")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  // 主题相关
  const [themes, setThemes] = useState<Theme[]>([])
  const [selectedThemeId, setSelectedThemeId] = useState<string>("")
  const [themeVariables, setThemeVariables] = useState<Record<string, string> | null>(null)

  // 另存为模板弹窗
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [templateCategory, setTemplateCategory] = useState("landing")
  const [templateSubmitting, setTemplateSubmitting] = useState(false)

  // 响应式设备预览模式（仅影响画布容器宽度，不影响保存/发布逻辑）
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop")

  useEffect(() => {
    if (!pageId) {
      setStatus("noid")
      return
    }
    let cancelled = false
    setStatus("loading")
    void (async () => {
      try {
        const [content, meta] = await Promise.all([
          loadPage(pageId),
          getPage(pageId),
        ])
        if (cancelled) return
        setData(content)
        setPage(meta)
        setTitle(meta.title)
        setDescription(meta.description || "")
        setStatus("ready")

        // 若页面有 themeId，加载主题
        const metaThemeId = meta.metadata?.themeId as string | undefined
        if (metaThemeId) {
          setSelectedThemeId(metaThemeId)
        }
      } catch {
        if (!cancelled) setStatus("notfound")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pageId])

  // 加载主题列表
  useEffect(() => {
    if (status !== "ready") return
    listThemes({ limit: 100 })
      .then((res) => setThemes(res.data))
      .catch(() => {})
  }, [status])

  // 选中主题时获取详情并注入变量
  useEffect(() => {
    if (!selectedThemeId) {
      setThemeVariables(null)
      return
    }
    let cancelled = false
    import("@/lib/api.themes").then(({ getTheme }) => {
      getTheme(selectedThemeId).then((theme) => {
        if (!cancelled) setThemeVariables(theme.variables)
      }).catch(() => {})
    })
    return () => { cancelled = true }
  }, [selectedThemeId])

  const handleThemeChange = async (themeId: string) => {
    setSelectedThemeId(themeId)
    if (!pageId) return
    // 更新页面 metadata.themeId
    try {
      await updatePage(pageId, {
        metadata: { ...(page?.metadata || {}), themeId: themeId || null },
      })
    } catch {
      // ignore
    }
  }

  const handleSave = async (d?: Data) => {
    if (!pageId) return
    const content = d ?? data
    setSaving(true)
    try {
      await savePage(pageId, content)
      setData(content)
      window.alert("已保存 ✅")
    } catch (e) {
      window.alert(`保存失败：${(e as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMeta = async () => {
    if (!pageId) return
    try {
      const updated = await updatePage(pageId, { title, description })
      setPage(updated)
      window.alert("信息已更新 ✅")
    } catch (e) {
      window.alert(`更新失败：${(e as Error).message}`)
    }
  }

  const handlePublish = async (d: Data) => {
    if (!pageId) return
    await handleSave(d)
    try {
      const updated = await publishPage(pageId)
      setPage(updated)
      window.alert("已发布 🚀")
    } catch (e) {
      window.alert(`发布失败：${(e as Error).message}`)
    }
  }

  const handleUnpublish = async () => {
    if (!pageId) return
    try {
      const updated = await unpublishPage(pageId)
      setPage(updated)
      window.alert("已取消发布")
    } catch (e) {
      window.alert(`操作失败：${(e as Error).message}`)
    }
  }

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim() || !pageId) return
    setTemplateSubmitting(true)
    try {
      await createTemplate({
        name: templateName.trim(),
        description: `从页面「${title}」创建的模板`,
        content: data,
        category: templateCategory,
      })
      setShowTemplateForm(false)
      setTemplateName("")
      window.alert("模板已创建 ✅")
    } catch (e) {
      window.alert(`创建模板失败：${(e as Error).message}`)
    } finally {
      setTemplateSubmitting(false)
    }
  }

  if (status === "noid") {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <p className="text-muted-foreground">未指定页面，请先创建页面。</p>
        <Link to="/admin/create" className="mt-4 inline-block">
          <Button>去创建页面</Button>
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

  const isPublished = page?.status === "published"

  return (
    <div className="flex h-screen flex-col">
      {/* 注入主题变量 */}
      <ThemeInjector variables={themeVariables} />

      {/* 顶部信息栏 + 操作 */}
      <div className="flex flex-wrap items-center gap-3 border-b bg-background p-3">
        <div className="flex flex-1 flex-col gap-1">
          <input
            className="w-full max-w-md rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring"
            value={title}
            placeholder="页面标题"
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="w-full max-w-md rounded-md border border-input bg-background px-3 py-1.5 text-xs text-muted-foreground outline-none focus:border-ring"
            value={description}
            placeholder="页面描述（可选）"
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* 响应式设备预览切换 */}
        <div className="flex items-center gap-1 rounded-md border border-input p-0.5">
          {(Object.keys(DEVICE_CLASSES) as DeviceMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                deviceMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              }`}
              onClick={() => setDeviceMode(mode)}
              title={DEVICE_LABELS[mode]}
            >
              {DEVICE_ICONS[mode]} {DEVICE_LABELS[mode]}
            </button>
          ))}
        </div>

        {/* 主题选择器 */}
        <select
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring"
          value={selectedThemeId}
          onChange={(e) => handleThemeChange(e.target.value)}
        >
          <option value="">无主题</option>
          {themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <Button variant="outline" size="sm" onClick={handleSaveMeta}>
          保存信息
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSave()}
          disabled={saving}
        >
          保存内容
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setTemplateName(title || "")
            setShowTemplateForm(true)
          }}
        >
          另存为模板
        </Button>
        {isPublished ? (
          <Button variant="secondary" size="sm" onClick={handleUnpublish}>
            取消发布
          </Button>
        ) : (
          <Button size="sm" onClick={() => handlePublish(data)}>
            发布
          </Button>
        )}
      </div>

      {/* 另存为模板弹窗 */}
      {showTemplateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">另存为模板</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">名称 *</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="模板名称"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">分类</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                >
                  <option value="landing">landing</option>
                  <option value="about">about</option>
                  <option value="contact">contact</option>
                  <option value="blog">blog</option>
                  <option value="gallery">gallery</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveAsTemplate}
                  disabled={templateSubmitting || !templateName.trim()}
                >
                  {templateSubmitting ? "创建中…" : "保存模板"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowTemplateForm(false)}
                >
                  取消
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Puck 编辑器（受控 + onChange 同步最新内容） */}
      <div className={`flex-1 overflow-hidden ${DEVICE_CLASSES[deviceMode]}`}>
        <Puck
          config={config}
          data={data}
          onChange={(d: Data) => setData(d)}
          onPublish={(d: Data) => handlePublish(d)}
        />
      </div>
    </div>
  )
}

/** 带 React.memo 避免无关父组件重渲染 */
const Editor = memo(EditorInner)
Editor.displayName = "Editor"

export default Editor
