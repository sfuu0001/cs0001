// src/pages/admin/Themes/CreateEdit.tsx
// 创建/编辑主题表单。

import { useEffect, useState, type FormEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { getTheme, createTheme, updateTheme } from "@/lib/api.themes"
import type { Theme } from "@/types/theme"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/** 常用的前 N 个 CSS 变量及其标签 */
const COMMON_VARIABLES: { key: string; label: string }[] = [
  { key: "--primary", label: "主色" },
  { key: "--primary-foreground", label: "主色文字" },
  { key: "--background", label: "背景色" },
  { key: "--foreground", label: "前景色（文字）" },
  { key: "--muted", label: "柔和背景" },
  { key: "--muted-foreground", label: "柔和文字" },
  { key: "--accent", label: "强调背景" },
  { key: "--accent-foreground", label: "强调文字" },
  { key: "--border", label: "边框色" },
  { key: "--ring", label: "焦点环色" },
  { key: "--radius", label: "圆角" },
  { key: "--font-family", label: "字体" },
  { key: "--card-background", label: "卡片背景" },
  { key: "--card-border", label: "卡片边框" },
  { key: "--input-background", label: "输入框背景" },
  { key: "--input-border", label: "输入框边框" },
  { key: "--shadow-sm", label: "小阴影" },
  { key: "--shadow-md", label: "中阴影" },
]

function getDefaultVariables(): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const { key } of COMMON_VARIABLES) {
    vars[key] = ""
  }
  return vars
}

export default function CreateEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [variables, setVariables] = useState<Record<string, string>>(
    getDefaultVariables()
  )
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    getTheme(id)
      .then((theme: Theme) => {
        if (cancelled) return
        setName(theme.name)
        setDescription(theme.description || "")
        const merged = { ...getDefaultVariables(), ...theme.variables }
        setVariables(merged)
      })
      .catch((e) => {
        if (!cancelled) {
          toast.error(`加载主题失败：${(e as Error).message}`)
          navigate("/admin/themes")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, navigate])

  const handleVarChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }))
  }

  const addCustomVar = () => {
    const newKey = `--custom-${Date.now()}`
    setVariables((prev) => ({ ...prev, [newKey]: "" }))
  }

  const removeCustomVar = (key: string) => {
    setVariables((prev) => {
      const { [key]: _, ...rest } = prev
      return rest
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("名称不能为空")
      return
    }

    // 过滤掉空值的变量
    const cleaned: Record<string, string> = {}
    for (const [key, val] of Object.entries(variables)) {
      if (val.trim()) cleaned[key] = val.trim()
    }

    setSubmitting(true)
    setError("")
    try {
      if (isEdit && id) {
        await updateTheme(id, {
          name: name.trim(),
          description: description.trim(),
          variables: cleaned,
        })
      } else {
        await createTheme({
          name: name.trim(),
          description: description.trim(),
          variables: cleaned,
        })
      }
      navigate("/admin/themes")
    } catch (err) {
      setError((err as { message?: string }).message || "保存失败")
      setSubmitting(false)
    }
  }

  const displayKeys = showAll
    ? Object.keys(variables)
    : COMMON_VARIABLES.map((v) => v.key)

  if (loading) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            加载中…
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "编辑主题" : "创建主题"}</CardTitle>
          <CardDescription>
            配置 CSS 变量以定义页面视觉风格。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">名称 *</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="主题名称"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">描述</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="主题描述（可选）"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">CSS 变量</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomVar}
                  >
                    添加变量
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll(!showAll)}
                  >
                    {showAll ? "仅常用" : "全部展开"}
                  </Button>
                </div>
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border p-3">
                {displayKeys.map((key) => {
                  const meta = COMMON_VARIABLES.find((v) => v.key === key)
                  const label = meta?.label || key
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="w-36 shrink-0 text-xs font-mono text-muted-foreground truncate" title={key}>
                        {key}
                      </span>
                      <input
                        className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring"
                        value={variables[key] || ""}
                        onChange={(e) => handleVarChange(key, e.target.value)}
                        placeholder={label}
                      />
                      {!COMMON_VARIABLES.some((v) => v.key === key) && (
                        <button
                          type="button"
                          className="text-xs text-destructive hover:underline"
                          onClick={() => removeCustomVar(key)}
                        >
                          删除
                        </button>
                      )}
                    </div>
                  )
                })}
                {displayKeys.length === 0 && (
                  <p className="text-xs text-muted-foreground">暂无变量</p>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "保存中…" : isEdit ? "更新主题" : "创建主题"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/themes")}
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
