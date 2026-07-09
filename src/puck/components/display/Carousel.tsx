// src/puck/components/display/Carousel.tsx
// 轮播展示组件：CSS scroll-snap 横向滚动 + 左右箭头

import { useRef } from "react"
import type { ComponentConfig } from "@measured/puck"

export type CarouselProps = {
  images: { src: string; alt: string }[]
  autoPlay: string
  interval: number
}

export const Carousel: ComponentConfig<CarouselProps> = {
  fields: {
    images: {
      type: "array",
      arrayFields: {
        src: { type: "text" },
        alt: { type: "text" },
      },
      getItemSummary: (_item: unknown, index?: number) =>
        `图片 ${(index ?? 0) + 1}`,
      defaultItemProps: { src: "https://placehold.co/800x400", alt: "轮播图" },
    },
    autoPlay: {
      type: "radio",
      options: [
        { label: "启用", value: "true" },
        { label: "禁用", value: "false" },
      ],
    },
    interval: { type: "number", min: 1000, max: 30000 },
  },
  defaultProps: {
    images: [
      { src: "https://placehold.co/800x400/3b82f6/ffffff?text=Slide+1", alt: "幻灯片 1" },
      { src: "https://placehold.co/800x400/8b5cf6/ffffff?text=Slide+2", alt: "幻灯片 2" },
      { src: "https://placehold.co/800x400/ec4899/ffffff?text=Slide+3", alt: "幻灯片 3" },
    ],
    autoPlay: "false",
    interval: 3000,
  },
  render: ({ images }: CarouselProps) => {
    const containerRef = useRef<HTMLDivElement>(null)

    const scrollTo = (direction: "left" | "right") => {
      if (!containerRef.current) return
      const scrollAmount = containerRef.current.clientWidth
      const target =
        direction === "left"
          ? containerRef.current.scrollLeft - scrollAmount
          : containerRef.current.scrollLeft + scrollAmount
      containerRef.current.scrollTo({ left: target, behavior: "smooth" })
    }

    return (
      <div className="group relative w-full overflow-hidden rounded-lg">
        {/* 滚动容器 */}
        <div
          ref={containerRef}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {images.map((img, index) => (
            <div
              key={index}
              className="w-full shrink-0 snap-center"
            >
              <img
                src={img.src}
                alt={img.alt || ""}
                className="h-64 w-full object-cover"
              />
            </div>
          ))}
        </div>
        {/* 左右箭头 */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollTo("left")}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground opacity-0 shadow transition-opacity hover:bg-background group-hover:opacity-100"
              aria-label="上一个"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollTo("right")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground opacity-0 shadow transition-opacity hover:bg-background group-hover:opacity-100"
              aria-label="下一个"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}
      </div>
    )
  },
}
