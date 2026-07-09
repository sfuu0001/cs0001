// src/components/Inspector/PropsView.tsx
// Props 编辑视图：根据组件配置的 field 类型渲染不同控件，修改即时同步到画布。

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Data } from "@measured/puck"
import { config } from "@/puck/config"
import type {
  ComponentConfig,
  Field,
} from "@measured/puck"

export interface PropsViewProps {
  data: Data
  selectedId: string | null
  onPropChange: (id: string, key: string, value: unknown) => void
}

// ─── 扁平化递归查找组件 ──────────────────────────────────────────

function findComponentById(items: unknown[], id: string): Record<string, unknown> | null {
  if (!Array.isArray(items)) return null
  for (const item of items) {
    if (item && typeof item === "object") {
      const props = (item as Record<string, unknown>).props as Record<string, unknown> | undefined
      if (props && props.id === id) {
        return item as Record<string, unknown>
      }
      // 递归 children
      if (props && Array.isArray(props.children)) {
        const found = findComponentById(props.children, id)
        if (found) return found
      }
      // 递归 zones
      if (props && props.zones && typeof props.zones === "object") {
        for (const zoneVal of Object.values(props.zones as Record<string, unknown>)) {
          if (Array.isArray(zoneVal)) {
            const found = findComponentById(zoneVal, id)
            if (found) return found
          }
        }
      }
    }
  }
  return null
}

// ─── 从 config 查找组件字段定义 ──────────────────────────────────

function getComponentFields(type: string): Record<string, Field> | null {
  const compConfig = (config.components as Record<string, ComponentConfig>)[type]
  if (compConfig?.fields && typeof compConfig.fields === "object") {
    return compConfig.fields as Record<string, Field>
  }
  return null
}

// ─── 控件渲染 ────────────────────────────────────────────────────

interface PropControlProps {
  label: string
  value: unknown
  fieldDef?: Field
  onChange: (value: unknown) => void
}

function PropControl({ label, value, fieldDef, onChange }: PropControlProps) {
  const [localValue, setLocalValue] = useState(value)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // 同步外部 value 变化
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = useCallback(
    (newValue: unknown) => {
      setLocalValue(newValue)
      // 100ms 防抖
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onChange(newValue)
      }, 100)
    },
    [onChange],
  )

  // 组件卸载时清理
  useEffect(() => {
    return () => clearTimeout(debounceRef.current)
  }, [])

  // 根据 field 类型或值类型渲染
  const fieldType = fieldDef?.type

  // Select 字段
  if (fieldType === "select" || fieldType === "radio") {
    const options =
      "options" in (fieldDef || {})
        ? ((fieldDef as Record<string, unknown>).options as
            | Array<{ label: string; value: unknown }>
            | undefined)
        : undefined
    return (
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
        <select
          className="w-full rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
          value={String(localValue ?? "")}
          onChange={(e) => handleChange(e.target.value)}
        >
          {options?.map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  // Boolean 字段
  if (typeof localValue === "boolean") {
    return (
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
        <button
          type="button"
          role="switch"
          aria-checked={Boolean(localValue)}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
            Boolean(localValue)
              ? "bg-primary"
              : "bg-input"
          }`}
          onClick={() => handleChange(!localValue)}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow ring-0 transition-transform duration-200 ease-in-out ${
              Boolean(localValue) ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    )
  }

  // Number 字段
  if (fieldType === "number" || typeof localValue === "number") {
    return (
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
        <input
          type="number"
          className="w-full rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
          value={localValue as number}
          onChange={(e) => {
            const val = e.target.value === "" ? "" : Number(e.target.value)
            handleChange(val)
          }}
        />
      </div>
    )
  }

  // Textarea 字段
  if (fieldType === "textarea") {
    return (
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
        <textarea
          className="w-full min-h-[60px] rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors resize-y"
          value={String(localValue ?? "")}
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>
    )
  }

  // 默认：文本输入
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <input
        type="text"
        className="w-full rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
        value={String(localValue ?? "")}
        onChange={(e) => handleChange(e.target.value)}
      />
    </div>
  )
}

// ─── 内置/系统 props 过滤 ────────────────────────────────────────

const INTERNAL_PROPS = new Set([
  "id",
  "puck",
  "editMode",
  "children",
  "zones",
])

function shouldShowProp(key: string): boolean {
  if (INTERNAL_PROPS.has(key)) return false
  if (key.startsWith("_")) return false
  if (key.startsWith("data-")) return false
  if (key.startsWith("aria-")) return false
  return true
}

// ─── 主组件 ──────────────────────────────────────────────────────

export default function PropsView({
  data,
  selectedId,
  onPropChange,
}: PropsViewProps) {
  const selectedComponent = useMemo(() => {
    if (!selectedId || !data?.content) return null
    return findComponentById(data.content, selectedId)
  }, [data, selectedId])

  const componentType = selectedComponent?.type as string | undefined
  const componentProps = selectedComponent?.props as Record<string, unknown> | undefined
  const fields = componentType ? getComponentFields(componentType) : null

  const propEntries = useMemo(() => {
    if (!componentProps) return []
    return Object.entries(componentProps).filter(([key]) => shouldShowProp(key))
  }, [componentProps])

  // 无选中时显示提示
  if (!selectedId) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center px-3">
        <div className="mb-2 text-2xl opacity-30">👆</div>
        <p className="text-xs text-muted-foreground">请选择一个组件</p>
        <p className="mt-1 text-[10px] text-muted-foreground/60">
          在组件树或画布中点击组件查看属性
        </p>
      </div>
    )
  }

  // 选中了 Page 根节点
  if (selectedId === "__root__") {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center px-3">
        <p className="text-xs text-muted-foreground">页面根节点</p>
        <p className="mt-1 text-[10px] text-muted-foreground/60">
          请选择一个具体组件以编辑属性
        </p>
      </div>
    )
  }

  if (!selectedComponent) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center px-3">
        <p className="text-xs text-muted-foreground">组件未找到</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 头部：组件信息 */}
      <div className="border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">
            {componentType}
          </span>
          {Boolean(componentProps?.id) && (
            <span className="text-[9px] font-mono text-muted-foreground/50">
              #{String(componentProps?.id ?? "").slice(0, 8)}
            </span>
          )}
        </div>
      </div>

      {/* Props 列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {propEntries.length === 0 ? (
          <p className="py-4 text-center text-[10px] text-muted-foreground/60">
            该组件没有可编辑的属性
          </p>
        ) : (
          propEntries.map(([key, val]) => {
            const fieldDef = fields?.[key]
            return (
              <PropControl
                key={key}
                label={key}
                value={val}
                fieldDef={fieldDef}
                onChange={(newValue) => {
                  if (selectedId) {
                    onPropChange(selectedId, key, newValue)
                  }
                }}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── 导出工具函数 ────────────────────────────────────────────────

export { findComponentById, shouldShowProp }
