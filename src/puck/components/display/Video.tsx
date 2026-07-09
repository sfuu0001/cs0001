// src/puck/components/display/Video.tsx
// 视频展示组件：video element with source + caption

import type { ComponentConfig } from "@measured/puck"

export type VideoProps = {
  src: string
  caption: string
  controls: string
  autoplay: string
  loop: string
}

export const Video: ComponentConfig<VideoProps> = {
  fields: {
    src: { type: "text" },
    caption: { type: "text" },
    controls: {
      type: "radio",
      options: [
        { label: "显示", value: "true" },
        { label: "隐藏", value: "false" },
      ],
    },
    autoplay: {
      type: "radio",
      options: [
        { label: "自动", value: "true" },
        { label: "手动", value: "false" },
      ],
    },
    loop: {
      type: "radio",
      options: [
        { label: "循环", value: "true" },
        { label: "单次", value: "false" },
      ],
    },
  },
  defaultProps: {
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
    caption: "示例视频",
    controls: "true",
    autoplay: "false",
    loop: "false",
  },
  render: ({ src, caption, controls, autoplay, loop }: VideoProps) => (
    <div className="w-full space-y-2">
      <video
        className="w-full rounded-lg border border-border"
        controls={controls === "true"}
        autoPlay={autoplay === "true"}
        loop={loop === "true"}
        playsInline
      >
        <source src={src} type="video/mp4" />
       您的浏览器不支持视频播放。
      </video>
      {caption && (
        <p className="text-center text-sm text-muted-foreground">{caption}</p>
      )}
    </div>
  ),
}
