// src/pages/admin/Themes/ImportTheme.tsx
// 导入主题：文件拖拽/点击上传 .json 文件，解析后验证格式，确认后调用 import API。

import { useRef, useState, type DragEvent } from "react"
import { useNavigate } from "react-router-dom"
import { importTheme } from "@/lib/api.themes"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ParsedTheme {
  name: string
  description?: string
  variables: Record<string, string>
}

export default function ImportTheme() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [parsed, setParsed] = useState<ParsedTheme | null>(null)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [fileName, setFileName] = useState("")

  const parseFile = (file: File) => {
    setError("")
    setParsed(null)
    setFileName(file.name)

    if (!file.name.endsWith(".json")) {
      setError("请上传 .json 文件")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string)
        if (!raw.name || typeof raw.name !== "string") {
          setError("缺少 name 字段（必须是字符串）")
          return
        }
        if (!raw.variables || typeof raw.variables !== "object") {
          setError("缺少 variables 字段（必须是对象）")
          return
        }
        setParsed({
          name: raw.name,
          description: raw.description || "",
          variables: raw.variables,
        })
      } catch {
        setError("JSON 解析失败，请检查文件格式")
      }
    }
    reader.onerror = () => setError("文件读取失败")
    reader.readAsText(file)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }

  const handleFileChange = () => {
    const file = fileInputRef.current?.files?.[0]
    if (file) parseFile(file)
  }

  const handleImport = async () => {
    if (!parsed) return
    setSubmitting(true)
    setError("")
    try {
      await importTheme(parsed)
      navigate("/admin/themes")
    } catch (err) {
      setError((err as { message?: string }).message || "导入失败")
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>导入主题</CardTitle>
          <CardDescription>
            上传包含 name 和 variables 字段的 JSON 文件。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 拖拽/点击上传区 */}
          <div
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <p className="text-sm text-muted-foreground">
              点击选择文件或拖拽 JSON 文件到此处
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {fileName && !error && (
            <p className="text-xs text-muted-foreground">已选择：{fileName}</p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* 预览 */}
          {parsed && (
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">{parsed.name}</p>
              {parsed.description && (
                <p className="text-xs text-muted-foreground">
                  {parsed.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                变量数：{Object.keys(parsed.variables).length}
              </p>
              <ul className="max-h-32 space-y-0.5 overflow-y-auto text-xs font-mono text-muted-foreground">
                {Object.entries(parsed.variables).slice(0, 20).map(([k, v]) => (
                  <li key={k}>
                    {k}: {v}
                  </li>
                ))}
                {Object.keys(parsed.variables).length > 20 && (
                  <li className="text-muted-foreground">…还有更多</li>
                )}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              disabled={!parsed || submitting}
            >
              {submitting ? "导入中…" : "确认导入"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/themes")}
            >
              返回
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
