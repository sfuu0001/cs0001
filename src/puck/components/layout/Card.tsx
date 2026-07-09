// src/puck/components/layout/Card.tsx
// 卡片布局组件：shadcn Card + title + description + DropZone

import type { ComponentConfig } from "@measured/puck"
import { DropZone } from "@measured/puck"
import {
  Card as ShadcnCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

export type CardProps = {
  title: string
  description: string
  padding: "0" | "4" | "8"
  shadow: "none" | "sm" | "md" | "lg"
}

const paddingMap: Record<CardProps["padding"], string> = {
  "0": "p-0",
  "4": "p-4",
  "8": "p-8",
}

const shadowMap: Record<CardProps["shadow"], string> = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
}

export const Card: ComponentConfig<CardProps> = {
  fields: {
    title: { type: "text" },
    description: { type: "textarea" },
    padding: {
      type: "select",
      options: [
        { label: "0", value: "0" },
        { label: "4", value: "4" },
        { label: "8", value: "8" },
      ],
    },
    shadow: {
      type: "select",
      options: [
        { label: "无", value: "none" },
        { label: "小", value: "sm" },
        { label: "中", value: "md" },
        { label: "大", value: "lg" },
      ],
    },
  },
  defaultProps: {
    title: "卡片标题",
    description: "卡片描述文字",
    padding: "4",
    shadow: "md",
  },
  render: ({ title, description, padding, shadow }: CardProps) => (
    <ShadcnCard className={`${paddingMap[padding]} ${shadowMap[shadow]}`}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <DropZone zone="content" />
      </CardContent>
    </ShadcnCard>
  ),
}
