// src/puck/components/basic/Image.tsx
// 图片基础组件：src + alt + width

import type { ComponentConfig } from "@measured/puck"

export type ImageProps = {
  src: string
  alt: string
  width: number
}

export const Image: ComponentConfig<ImageProps> = {
  fields: {
    src: { type: "text" },
    alt: { type: "text" },
    width: { type: "number" },
  },
  defaultProps: {
    src: "https://placehold.co/600x320",
    alt: "示例图片",
    width: 600,
  },
  render: ({ src, alt, width }: ImageProps) => (
    <img
      src={src}
      alt={alt}
      style={{ width: width ? `${width}px` : "100%", maxWidth: "100%" }}
      className="rounded-lg border"
    />
  ),
}
