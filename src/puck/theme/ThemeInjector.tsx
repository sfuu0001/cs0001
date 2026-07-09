// src/puck/theme/ThemeInjector.tsx
// 接收 variables 对象，在 mount 时将其作为 CSS 自定义属性注入到 :root，
// unmount 时清除。用于在编辑器 / 预览页应用主题变量。

import { useEffect, useRef } from "react"

interface ThemeInjectorProps {
  /** CSS 变量键值对，如 { "--primary": "#6366f1" } */
  variables?: Record<string, string> | null
}

export default function ThemeInjector({ variables }: ThemeInjectorProps) {
  const injectedKeys = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!variables || Object.keys(variables).length === 0) return

    const root = document.documentElement
    const keys = Object.keys(variables)

    // 注入变量
    for (const key of keys) {
      root.style.setProperty(key, variables[key])
      injectedKeys.current.add(key)
    }

    // 清除
    return () => {
      for (const key of injectedKeys.current) {
        root.style.removeProperty(key)
      }
      injectedKeys.current.clear()
    }
  }, [variables])

  // 该组件不渲染任何可见内容
  return null
}
