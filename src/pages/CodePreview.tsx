// src/pages/CodePreview.tsx
// 代码预览弹窗：展示生成的 React 源码，支持复制和下载

import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

interface CodePreviewProps {
  code: string
  onClose: () => void
}

export default function CodePreview({ code, onClose }: CodePreviewProps) {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLPreElement>(null)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const textarea = document.createElement("textarea")
      textarea.value = code
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [code])

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "GeneratedPage.tsx"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [code])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="mx-4 flex max-h-[80vh] w-full max-w-3xl flex-col rounded-lg border bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-base font-semibold">导出代码预览</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? "已复制 ✓" : "复制到剪贴板"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              下载 .tsx
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        {/* 代码展示 */}
        <div className="overflow-auto p-4">
          <pre
            ref={codeRef}
            className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed"
          >
            <code className="font-mono text-foreground whitespace-pre">{code}</code>
          </pre>
        </div>

        {/* 底部 */}
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          此代码为页面组件的静态导出，样式依赖 Tailwind CSS 类名。
        </div>
      </div>
    </div>
  )
}
