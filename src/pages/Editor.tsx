// src/pages/Editor.tsx
// 可视化编辑器页：支持 ?pageId= 与 /editor/:pageId。
// 二期改造：添加主题选择器 + "另存为模板"按钮 + 页面载入时加载主题变量。
// 三期优化：React.memo + 响应式设备预览切换
// 四期+：撤销/重做 + 暗色模式切换 + 组件层级树 + 自动保存版本历史
// 五期：Inspector 面板（Cmd+Shift+I 切换）

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { Puck } from "@measured/puck"
import type { Data } from "@measured/puck"
import { toast } from "sonner"
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
import { Skeleton } from "@/components/ui/skeleton"
import ThemeInjector from "@/puck/theme/ThemeInjector"
import { useDarkMode } from "@/lib/theme"
import { getToken } from "@/lib/auth"
import { generateComponent } from "@/lib/codegen"
import CodePreview from "@/pages/CodePreview"
import InspectorPanel from "@/components/Inspector/InspectorPanel"
import PuckSelectionSync from "@/components/Inspector/PuckSelectionSync"
import type { PuckSelectionSyncHandle } from "@/components/Inspector/PuckSelectionSync"

type LoadStatus = "loading" | "ready" | "notfound" | "noid"

type DeviceMode = "desktop" | "tablet" | "mobile"

type SidebarTab = "components" | "tree" | "inspector"

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

// ─── 组件层级树递归渲染 ─────────────────────────────────────────────

interface ContentNode {
  type: string
  props?: Record<string, unknown>
  children?: ContentNode[]
}

/** 递归渲染组件树节点 */
function TreeNode({
  node,
  depth = 0,
  onSelect,
}: {
  node: ContentNode
  depth?: number
  onSelect: (node: ContentNode) => void
}) {
  const hasChildren = node.children && node.children.length > 0
  const label = node.props?.id
    ? `${node.type} (#${node.props.id})`
    : node.type

  return (
    <li>
      <button
        type="button"
        className="w-full rounded px-2 py-1 text-left text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        📦 {label}
      </button>
      {hasChildren && (
        <ul className="list-none">
          {(node.children as ContentNode[]).map((child, i) => (
            <TreeNode key={i} node={child} depth={depth + 1} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  )
}

/** 从 Puck Data 的 content 数组中递归提取组件树 */
function buildTree(data: Data): ContentNode[] {
  const extract = (items: unknown[]): ContentNode[] => {
    if (!Array.isArray(items)) return []
    return items
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === "object")
      .map((item) => {
        const node: ContentNode = {
          type: String(item.type || "Unknown"),
          props: (item.props as Record<string, unknown>) || {},
        }
        // 递归处理子组件
        const props = item.props as Record<string, unknown> | undefined
        if (props && Array.isArray(props.children)) {
          node.children = extract(props.children)
        }
        return node
      })
  }
  return extract(data.content)
}

// ─── 递归查找 / 更新组件 ──────────────────────────────────────────

/**
 * 递归遍历 data.content，找到 id 匹配的组件，更新其 props
 * 返回新的 Data 副本
 */
function updateComponentProps(
  data: Data,
  targetId: string,
  key: string,
  value: unknown,
): Data {
  const newData = structuredClone(data)

  function walk(items: unknown[]): boolean {
    if (!Array.isArray(items)) return false
    for (const item of items) {
      if (item && typeof item === "object") {
        const props = (item as Record<string, unknown>).props as Record<string, unknown> | undefined
        if (props && props.id === targetId) {
          props[key] = value
          return true
        }
        // 递归 children
        if (props && Array.isArray(props.children)) {
          if (walk(props.children)) return true
        }
        // 递归 zones
        if (props && props.zones && typeof props.zones === "object") {
          for (const zoneVal of Object.values(props.zones as Record<string, unknown>)) {
            if (Array.isArray(zoneVal)) {
              if (walk(zoneVal)) return true
            }
          }
        }
      }
    }
    return false
  }

  walk(newData.content)
  return newData
}

// ─── 撤销/重做 Hook ───────────────────────────────────────────────

const MAX_HISTORY = 50

function useUndoRedo(initialData: Data) {
  const historyRef = useRef<Data[]>([structuredClone(initialData)])
  const currentIndexRef = useRef(0)

  const pushState = useCallback((data: Data) => {
    const clone = structuredClone(data)
    const idx = currentIndexRef.current
    // 丢弃 future
    historyRef.current = historyRef.current.slice(0, idx + 1)
    historyRef.current.push(clone)
    // 限制最大历史数
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift()
    }
    currentIndexRef.current = historyRef.current.length - 1
  }, [])

  const undo = useCallback((): Data | null => {
    if (currentIndexRef.current <= 0) return null
    currentIndexRef.current -= 1
    return structuredClone(historyRef.current[currentIndexRef.current])
  }, [])

  const redo = useCallback((): Data | null => {
    if (currentIndexRef.current >= historyRef.current.length - 1) return null
    currentIndexRef.current += 1
    return structuredClone(historyRef.current[currentIndexRef.current])
  }, [])

  const canUndo = (): boolean => currentIndexRef.current > 0
  const canRedo = (): boolean =>
    currentIndexRef.current < historyRef.current.length - 1

  const resetHistory = useCallback((data: Data) => {
    historyRef.current = [structuredClone(data)]
    currentIndexRef.current = 0
  }, [])

  return { pushState, undo, redo, canUndo, canRedo, resetHistory }
}

// ─── 编辑器内部组件 ────────────────────────────────────────────────

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

  // 响应式设备预览模式
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop")

  // 暗色模式
  const { isDark, toggleTheme } = useDarkMode()

  // 撤销/重做
  const { pushState, undo, redo, canUndo, canRedo, resetHistory } = useUndoRedo(emptyData)

  // 侧边栏 tab
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("components")

  // 是否已加载 — 用于控制首次不触发历史推入
  const isFirstLoad = useRef(true)

  // 版本自动保存标记
  const [versionSaving, setVersionSaving] = useState(false)

  // ─── RAF 节流：拖拽时仅通过 requestAnimationFrame 更新 data ───
  const latestData = useRef<Data>(emptyData)
  const rafId = useRef<number>(0)
  const lastPushTime = useRef<number>(Date.now())
  const historyRefForThrottle = useRef<Data[]>([])

  // 代码预览弹窗
  const [codePreview, setCodePreview] = useState<string | null>(null)

  // 工具栏提示条（首次编辑时显示）
  const [showTip, setShowTip] = useState(() => {
    return !localStorage.getItem("editorTipDismissed")
  })

  // ─── Inspector 状态 ────────────────────────────────────────────
  const [inspectorVisible, setInspectorVisible] = useState(false)
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)
  const puckSyncRef = useRef<PuckSelectionSyncHandle | null>(null)

  const dismissTip = () => {
    setShowTip(false)
    localStorage.setItem("editorTipDismissed", "true")
  }

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
        latestData.current = content
        setPage(meta)
        setTitle(meta.title)
        setDescription(meta.description || "")
        setStatus("ready")

        // 重置历史栈
        resetHistory(content)

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
  }, [pageId, resetHistory])

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

  // 键盘快捷键：Ctrl+Z 撤销，Ctrl+Y 重做，Cmd/Ctrl+Shift+I 切换 Inspector
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Z 撤销
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        const prev = undo()
        if (prev) {
          setData(prev)
          latestData.current = prev
        }
        return
      }
      // Ctrl+Y 或 Ctrl+Shift+Z 重做
      if ((e.ctrlKey && e.key === "y") || (e.ctrlKey && e.key === "z" && e.shiftKey)) {
        e.preventDefault()
        const next = redo()
        if (next) {
          setData(next)
          latestData.current = next
        }
        return
      }
      // Cmd/Ctrl+Shift+I 切换 Inspector
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "i") {
        e.preventDefault()
        setInspectorVisible((v) => !v)
        return
      }
      // Escape 关闭 Inspector
      if (e.key === "Escape" && inspectorVisible) {
        setInspectorVisible(false)
        return
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [undo, redo, inspectorVisible])

  const handleThemeChange = async (themeId: string) => {
    setSelectedThemeId(themeId)
    if (!pageId) return
    try {
      await updatePage(pageId, {
        metadata: { ...(page?.metadata || {}), themeId: themeId || null },
      })
    } catch {
      // ignore
    }
  }

  // RAF 节流的 handleChange：拖拽时只存 latestData，RAF 中才 setData
  const handleChange = useCallback((d: Data) => {
    latestData.current = d
    cancelAnimationFrame(rafId.current)
    rafId.current = requestAnimationFrame(() => {
      setData(latestData.current)
      // 历史节流：间隔 >=500ms 才 push
      if (Date.now() - lastPushTime.current >= 500) {
        const copy = structuredClone(latestData.current)
        const historyArr = historyRefForThrottle.current
        if (
          historyArr.length === 0 ||
          JSON.stringify(copy) !== JSON.stringify(historyArr[historyArr.length - 1])
        ) {
          historyArr.push(copy)
          lastPushTime.current = Date.now()
          // 实际 push 到历史栈
          if (!isFirstLoad.current) {
            pushState(copy)
          }
        }
      }
    })
  }, [pushState])

  const handleSave = async (d?: Data) => {
    if (!pageId) return
    const content = d ?? data
    setSaving(true)
    try {
      await savePage(pageId, content)
      setData(content)
      toast.success("Page saved successfully")

      // 保存版本历史
      setVersionSaving(true)
      try {
        const token = getToken()
        if (token) {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
          await fetch(`/api/pages/${pageId}/versions`, { method: "POST", headers })
        }
      } catch {
        // 版本保存失败不影响主流程
      } finally {
        setVersionSaving(false)
      }
    } catch (e) {
      toast.error(`Failed to save: ${(e as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMeta = async () => {
    if (!pageId) return
    try {
      const updated = await updatePage(pageId, { title, description })
      setPage(updated)
      toast.success("Page info updated")
    } catch (e) {
      toast.error(`Update failed: ${(e as Error).message}`)
    }
  }

  const handlePublish = async (d: Data) => {
    if (!pageId) return
    await handleSave(d)
    try {
      const updated = await publishPage(pageId)
      setPage(updated)
      toast.success("Page published 🚀")
    } catch (e) {
      toast.error(`Publish failed: ${(e as Error).message}`)
    }
  }

  const handleUnpublish = async () => {
    if (!pageId) return
    try {
      const updated = await unpublishPage(pageId)
      setPage(updated)
      toast.success("Page unpublished")
    } catch (e) {
      toast.error(`Operation failed: ${(e as Error).message}`)
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
      toast.success("Template created successfully")
    } catch (e) {
      toast.error(`Failed to create template: ${(e as Error).message}`)
    } finally {
      setTemplateSubmitting(false)
    }
  }

  const handleUndo = () => {
    const prev = undo()
    if (prev) {
      setData(prev)
      latestData.current = prev
    }
  }

  const handleRedo = () => {
    const next = redo()
    if (next) {
      setData(next)
      latestData.current = next
    }
  }

  const handleTreeSelect = (_node: ContentNode) => {
    // 旧 tree tab 的点击 — 保留空实现
  }

  const handleExportCode = () => {
    try {
      const code = generateComponent(data)
      setCodePreview(code)
    } catch (e) {
      toast.error(`Code generation failed: ${(e as Error).message}`)
    }
  }

  // ─── Inspector 事件处理 ─────────────────────────────────────────

  /** 从树节点选择 — 同时同步到画布高亮 */
  const handleInspectorSelect = useCallback((id: string) => {
    setSelectedComponentId(id)
    // 同步到画布选中
    if (id && puckSyncRef.current) {
      puckSyncRef.current.selectById(id)
    }
  }, [])

  /** 从画布选中 — 同步到树高亮 */
  const handleCanvasSelect = useCallback((id: string | null) => {
    setSelectedComponentId(id)
  }, [])

  /** Props 编辑 → 更新 data */
  const handlePropChange = useCallback(
    (id: string, key: string, value: unknown) => {
      setData((prev) => {
        const updated = updateComponentProps(prev, id, key, value)
        latestData.current = updated
        return updated
      })
    },
    [],
  )

  /** 打开 Inspector */
  const handleOpenInspector = useCallback(() => {
    setInspectorVisible(true)
    setSidebarTab("inspector")
  }, [])

  /** 关闭 Inspector */
  const handleCloseInspector = useCallback(() => {
    setInspectorVisible(false)
  }, [])

  if (status === "noid") {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center page-enter">
        <p className="text-muted-foreground">未指定页面，请先创建页面。</p>
        <Link to="/admin/create" className="mt-4 inline-block">
          <Button>去创建页面</Button>
        </Link>
      </div>
    )
  }

  if (status === "notfound") {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center page-enter">
        <p className="text-muted-foreground">页面不存在或已被删除。</p>
        <Link to="/admin" className="mt-4 inline-block">
          <Button variant="outline">返回管理后台</Button>
        </Link>
      </div>
    )
  }

  if (status === "loading") {
    return (
      <div className="p-8 space-y-4 page-enter">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="flex gap-4 mt-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="mt-8 grid gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  const isPublished = page?.status === "published"
  const treeData = buildTree(data)

  return (
    <div className="flex h-screen flex-col">
      {/* 注入主题变量 */}
      <ThemeInjector variables={themeVariables} />

      {/* 顶部信息栏 + 操作 — sticky */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm shadow-sm flex flex-wrap items-center gap-3 border-b p-3">
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

        {/* 撤销/重做按钮 */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`rounded px-2 py-1 text-sm transition-colors ${
              canUndo()
                ? "text-foreground hover:bg-accent"
                : "text-muted-foreground/40 cursor-not-allowed"
            }`}
            onClick={handleUndo}
            disabled={!canUndo()}
            title="撤销 (Ctrl+Z)"
          >
            ↩ 撤销
          </button>
          <button
            type="button"
            className={`rounded px-2 py-1 text-sm transition-colors ${
              canRedo()
                ? "text-foreground hover:bg-accent"
                : "text-muted-foreground/40 cursor-not-allowed"
            }`}
            onClick={handleRedo}
            disabled={!canRedo()}
            title="重做 (Ctrl+Y)"
          >
            ↪ 重做
          </button>
        </div>

        {/* 暗色模式切换 */}
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-md px-2 py-1.5 text-sm transition-colors text-muted-foreground hover:text-foreground"
          title={isDark ? "切换到亮色模式" : "切换到暗色模式"}
        >
          {isDark ? "☀️" : "🌙"}
        </button>

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

        {/* Inspector 开关按钮 */}
        <button
          type="button"
          onClick={handleOpenInspector}
          className={`rounded-md px-2 py-1.5 text-sm transition-colors ${
            inspectorVisible
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
          title="Inspector (Cmd+Shift+I)"
        >
          🔍 Inspector
        </button>

        <Button variant="outline" size="sm" onClick={handleSaveMeta}>
          保存信息
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSave()}
          disabled={saving}
        >
          {versionSaving ? "保存中…" : "保存内容"}
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
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCode}
        >
          导出代码
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

      {/* 工具栏提示条 */}
      {showTip && (
        <div className="flex items-center justify-between bg-primary/10 px-4 py-2 text-sm">
          <span>
            💡 Drag components from the left panel to start building. Tip: Use{" "}
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs">
              Ctrl+Z
            </kbd>{" "}
            to undo, or{" "}
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs">
              {navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"}+Shift+I
            </kbd>{" "}
            to open Inspector.
          </span>
          <button
            type="button"
            onClick={dismissTip}
            className="ml-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss tip"
          >
            ✕
          </button>
        </div>
      )}

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

      {/* 代码预览弹窗 */}
      {codePreview !== null && (
        <CodePreview
          code={codePreview}
          onClose={() => setCodePreview(null)}
        />
      )}

      {/* 主区域：侧边栏 + 编辑器 + Inspector 面板 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧边栏 */}
        <div className="w-64 border-r border-border bg-background flex flex-col">
          {/* Tab 切换 */}
          <div className="flex border-b border-border">
            <button
              type="button"
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                sidebarTab === "components"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setSidebarTab("components")}
            >
              组件库
            </button>
            <button
              type="button"
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                sidebarTab === "tree"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setSidebarTab("tree")}
            >
              层级树
            </button>
            <button
              type="button"
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                sidebarTab === "inspector"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => {
                setSidebarTab("inspector")
                handleOpenInspector()
              }}
            >
              🔍 Inspector
            </button>
          </div>

          {/* 层级树面板 */}
          {sidebarTab === "tree" && (
            <div className="flex-1 overflow-y-auto p-2">
              {treeData.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  页面内容为空
                </p>
              ) : (
                <ul className="list-none space-y-0.5">
                  {treeData.map((node, i) => (
                    <TreeNode key={i} node={node} depth={0} onSelect={handleTreeSelect} />
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 组件库面板 */}
          {sidebarTab === "components" && (
            <div className="flex-1 overflow-y-auto p-2">
              <p className="py-4 text-center text-xs text-muted-foreground">
                请使用编辑器内置的组件面板添加组件
              </p>
            </div>
          )}

          {/* Inspector 标签页内容 — 提示打开右侧面板 */}
          {sidebarTab === "inspector" && (
            <div className="flex-1 overflow-y-auto p-4">
              {inspectorVisible ? (
                <p className="text-center text-xs text-muted-foreground">
                  Inspector 面板已在右侧打开
                </p>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6">
                  <p className="text-xs text-muted-foreground">
                    点击"打开面板"或按快捷键
                  </p>
                  <kbd className="rounded border border-border bg-muted px-2 py-1 font-mono text-xs">
                    {navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"}+Shift+I
                  </kbd>
                  <Button size="sm" onClick={handleOpenInspector}>
                    打开 Inspector 面板
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Puck 编辑器 + Inspector 面板 */}
        <div className="flex flex-1 overflow-hidden">
          <div className={`flex-1 overflow-hidden will-change-transform ${DEVICE_CLASSES[deviceMode]}`}>
            <Puck
              config={config}
              data={data}
              onChange={(d: Data) => handleChange(d)}
              onPublish={(d: Data) => handlePublish(d)}
            >
              {/* PuckSelectionSync 作为 Puck 子组件使用 usePuck() 上下文 */}
              <PuckSelectionSync
                selectedId={selectedComponentId}
                onSelect={handleCanvasSelect}
                handleRef={puckSyncRef}
              />
            </Puck>
          </div>

          {/* Inspector 右侧面板 */}
          <InspectorPanel
            data={data}
            visible={inspectorVisible}
            selectedId={selectedComponentId}
            onSelect={handleInspectorSelect}
            onPropChange={handlePropChange}
            onClose={handleCloseInspector}
          />
        </div>
      </div>
    </div>
  )
}

/** 带 React.memo 避免无关父组件重渲染 */
const Editor = memo(EditorInner)
Editor.displayName = "Editor"

export default Editor
