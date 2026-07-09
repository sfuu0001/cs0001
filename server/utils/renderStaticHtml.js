// server/utils/renderStaticHtml.js
// 静态 HTML 渲染引擎：将 Puck Data 结构（page.content）递归渲染为完整 HTML 文档字符串。
// 纯 JS 字符串操作，零依赖。所有需要组件渲染时自动降级为占位符。

// ─── HTML 转义 ───

/**
 * 转义 HTML 特殊字符，防止 XSS 和格式破坏。
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== "string") return ""
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// ─── 全局组件映射表 ───

/**
 * 组件映射表。
 * 每个条目是一个渲染函数：(props: object, renderChildren: (content?) => string) => string。
 * renderChildren 是递归回调，用于渲染嵌套内容数组。
 */
const COMPONENT_MAP = {
  // ─── 一期基础组件 ───
  Heading(props, renderChildren) {
    const level = Math.min(3, Math.max(1, Number(props.level) || 2))
    const text = escapeHtml(props.text || props.children || "")
    const sizeClass =
      level === 1
        ? "text-3xl font-bold my-4"
        : level === 2
          ? "text-2xl font-bold my-4"
          : "text-xl font-semibold my-3"
    return `<h${level} class="${sizeClass}">${text}</h${level}>`
  },

  Text(props, _renderChildren) {
    const text = escapeHtml(props.text || props.children || "")
    return `<p class="text-base leading-relaxed">${text}</p>`
  },

  Image(props, _renderChildren) {
    const src = escapeHtml(props.src || props.alt || "")
    const alt = escapeHtml(props.alt || "")
    const width = props.width ? ` width="${escapeHtml(String(props.width))}"` : ""
    const height = props.height
      ? ` height="${escapeHtml(String(props.height))}"`
      : ""
    return `<img src="${src}" alt="${alt}"${width}${height} class="max-w-full h-auto" />`
  },

  Button(props, _renderChildren) {
    const href = escapeHtml(props.href || props.link || "#")
    const text = escapeHtml(props.text || props.children || "Button")
    const variant = props.variant === "outline" ? "bg-transparent border border-blue-600 text-blue-600" : "bg-blue-600 text-white"
    return `<a href="${href}" class="inline-block px-4 py-2 ${variant} rounded no-underline">${text}</a>`
  },

  Input(props, _renderChildren) {
    const placeholder = escapeHtml(props.placeholder || "")
    const type = escapeHtml(props.type || "text")
    return `<input type="${type}" placeholder="${placeholder}" class="border rounded px-3 py-2" />`
  },

  Divider(_props, _renderChildren) {
    return `<hr class="my-4 border-gray-200" />`
  },

  Badge(props, _renderChildren) {
    const text = escapeHtml(props.text || props.children || "")
    return `<span class="inline-block px-2 py-1 text-xs bg-gray-100 rounded">${text}</span>`
  },

  Alert(props, _renderChildren) {
    const text = escapeHtml(props.text || props.children || "")
    const variantClass =
      props.variant === "error"
        ? "bg-red-50 border-red-200"
        : props.variant === "success"
          ? "bg-green-50 border-green-200"
          : props.variant === "info"
            ? "bg-blue-50 border-blue-200"
            : "bg-yellow-50 border-yellow-200"
    return `<div class="p-4 rounded ${variantClass} border">${text}</div>`
  },

  // ─── 二期布局组件 ───
  Container(props, renderChildren) {
    const children = renderChildren(props.content)
    return `<div class="p-4">${children}</div>`
  },

  Row(props, renderChildren) {
    const children = renderChildren(props.content)
    return `<div class="flex flex-wrap">${children}</div>`
  },

  Column(props, renderChildren) {
    const children = renderChildren(props.content)
    const widthClass = props.width
      ? ` style="flex:${Number(props.width)}"`
      : ""
    return `<div class="flex-1"${widthClass}>${children}</div>`
  },

  Grid(props, renderChildren) {
    const n = Math.min(12, Math.max(1, Number(props.columns) || props.n || 2))
    const children = renderChildren(props.content)
    return `<div class="grid grid-cols-${n} gap-4">${children}</div>`
  },

  Card(props, renderChildren) {
    const children = renderChildren(props.content)
    const title = props.title
      ? `<h3 class="text-lg font-semibold mb-2">${escapeHtml(props.title)}</h3>`
      : ""
    return `<div class="border rounded-lg shadow-sm p-4">${title}${children}</div>`
  },

  Section(props, renderChildren) {
    const children = renderChildren(props.content)
    const bgClass = props.backgroundColor
      ? ` style="background-color:${escapeHtml(props.backgroundColor)}"`
      : ""
    return `<section class="py-8"${bgClass}>${children}</section>`
  },

  Tabs(props, renderChildren) {
    const tabs = Array.isArray(props.tabs) ? props.tabs : []
    const buttons = tabs
      .map(
        (tab, i) =>
          `<button class="px-4 py-2 text-sm font-medium border-b-2 ${
            i === 0
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500"
          }">${escapeHtml(tab.title || `Tab ${i + 1}`)}</button>`
      )
      .join("")
    const contents = tabs
      .map(
        (tab) =>
          `<div class="p-4">${renderChildren(tab.content)}</div>`
      )
      .join("")
    return `<div class="tabs">${buttons}${contents}</div>`
  },

  // ─── 二期展示组件 ───
  Accordion(props, renderChildren) {
    const title = escapeHtml(props.title || "Accordion")
    const children = renderChildren(props.content)
    return `<details class="border rounded mb-2"><summary class="px-4 py-2 cursor-pointer font-medium">${title}</summary><div class="px-4 py-2">${children}</div></details>`
  },

  Carousel(props, renderChildren) {
    const items = Array.isArray(props.items) ? props.items : []
    const renderedItems = items
      .map((item) => {
        if (item && typeof item === "object" && item.type) {
          const fn = COMPONENT_MAP[item.type]
          if (fn) return fn(item.props || {}, renderChildren)
        }
        return `<div class="min-w-[200px] p-2 border rounded">${escapeHtml(
          String(item?.text || item?.title || "")
        )}</div>`
      })
      .join("")
    return `<div class="overflow-x-auto flex gap-2">${renderedItems}</div>`
  },

  Table(props, _renderChildren) {
    const headers = Array.isArray(props.headers) ? props.headers : []
    const rows = Array.isArray(props.rows) ? props.rows : []
    const thead =
      headers.length > 0
        ? `<thead><tr>${headers
            .map(
              (h) =>
                `<th class="border px-4 py-2 bg-gray-50 text-left font-medium">${escapeHtml(
                  typeof h === "string" ? h : h?.text || ""
                )}</th>`
            )
            .join("")}</tr></thead>`
        : ""
    const tbody =
      rows.length > 0
        ? `<tbody>${rows
            .map(
              (row) =>
                `<tr>${(Array.isArray(row) ? row : row?.cells || [])
                  .map(
                    (cell) =>
                      `<td class="border px-4 py-2">${escapeHtml(
                        typeof cell === "string" ? cell : cell?.text || ""
                      )}</td>`
                  )
                  .join("")}</tr>`
            )
            .join("")}</tbody>`
        : ""
    return `<table class="w-full border-collapse">${thead}${tbody}</table>`
  },

  List(props, _renderChildren) {
    const items = Array.isArray(props.items) ? props.items : []
    const listItems = items
      .map(
        (item) =>
          `<li>${escapeHtml(
            typeof item === "string" ? item : item?.text || ""
          )}</li>`
      )
      .join("")
    const ordered = props.ordered ? "ol" : "ul"
    const cls = ordered ? "list-decimal pl-5" : "list-disc pl-5"
    return `<${ordered} class="${cls}">${listItems}</${ordered}>`
  },

  Progress(props, _renderChildren) {
    const value = Math.min(100, Math.max(0, Number(props.value) || 0))
    const label = props.label
      ? `<span class="text-sm text-gray-600">${escapeHtml(props.label)}</span>`
      : ""
    return `<div>${label}<div class="bg-gray-200 rounded-full h-2.5"><div class="bg-blue-600 h-2.5 rounded-full" style="width:${value}%"></div></div><span class="text-xs text-gray-500">${value}%</span></div>`
  },

  Video(props, _renderChildren) {
    const src = escapeHtml(props.src || "")
    const poster = props.poster
      ? ` poster="${escapeHtml(props.poster)}"`
      : ""
    return `<video src="${src}" controls${poster} class="max-w-full"></video>`
  },

  // ─── 二期表单组件 ───
  Form(props, renderChildren) {
    const children = renderChildren(props.content)
    const submitText = escapeHtml(props.submitText || "Submit")
    return `<form class="space-y-4">${children}<button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">${submitText}</button></form>`
  },

  FormInput(props, _renderChildren) {
    const label = escapeHtml(props.label || "")
    const type = escapeHtml(props.type || "text")
    const placeholder = escapeHtml(props.placeholder || "")
    const required = props.required ? " required" : ""
    return `<label class="block text-sm font-medium text-gray-700">${label}<input type="${type}" placeholder="${placeholder}"${required} class="mt-1 border rounded px-3 py-2 w-full" /></label>`
  },

  FormSelect(props, _renderChildren) {
    const label = escapeHtml(props.label || "")
    const options = Array.isArray(props.options) ? props.options : []
    const opts = options
      .map(
        (opt) =>
          `<option value="${escapeHtml(
            typeof opt === "string" ? opt : opt?.value || ""
          )}">${escapeHtml(
            typeof opt === "string" ? opt : opt?.label || opt?.text || ""
          )}</option>`
      )
      .join("")
    return `<label class="block text-sm font-medium text-gray-700">${label}<select class="mt-1 border rounded px-3 py-2 w-full">${opts}</select></label>`
  },

  FormCheckbox(props, _renderChildren) {
    const label = escapeHtml(props.label || "")
    const checked = props.checked ? ' checked="checked"' : ""
    return `<label class="inline-flex items-center gap-2 text-sm"><input type="checkbox"${checked} class="rounded border-gray-300" /> ${label}</label>`
  },

  FormSwitch(props, _renderChildren) {
    const label = escapeHtml(props.label || "")
    const checked = props.checked ? ' checked="checked"' : ""
    return `<label role="switch" class="inline-flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" class="sr-only"${checked} /><span class="w-10 h-5 bg-gray-300 rounded-full relative ${props.checked ? "bg-blue-600" : ""}"><span class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${props.checked ? "translate-x-5" : ""}"></span></span> ${label}</label>`
  },

  // ─── 二期高级组件 ───
  Modal(props, _renderChildren) {
    const triggerText = escapeHtml(props.triggerText || "Open")
    return `<button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">${triggerText}</button>`
  },

  Drawer(props, _renderChildren) {
    const triggerText = escapeHtml(props.triggerText || "Open")
    return `<button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">${triggerText}</button>`
  },

  Dropdown(props, _renderChildren) {
    const triggerText = escapeHtml(props.triggerText || "Menu")
    return `<button class="px-4 py-2 bg-gray-100 border rounded hover:bg-gray-200">${triggerText}</button>`
  },

  RichText(props, _renderChildren) {
    // RichText 的内容是预先渲染好的 HTML 字符串
    const content =
      typeof props.content === "string" ? props.content : (props.text || "")
    // 注意：这是预先信任的内容，不额外转义（由 Puck 编辑器保证）
    return `<div class="prose max-w-none">${content}</div>`
  },

  Upload(props, _renderChildren) {
    const label = escapeHtml(props.label || "Upload")
    return `<div class="border-2 border-dashed border-gray-300 rounded p-6 text-center text-gray-400">${label}</div>`
  },
}

// ─── 注册类型集合（用于白名单检查） ───

/**
 * 返回 COMPONENT_MAP 支持的所有组件 type 名称。
 * @returns {string[]}
 */
export function getRegisteredTypes() {
  return Object.keys(COMPONENT_MAP)
}

// ─── 递归渲染引擎 ───

/**
 * 递归渲染内容数组中的每个组件。
 * @param {Array|undefined} content Puck Data 的 content 数组
 * @returns {string} 拼接后的 HTML 字符串
 */
export function renderContent(content) {
  if (!Array.isArray(content) || content.length === 0) return ""

  return content
    .map((item) => renderComponent(item))
    .filter(Boolean)
    .join("\n")
}

/**
 * 渲染单个 Puck 组件项。
 * @param {object} item { type: string, props: object }
 * @returns {string}
 */
function renderComponent(item) {
  if (!item || typeof item !== "object") return ""
  const type = item.type
  const props = item.props || {}

  const renderChildren = (children) => {
    if (Array.isArray(children)) return renderContent(children)
    if (children && Array.isArray(children.content)) return renderContent(children.content)
    return ""
  }

  const fn = COMPONENT_MAP[type]
  if (fn) {
    try {
      return fn(props, renderChildren)
    } catch {
      // 单个组件渲染失败时降级
      return `<div class="p-4 border border-dashed border-red-300 text-red-400 text-sm">[渲染错误: ${escapeHtml(type)}]</div>`
    }
  }

  // 未知组件降级占位
  return `<div class="p-4 border border-dashed text-gray-400 text-sm text-center">${escapeHtml(type)}</div>`
}

// ─── 主入口 ───

/**
 * 将 page 对象渲染为完整 HTML 文档字符串。
 *
 * @param {object} page
 * @param {string}        page.title       页面标题
 * @param {string}        page.slug        页面 slug
 * @param {object}        page.content     Puck Data { root, content }
 * @param {object}        [page.metadata]  元数据 { seo?: { title?, description?, keywords?, ogImage? }, themeId? }
 * @param {object}        [page.theme]     主题对象（可选，含 cssVariables 等）
 * @returns {string} 完整 HTML 文档
 */
export default function renderStaticHtml(page) {
  if (!page) return ""

  const title = page.title || ""
  const slug = page.slug || ""
  const metadata = page.metadata || {}
  const seo = metadata.seo || {}

  // SEO 优先使用 metadata.seo.title，否则 fallback 到 page.title
  const seoTitle = seo.title || title
  const description = seo.description || page.description || ""
  const keywords = Array.isArray(seo.keywords) ? seo.keywords : []
  const ogImage = seo.ogImage || ""

  // 渲染主体内容
  const contentArray = page.content?.content
  const bodyHtml = renderContent(contentArray)

  // 构建 <head>
  const metaTags = []
  metaTags.push('  <meta charset="UTF-8">')
  metaTags.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">')
  metaTags.push(`  <title>${escapeHtml(seoTitle)}</title>`)
  metaTags.push(`  <link rel="canonical" href="/p/${escapeHtml(slug)}">`)

  if (description) {
    metaTags.push(`  <meta name="description" content="${escapeHtml(description)}">`)
  }
  if (keywords.length > 0) {
    metaTags.push(`  <meta name="keywords" content="${escapeHtml(keywords.join(", "))}">`)
  }
  if (ogImage) {
    metaTags.push(`  <meta property="og:image" content="${escapeHtml(ogImage)}">`)
    metaTags.push(`  <meta property="og:title" content="${escapeHtml(seoTitle)}">`)
    if (description) {
      metaTags.push(`  <meta property="og:description" content="${escapeHtml(description)}">`)
    }
  }

  // 可选：主题 CSS 变量内联
  let extraStyle = ""
  if (page.theme?.cssVariables) {
    const vars = Object.entries(page.theme.cssVariables)
      .map(([k, v]) => `    ${k}: ${v};`)
      .join("\n")
    extraStyle = `\n  <style>:root {\n${vars}\n  }</style>`
  }

  const head = metaTags.join("\n")

  return [
    '<!DOCTYPE html>',
    '<html lang="zh-CN">',
    '<head>',
    head,
    extraStyle,
    '  <script src="https://cdn.tailwindcss.com"></script>',
    '</head>',
    '<body class="bg-white text-gray-900">',
    '  <main class="max-w-7xl mx-auto px-4 py-8">',
    bodyHtml,
    '  </main>',
    '</body>',
    '</html>',
    "",
  ].join("\n")
}
