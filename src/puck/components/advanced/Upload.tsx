// src/puck/components/advanced/Upload.tsx
// 上传区域组件：拖拽/点击上传 + 已选文件列表预览（纯 UI，不调 API）

import { useState } from "react"
import type { ComponentConfig } from "@measured/puck"

export type UploadProps = {
  label: string
  accept: string
  multiple: string
  maxSize: number
}

interface SelectedFile {
  name: string
  size: number
}

export const Upload: ComponentConfig<UploadProps> = {
  fields: {
    label: { type: "text" },
    accept: { type: "text" },
    multiple: {
      type: "radio",
      options: [
        { label: "是", value: "true" },
        { label: "否", value: "false" },
      ],
    },
    maxSize: { type: "number", min: 1, max: 1000 },
  },
  defaultProps: {
    label: "上传文件",
    accept: ".jpg,.png,.pdf",
    multiple: "false",
    maxSize: 10,
  },
  render: ({ label, accept, multiple, maxSize }: UploadProps) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [files, setFiles] = useState<SelectedFile[]>([])
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [dragging, setDragging] = useState(false)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []).map((f) => ({
        name: f.name,
        size: f.size,
      }))
      setFiles(multiple === "true" ? [...files, ...selected] : selected.slice(0, 1))
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const dropped = Array.from(e.dataTransfer.files || []).map((f) => ({
        name: f.name,
        size: f.size,
      }))
      setFiles(multiple === "true" ? [...files, ...dropped] : dropped.slice(0, 1))
    }

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(true)
    }

    const handleDragLeave = () => setDragging(false)

    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const removeFile = (index: number) => {
      setFiles(files.filter((_, i) => i !== index))
    }

    return (
      <div className="w-full space-y-3">
        {/* Label */}
        {label && (
          <p className="text-sm font-medium text-foreground">{label}</p>
        )}

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() =>
            (
              document.querySelector<HTMLInputElement>("#puck-upload-input")
            )?.click()
          }
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/50"
          }`}
        >
          {/* Upload icon */}
          <svg
            className="mb-2 h-8 w-8 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="text-sm text-muted-foreground">
            拖拽文件到此处，或点击上传
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            {accept || "所有文件"} · 最大 {maxSize || 10}MB
            {multiple === "true" ? " · 支持多文件" : ""}
          </p>
        </div>

        {/* Hidden Input */}
        <input
          id="puck-upload-input"
          type="file"
          accept={accept || undefined}
          multiple={multiple === "true"}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* File List */}
        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <svg
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="truncate text-foreground">{file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatSize(file.size)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:text-destructive focus:outline-none"
                  aria-label="移除文件"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  },
}
