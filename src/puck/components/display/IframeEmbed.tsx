// src/puck/components/display/IframeEmbed.tsx
// 内嵌 iframe 组件：嵌入外部页面或视频

import { memo } from "react"
import type { ComponentConfig } from "@measured/puck"

export type IframeEmbedProps = {
  src: string
  title: string
  height: string
  allowFullscreen: "true" | "false"
}

const IframeEmbedRender = memo(function IframeEmbedRender({ src, title, height, allowFullscreen }: IframeEmbedProps) {
  const isFullscreen = allowFullscreen === "true"
  return (
    <div className="w-full overflow-hidden rounded-lg border border-border">
      <iframe
        src={src || ""}
        title={title || "嵌入内容"}
        className="w-full"
        style={{ height: height || "400px" }}
        allowFullScreen={isFullscreen}
        sandbox="allow-scripts allow-same-origin allow-popups"
        loading="lazy"
      />
    </div>
  )
})

IframeEmbedRender.displayName = "IframeEmbedRender"

export const IframeEmbed: ComponentConfig<IframeEmbedProps> = {
  fields: {
    src: { type: "text" },
    title: { type: "text" },
    height: { type: "text" },
    allowFullscreen: {
      type: "select",
      options: [
        { label: "是", value: "true" },
        { label: "否", value: "false" },
      ],
    },
  },
  defaultProps: {
    src: "https://example.com",
    title: "嵌入内容",
    height: "400px",
    allowFullscreen: "true",
  },
  render: (props: IframeEmbedProps) => <IframeEmbedRender {...props} />,
}
