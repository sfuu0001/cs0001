// src/components/HeroBanner.tsx
// BYO 示例组件 — 带多种 Props 类型的响应式横幅

interface HeroBannerProps {
  /** 主标题文字 */
  title: string
  /** 副标题文字 */
  subtitle?: string
  /** 按钮文字 */
  buttonText: string
  /** 按钮链接 */
  buttonUrl: string
  /** 主题色变体 */
  variant: "light" | "dark" | "gradient"
  /** 是否显示装饰元素 */
  showDecorations: boolean
  /** 内边距（px） */
  padding: number
}

export default function HeroBanner({
  title = "欢迎来到我们的网站",
  subtitle,
  buttonText = "了解更多",
  buttonUrl = "#",
  variant = "light",
  showDecorations = true,
  padding = 40,
}: HeroBannerProps) {
  const bgClass =
    variant === "dark"
      ? "bg-gray-900 text-white"
      : variant === "gradient"
        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        : "bg-gray-50 text-gray-900"

  return (
    <div
      className={`relative overflow-hidden ${bgClass}`}
      style={{ padding: `${padding}px 24px` }}
    >
      {showDecorations && (
        <>
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10" />
        </>
      )}
      <div className="relative mx-auto max-w-4xl text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mb-8 text-lg opacity-80">{subtitle}</p>
        )}
        <a
          href={buttonUrl}
          className="inline-block rounded-lg bg-white/20 px-8 py-3 font-semibold backdrop-blur-sm transition-colors hover:bg-white/30"
        >
          {buttonText}
        </a>
      </div>
    </div>
  )
}
