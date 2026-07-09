// src/lib/codegen/renderers.ts
// 每个组件类型 → JSX 字符串映射函数

import type { ContentNode, GenerateOptions, RendererFn } from "./types"

// ─── 工具函数 ──────────────────────────────────────────────────────

function indent(lines: string[], level: number): string {
  const pad = "  ".repeat(level)
  return lines.map((l) => (l ? pad + l : "")).join("\n")
}

function quote(val: unknown): string {
  if (typeof val === "string") return JSON.stringify(val)
  if (typeof val === "boolean") return String(val)
  if (typeof val === "number") return String(val)
  return JSON.stringify(val)
}

function cls(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ")
}

function renderChildren(nodes: ContentNode[] | undefined, level: number, options: GenerateOptions): string {
  if (!nodes || nodes.length === 0) return ""
  return nodes
    .map((child) => renderNode(child, level, options))
    .join("\n")
}

// ─── 渲染器注册表 ────────────────────────────────────────────────

const renderers = new Map<string, RendererFn>()

function register(type: string, fn: RendererFn) {
  renderers.set(type, fn)
}

// ─── 一期基础组件 ───

register("Heading", (props, _children, _indent, _options) => {
  const level = (props.level as string) || "h2"
  const text = (props.text as string) || ""
  const sizeMap: Record<string, string> = { h1: "text-4xl", h2: "text-2xl", h3: "text-xl" }
  return `<${level} className="${cls("font-bold text-foreground", sizeMap[level])}">${text}</${level}>`
})

register("Text", (props) => {
  const content = (props.content as string) || ""
  return `<p className="whitespace-pre-wrap leading-7 text-muted-foreground">${content}</p>`
})

register("Image", (props) => {
  const src = (props.src as string) || ""
  const alt = (props.alt as string) || ""
  const rounded = (props.rounded as string) || "none"
  const roundedMap: Record<string, string> = { none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg" }
  return `<img src={${quote(src)}} alt={${quote(alt)}} className={${cls("w-full h-auto", roundedMap[rounded])}} />`
})

register("Button", (props) => {
  const label = (props.label as string) || "按钮"
  const href = (props.href as string) || "#"
  const variant = (props.variant as string) || "primary"
  const variantClass: Record<string, string> = {
    primary: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
    outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
  }
  return `<a href={${quote(href)}} className={${cls("inline-block rounded-md px-4 py-2 text-sm font-medium transition-colors", variantClass[variant])}}>${label}</a>`
})

register("Input", (props) => {
  const placeholder = (props.placeholder as string) || ""
  const type = (props.type as string) || "text"
  return `<input type={${quote(type)}} placeholder={${quote(placeholder)}} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring" />`
})

register("Divider", () => {
  return `<hr className="border-border" />`
})

register("Badge", (props) => {
  const text = (props.text as string) || ""
  const variant = (props.variant as string) || "default"
  const variantClass: Record<string, string> = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-border text-foreground",
  }
  return `<span className={${cls("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variantClass[variant])}}>${text}</span>`
})

register("Alert", (props) => {
  const message = (props.message as string) || ""
  const type = (props.type as string) || "info"
  const typeClass: Record<string, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    error: "bg-red-50 border-red-200 text-red-800",
  }
  return `<div className={${cls("rounded-md border p-4", typeClass[type])}}>${message}</div>`
})

// ─── 二期布局组件 ───

register("Container", (props, children) => {
  const padding = (props.padding as string) || "4"
  const bg = (props.backgroundColor as string) || "transparent"
  const borderRadius = (props.borderRadius as string) || "md"
  const paddingMap: Record<string, string> = { "0": "p-0", "4": "p-4", "8": "p-8" }
  const roundedMap: Record<string, string> = { none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg" }
  const childContent = children.length > 0 ? `\n${renderChildren(children, 2, { indentSize: 2 } as GenerateOptions)}\n` : ""
  return `<div className={${cls(paddingMap[padding], roundedMap[borderRadius])}} style={{backgroundColor: ${quote(bg)}}}>${childContent}</div>`
})

register("Row", (props, children) => {
  const justify = (props.justifyContent as string) || "flex-start"
  const align = (props.alignItems as string) || "stretch"
  const gap = (props.gap as string) || "4"
  const jMap: Record<string, string> = { "flex-start": "justify-start", center: "justify-center", "flex-end": "justify-end", "space-between": "justify-between" }
  const aMap: Record<string, string> = { "flex-start": "items-start", center: "items-center", "flex-end": "items-end", stretch: "items-stretch" }
  const gMap: Record<string, string> = { "0": "gap-0", "2": "gap-2", "4": "gap-4", "8": "gap-8" }
  const childContent = children.length > 0 ? `\n${renderChildren(children, 2, { indentSize: 2 } as GenerateOptions)}\n` : ""
  return `<div className={${cls("flex flex-row", jMap[justify], aMap[align], gMap[gap])}}>${childContent}</div>`
})

register("Column", (props, children) => {
  const width = (props.width as string) || "12"
  const gap = (props.gap as string) || "4"
  const wMap: Record<string, string> = { "1": "w-1/12", "2": "w-2/12", "3": "w-3/12", "4": "w-4/12", "6": "w-6/12", "8": "w-8/12", "12": "w-full" }
  const gMap: Record<string, string> = { "0": "gap-0", "2": "gap-2", "4": "gap-4", "8": "gap-8" }
  const childContent = children.length > 0 ? `\n${renderChildren(children, 2, { indentSize: 2 } as GenerateOptions)}\n` : ""
  return `<div className={${cls("flex flex-col", wMap[width], gMap[gap])}}>${childContent}</div>`
})

register("Grid", (props, children) => {
  const cols = (props.columns as string) || "2"
  const gap = (props.gap as string) || "4"
  const cMap: Record<string, string> = { "1": "grid-cols-1", "2": "grid-cols-2", "3": "grid-cols-3", "4": "grid-cols-4", "6": "grid-cols-6" }
  const gMap: Record<string, string> = { "2": "gap-2", "4": "gap-4", "8": "gap-8" }
  const childContent = children.length > 0 ? `\n${renderChildren(children, 2, { indentSize: 2 } as GenerateOptions)}\n` : ""
  return `<div className={${cls("grid", cMap[cols], gMap[gap])}}>${childContent}</div>`
})

register("Card", (props, children) => {
  const title = (props.title as string) || ""
  const description = (props.description as string) || ""
  const shadow = (props.shadow as string) || "md"
  const sMap: Record<string, string> = { none: "shadow-none", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg" }
  const headerBlock = title || description
    ? `\n      <CardHeader>\n        ${title ? `<CardTitle>${title}</CardTitle>` : ""}\n        ${description ? `<CardDescription>${description}</CardDescription>` : ""}\n      </CardHeader>`
    : ""
  const childContent = children.length > 0 ? `\n            ${renderChildren(children, 3, { indentSize: 2 } as GenerateOptions)}\n` : ""
  return `<div className={${cls("rounded-xl border bg-card text-card-foreground", sMap[shadow])}}>${headerBlock}\n      <div className="p-6 pt-0">${childContent}</div>\n    </div>`
})

register("Section", (props, children) => {
  const bg = (props.backgroundColor as string) || "transparent"
  const padding = (props.padding as string) || "8"
  const maxW = (props.maxWidth as string) || "full"
  const rounded = (props.rounded as string) || "none"
  const pMap: Record<string, string> = { "4": "p-4", "8": "p-8", "12": "p-12", "16": "p-16" }
  const mMap: Record<string, string> = { full: "w-full", "screen-lg": "max-w-screen-lg", "screen-xl": "max-w-screen-xl" }
  const rMap: Record<string, string> = { none: "rounded-none", sm: "rounded-sm", lg: "rounded-lg" }
  const childContent = children.length > 0 ? `\n${renderChildren(children, 2, { indentSize: 2 } as GenerateOptions)}\n` : ""
  return `<section className={${cls("mx-auto", pMap[padding], mMap[maxW], rMap[rounded])}} style={{backgroundColor: ${quote(bg)}}}>${childContent}</section>`
})

register("Tabs", (props) => {
  const tabs = (props.tabs as Array<{ label: string }>) || []
  return `<div className="w-full">\n` +
    `  <div className="flex border-b border-border">\n` +
    tabs.map((tab, i) =>
      `    <button key={${i}} type="button" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">${tab.label}</button>`
    ).join("\n") +
    `\n  </div>\n</div>`
})

// ─── 二期展示组件 ───

register("Accordion", (props) => {
  const items = (props.items as Array<{ title: string; content: string }>) || []
  return `<div className="divide-y divide-border rounded-lg border border-border">\n${
    items.map((item) => `  <details className="group">\n    <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium">${item.title}</summary>\n    <div className="px-4 pb-3 text-sm text-muted-foreground">${item.content}</div>\n  </details>`).join("\n")
  }\n</div>`
})

register("Carousel", (props) => {
  const images = (props.images as Array<{ src: string; alt: string }>) || []
  return `<div className="overflow-hidden rounded-lg">\n` +
    `  <div className="flex snap-x snap-mandatory overflow-x-auto">\n` +
    images.map((img) => `    <div className="snap-center flex-shrink-0 w-full"><img src={${quote(img.src)}} alt={${quote(img.alt || "")}} className="w-full h-auto" /></div>`).join("\n") +
    `\n  </div>\n</div>`
})

register("Table", (props) => {
  const headers = (props.headers as string[]) || []
  const rows = (props.rows as string[][]) || []
  return `<div className="overflow-x-auto rounded-lg border border-border">\n` +
    `  <table className="w-full text-sm">\n` +
    `    <thead className="bg-muted/50">\n` +
    `      <tr>\n${headers.map((h) => `        <th className="px-3 py-2 text-left font-medium text-muted-foreground">${h}</th>\n`).join("")}      </tr>\n` +
    `    </thead>\n` +
    `    <tbody>\n${rows.map((row) => `      <tr className="border-t">\n${row.map((cell) => `        <td className="px-3 py-2">${cell}</td>\n`).join("")}      </tr>\n`).join("")}    </tbody>\n` +
    `  </table>\n</div>`
})

register("List", (props) => {
  const items = (props.items as string[]) || []
  const ordered = (props.ordered as boolean) || false
  const tag = ordered ? "ol" : "ul"
  return `<${tag} className="space-y-1 list-disc list-inside text-muted-foreground">\n${
    items.map((item) => `  <li>${item}</li>`).join("\n")
  }\n</${tag}>`
})

register("Progress", (props) => {
  const value = (props.value as number) || 0
  const label = (props.label as string) || ""
  return `<div className="space-y-1">\n  ${label ? `<div className="flex justify-between text-sm"><span>${label}</span><span>${value}%</span></div>` : `<div className="text-right text-sm text-muted-foreground">${value}%</div>`}\n  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">\n    <div className="h-full rounded-full bg-primary transition-all" style={{width: ${value}%}} />\n  </div>\n</div>`
})

register("Video", (props) => {
  const src = (props.src as string) || ""
  const poster = (props.poster as string) || ""
  return `<video src={${quote(src)}} poster={${quote(poster)}} className="w-full rounded-lg" controls />`
})

// ─── 表单组件 ───

register("Form", (props) => {
  const title = (props.title as string) || ""
  return `<form className="space-y-4">\n  ${title ? `<h3 className="text-lg font-semibold">${title}</h3>` : ""}\n  {/* 表单字段 */}\n</form>`
})

register("FormInput", (props) => {
  const label = (props.label as string) || ""
  const placeholder = (props.placeholder as string) || ""
  return `<div className="space-y-1">\n  ${label ? `<label className="text-sm font-medium">${label}</label>` : ""}\n  <input type="text" placeholder={${quote(placeholder)}} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring" />\n</div>`
})

register("FormSelect", (props) => {
  const label = (props.label as string) || ""
  const options = (props.options as string[]) || []
  return `<div className="space-y-1">\n  ${label ? `<label className="text-sm font-medium">${label}</label>` : ""}\n  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring">\n${options.map((o) => `    <option>${o}</option>`).join("\n")}\n  </select>\n</div>`
})

register("FormCheckbox", (props) => {
  const label = (props.label as string) || ""
  return `<label className="flex items-center gap-2 text-sm">\n  <input type="checkbox" className="rounded border-border" />\n  ${label}\n</label>`
})

register("FormSwitch", (props) => {
  const label = (props.label as string) || ""
  return `<label className="flex items-center gap-2 text-sm">\n  <div className="h-5 w-9 rounded-full bg-muted cursor-pointer" />\n  ${label}\n</label>`
})

// ─── 高级组件 ───

register("Modal", (props) => {
  const title = (props.title as string) || ""
  return `<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">\n  <div className="mx-4 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">\n    ${title ? `<h3 className="mb-4 text-lg font-semibold">${title}</h3>` : ""}\n    {/* Modal content */}\n  </div>\n</div>`
})

register("Drawer", (props) => {
  const title = (props.title as string) || ""
  return `<div className="fixed inset-y-0 right-0 z-50 w-80 border-l bg-background p-6 shadow-lg">\n  ${title ? `<h3 className="mb-4 text-lg font-semibold">${title}</h3>` : ""}\n  {/* Drawer content */}\n</div>`
})

register("Dropdown", (props) => {
  const label = (props.label as string) || ""
  return `<div className="relative inline-block">\n  <button className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm">${label} ▼</button>\n  {/* Dropdown menu */}\n</div>`
})

register("RichText", (props) => {
  const content = (props.content as string) || ""
  return `<div className="prose prose-sm dark:prose-invert max-w-none">${content}</div>`
})

register("Upload", (props) => {
  const label = (props.label as string) || ""
  return `<div className="rounded-lg border-2 border-dashed border-border p-8 text-center">\n  ${label ? `<p className="text-sm text-muted-foreground">${label}</p>` : ""}\n  <p className="mt-1 text-xs text-muted-foreground">拖拽或点击上传</p>\n</div>`
})

// ─── P0 新展示组件 ───

register("Skeleton", (props) => {
  const width = (props.width as string) || "full"
  const height = (props.height as string) || "1rem"
  const lines = (props.lines as number) || 1
  const rounded = (props.rounded as boolean) ?? true
  const wMap: Record<string, string> = { full: "w-full", sm: "w-24", md: "w-48", lg: "w-64" }
  const items = Array.from({ length: Math.max(1, lines) }, () => 0)
  return `<div className="flex flex-col gap-2">\n${items.map(() => `  <div className="animate-pulse rounded-md bg-muted ${wMap[width]} ${rounded ? "rounded-md" : ""}" style={{height: ${quote(height)}}} />`).join("\n")}\n</div>`
})

register("CodeBlock", (props) => {
  const code = (props.code as string) || ""
  const language = (props.language as string) || "js"
  const showLineNumbers = (props.showLineNumbers as boolean) ?? true
  const lines = code.split("\n")
  const langLabel: Record<string, string> = { js: "JavaScript", jsx: "JSX", ts: "TypeScript", tsx: "TSX", html: "HTML", css: "CSS", json: "JSON", bash: "Bash" }
  return `<div className="overflow-hidden rounded-lg border border-border bg-white dark:bg-gray-950 shadow-sm">\n` +
    `  <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-1.5">\n` +
    `    <span className="text-xs font-medium text-muted-foreground">${langLabel[language] || language}</span>\n` +
    `  </div>\n` +
    `  <div className="overflow-x-auto p-4">\n` +
    `    <pre className="leading-relaxed"><code className="font-mono text-sm text-foreground dark:text-gray-200">\n` +
    lines.map((line, i) =>
      `      <span className="block">${showLineNumbers ? `<span className="mr-4 inline-block w-8 text-right text-xs text-muted-foreground/50 select-none">${i + 1}</span>` : ""}${line || " "}</span>`
    ).join("\n") +
    `\n    </code></pre>\n  </div>\n</div>`
})

register("MarkdownPreview", (props) => {
  const content = (props.content as string) || ""
  const maxHeight = (props.maxHeight as string) || ""
  const styleAttr = maxHeight ? ` style={{maxHeight: ${quote(maxHeight)}}}` : ""
  return `<div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-lg border border-border bg-background p-4 font-mono text-sm leading-relaxed text-foreground overflow-auto"${styleAttr}>${content}</div>`
})

register("IframeEmbed", (props) => {
  const src = (props.src as string) || ""
  const title = (props.title as string) || "嵌入内容"
  const height = (props.height as string) || "400px"
  const allowFullscreen = (props.allowFullscreen as boolean) ?? true
  return `<div className="w-full overflow-hidden rounded-lg border border-border">\n  <iframe src={${quote(src)}} title={${quote(title)}} className="w-full" style={{height: ${quote(height)}}}${allowFullscreen ? " allowFullScreen" : ""} sandbox="allow-scripts allow-same-origin allow-popups" loading="lazy" />\n</div>`
})

register("CountUp", (props) => {
  const value = (props.value as number) || 0
  const label = (props.label as string) || ""
  const suffix = (props.suffix as string) || ""
  const prefix = (props.prefix as string) || ""
  return `<div className="flex flex-col items-center justify-center gap-1 p-4">\n  <span className="text-3xl font-bold tabular-nums text-foreground">${prefix}${value.toLocaleString()}${suffix}</span>\n  ${label ? `<span className="text-sm text-muted-foreground">${label}</span>` : ""}\n</div>`
})

register("DataTable", (props) => {
  const headers = (props.headers as Array<{ label: string }>) || []
  const rows = (props.rows as Array<{ cells: string[] }>) || []
  const striped = (props.striped as boolean) ?? true
  const bordered = (props.bordered as boolean) ?? false
  const responsive = (props.responsive as boolean) ?? true
  const tableContent = `<table className="w-full text-sm">\n` +
    `    <thead>\n` +
    `      <tr className="bg-muted/50">\n${headers.map((h) => `        <th className="px-3 py-2 text-left font-medium text-muted-foreground ${bordered ? "border border-border" : "border-b border-border"}">${h.label}</th>\n`).join("")}      </tr>\n` +
    `    </thead>\n` +
    `    <tbody>\n${rows.map((row, ri) => `      <tr className="${striped && ri % 2 === 1 ? "bg-muted/20" : ""}">\n${row.cells.map((cell) => `        <td className="px-3 py-2 ${bordered ? "border border-border" : "border-b border-border"}">${cell}</td>\n`).join("")}      </tr>\n`).join("")}    </tbody>\n` +
    `  </table>`
  if (responsive) {
    return `<div className="overflow-x-auto rounded-lg border border-border">\n  ${tableContent}\n</div>`
  }
  return tableContent
})

register("EmptyState", (props) => {
  const icon = (props.icon as string) || "inbox"
  const title = (props.title as string) || "暂无数据"
  const description = (props.description as string) || ""
  const actionText = (props.actionText as string) || ""
  const actionLink = (props.actionLink as string) || "#"
  const iconSvgs: Record<string, string> = {
    inbox: '<svg className="h-12 w-12 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" /></svg>',
    search: '<svg className="h-12 w-12 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>',
    file: '<svg className="h-12 w-12 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>',
    box: '<svg className="h-12 w-12 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>',
  }
  return `<div className="flex flex-col items-center justify-center gap-4 py-12 px-4">\n` +
    `  <div className="flex-shrink-0">${iconSvgs[icon] || iconSvgs.inbox}</div>\n` +
    `  <div className="text-center">\n` +
    `    <h3 className="text-base font-semibold text-foreground">${title}</h3>\n` +
    `${description ? `    <p className="mt-1 text-sm text-muted-foreground max-w-sm">${description}</p>\n` : ""}` +
    `  </div>\n` +
    `${actionText ? `  <a href={${quote(actionLink)}} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors">${actionText}</a>\n` : ""}` +
    `</div>`
})

register("Stepper", (props) => {
  const steps = (props.steps as Array<{ label: string; description: string }>) || []
  const current = (props.current as number) || 1
  const variant = (props.variant as string) || "numbered"
  const activeIndex = Math.max(0, Math.min(current - 1, steps.length - 1))

  if (variant === "progress") {
    const progress = steps.length > 1 ? (activeIndex / (steps.length - 1)) * 100 : 100
    return `<div className="w-full space-y-2">\n` +
      `  <div className="flex items-center justify-between text-sm">\n` +
      `    <span className="font-medium text-foreground">${steps[activeIndex]?.label || ""}</span>\n` +
      `    <span className="text-muted-foreground">${activeIndex + 1} / ${steps.length}</span>\n` +
      `  </div>\n` +
      `  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">\n` +
      `    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{width: ${progress}%}} />\n` +
      `  </div>\n` +
      `</div>`
  }

  return `<div className="flex w-full items-start">\n` +
    steps.map((step, i) => {
      const isActive = i === activeIndex
      const isCompleted = i < activeIndex
      const isLast = i === steps.length - 1
      return `  <div key={${i}} className="flex items-start ${isLast ? "" : "flex-1"}">\n` +
        `    <div className="flex flex-col items-center">\n` +
        `      <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${isCompleted ? "bg-primary text-primary-foreground" : isActive ? "bg-primary text-primary-foreground ring-2 ring-primary/30" : "bg-muted text-muted-foreground"}">${variant === "numbered" ? (isCompleted ? "✓" : i + 1) : '<div className="h-2.5 w-2.5 rounded-full ' + (isCompleted || isActive ? "bg-primary-foreground" : "bg-muted-foreground/40") + '" />'}</div>\n` +
        `${isLast ? "" : `      <div className="h-0.5 w-full mt-4 ${isCompleted ? "bg-primary" : "bg-muted"}" />\n`}` +
        `    </div>\n` +
        `    <div className="ml-3 mt-1 ${isLast ? "" : "mr-4"}">\n` +
        `      <div className="text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}">${step.label}</div>\n` +
        `${step.description ? `      <div className="text-xs text-muted-foreground/70 mt-0.5">${step.description}</div>\n` : ""}` +
        `    </div>\n` +
        `  </div>`
    }).join("\n") +
    `\n</div>`
})

// ─── 查找渲染器 ────────────────────────────────────────────────────

export function getRenderer(type: string): RendererFn | undefined {
  return renderers.get(type)
}

/** 渲染单个节点为 JSX */
export function renderNode(node: ContentNode, level: number, options: GenerateOptions): string {
  const fn = renderers.get(node.type)
  if (!fn) {
    return `${"  ".repeat(level)}{/* Unknown component: ${node.type} */}`
  }
  const children: ContentNode[] = node.children || []
  const result = fn(node.props || {}, children, "  ".repeat(level), options)
  return indent(result.split("\n"), level).trimStart()
}
