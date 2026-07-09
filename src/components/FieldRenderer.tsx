// src/components/FieldRenderer.tsx
// 「组件配置字段渲染」独立组件，用 React.memo 避免无关重渲染。

import { memo } from "react"

/**
 * 简化版 Field 描述（与 Puck Field 兼容的子集）。
 * 实际项目中可与 @measured/puck Field 类型对齐。
 */
export interface FieldDescriptor {
  type: "text" | "number" | "select" | "textarea" | "checkbox" | "radio"
  label?: string
  placeholder?: string
  options?: { label: string; value: string }[]
  min?: number
  max?: number
  step?: number
}

interface FieldRendererProps {
  field: FieldDescriptor
  value: unknown
  onChange: (v: unknown) => void
}

/** 根据 field.type 渲染对应的输入控件 */
function FieldRendererInner({ field, value, onChange }: FieldRendererProps) {
  const handleChange = (raw: string | number | boolean) => {
    onChange(raw)
  }

  switch (field.type) {
    case "text":
    case "textarea":
      return (
        <div className="space-y-1">
          {field.label && (
            <label className="block text-sm font-medium text-foreground">
              {field.label}
            </label>
          )}
          {field.type === "textarea" ? (
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              value={String(value ?? "")}
              placeholder={field.placeholder}
              onChange={(e) => handleChange(e.target.value)}
              rows={3}
            />
          ) : (
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              type="text"
              value={String(value ?? "")}
              placeholder={field.placeholder}
              onChange={(e) => handleChange(e.target.value)}
            />
          )}
        </div>
      )

    case "number":
      return (
        <div className="space-y-1">
          {field.label && (
            <label className="block text-sm font-medium text-foreground">
              {field.label}
            </label>
          )}
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
            type="number"
            value={value != null ? Number(value) : 0}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={(e) => handleChange(Number(e.target.value))}
          />
        </div>
      )

    case "select":
      return (
        <div className="space-y-1">
          {field.label && (
            <label className="block text-sm font-medium text-foreground">
              {field.label}
            </label>
          )}
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
            value={String(value ?? "")}
            onChange={(e) => handleChange(e.target.value)}
          >
            {(field.options ?? []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )

    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => handleChange(e.target.checked)}
            className="rounded border-input text-primary focus:ring-primary"
          />
          {field.label && (
            <span className="font-medium text-foreground">{field.label}</span>
          )}
        </label>
      )

    case "radio":
      return (
        <fieldset className="space-y-1">
          {field.label && (
            <legend className="block text-sm font-medium text-foreground">
              {field.label}
            </legend>
          )}
          {(field.options ?? []).map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name={field.label ?? "field"}
                value={opt.value}
                checked={String(value) === opt.value}
                onChange={() => handleChange(opt.value)}
                className="border-input text-primary focus:ring-primary"
              />
              {opt.label}
            </label>
          ))}
        </fieldset>
      )

    default:
      return (
        <div className="text-sm text-muted-foreground">
          不支持的字段类型：{field.type}
        </div>
      )
  }
}

/** 带 React.memo 的字段渲染器，避免无关 props 变化导致重渲染 */
const FieldRenderer = memo(FieldRendererInner)
FieldRenderer.displayName = "FieldRenderer"

export default FieldRenderer
