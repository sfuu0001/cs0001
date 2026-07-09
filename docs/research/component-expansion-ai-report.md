# 组件扩展 + AI 生产力功能调研报告

> 调研日期：2025-07-10
> 调研范围：现有 30 个 Puck 组件 + 管理后台（主题/媒体/模板/登录/版本历史/表单收集）
> 技术栈：Vite + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui + @measured/puck ^0.20.1

---

## 零、现有组件全景

| 分类 | 已有组件（8+22=30） | 覆盖度 |
|------|---------------------|--------|
| **Basic** (8) | Heading, Text, Image, Button, Input, Divider, Badge, Alert | 基础文本/图片/按钮/分割线 |
| **Layout** (7) | Container, Row, Column, Grid, Card, Section, Tabs | Flex/Grid 布局体系完整 |
| **Display** (6) | Accordion, Carousel, Table, List, Progress, Video | 缺少图表/日历/时间线 |
| **Form** (5) | Form, FormInput, FormSelect, FormCheckbox, FormSwitch | 基础表单组件已齐 |
| **Advanced** (5) | Modal, Drawer, Dropdown, RichText, Upload | 模态/抽屉/富文本/上传 |

**关键缺口**：
- ❌ 无任何 AI 类组件
- ❌ 无任何图表/数据可视化组件
- ❌ 无代码/Markdown 展示组件
- ❌ 无嵌入/步骤条/时间线/评分等业务组件
- ❌ 无源码导出功能（仅有 JSON 导出）

---

## 一、组件扩充清单

### ⭐ P0 — 核心提升（第一期，立即实施）

| 组件名 | 类别 | 用途 | 实现难度 | 理由 |
|--------|------|------|---------|------|
| **AI 文本生成块** | AI | 输入 prompt，调用 LLM 生成文案内容 | 中等 | 用户最关注的生产力功能 |
| **AI 图片生成块** | AI | 输入描述，调用 DALL-E / Stable Diffusion 生成图片并自动上传媒体库 | 中等 | 与现有 Image + Media 模块深度契合 |
| **代码块** | AI/展示 | 语法高亮展示代码片段（Prism.js / Shiki） | 简单 | 技术博客/文档页面必备 |
| **Markdown 预览** | AI/展示 | 输入 Markdown，渲染为 HTML | 简单 | 与现有 RichText 互补 |
| **嵌入块（iframe）** | AI/内容 | URL 嵌入，可嵌入其他页面/工具 | 简单 | 第三方集成的基础通道 |
| **数据表格（静态）** | 数据 | 增强现有 Table 组件，支持排序/搜索/分页 | 中等 | 当前 Table 仅静态展示，无法交互 |
| **统计数字（CountUp）** | 业务 | 带动画效果的数字展示（用于数据面板） | 简单 | 营销/数据页面高频需求 |
| **骨架屏（Skeleton）** | UX | 加载占位动画 | 简单 | 提升页面加载体验 |

### ⭐ P1 — 增强体验（第二期）

| 组件名 | 类别 | 用途 | 实现难度 | 理由 |
|--------|------|------|---------|------|
| **折线图 / 柱状图** | 数据 | Recharts 集成 | 中等 | 数据可视化最基本需求 |
| **饼图 / 雷达图** | 数据 | Recharts 集成 | 中等 | 与折线柱状共用依赖 |
| **看板指标卡（StatCard）** | 数据 | 图标+数值+趋势的指标卡片 | 简单 | 仪表盘场景核心组件 |
| **步骤条（Stepper）** | 业务 | 分步向导流程 | 中等 | 表单/引导流程场景 |
| **时间线（Timeline）** | 业务 | 垂直时间线展示 | 简单 | 博客/履历/更新日志 |
| **评分/星级（Rating）** | 业务 | 星级评分展示+交互 | 简单 | 电商/反馈页面 |
| **价格卡片（PricingCard）** | 业务 | 定价方案展示 | 简单 | SaaS 营销页面必备 |
| **FAQ 手风琴组（改进）** | 业务 | 改进现有 Accordion，支持 schema.org 结构化数据 | 简单 | 营销站点 SEO 需求 |
| **Toast 通知** | UX | 全局操作反馈通知（shadcn 可用） | 简单 | 当前用 alert()，体验差 |
| **空状态展示（EmptyState）** | UX | 无数据时的引导占位 | 简单 | 数据展示场景 |
| **回到顶部（BackToTop）** | UX | 长页面快速回到顶部 | 简单 | 长滚动页面 |
| **搜索条（SearchBar）** | 业务 | 页面/站点内搜索 | 简单 | 内容站点 |
| **进度条多段式** | UX | 改进现有 Progress，支持多段颜色 | 中等 | 技能展示/数据可视化 |
| **AI 翻译块** | AI | 用户选择目标语言后自动翻译页面内容 | 中等 | 多语言场景，用户关注 |
| **AI 组件推荐** | AI | 根据已有内容推荐下一个适合的组件 | 困难 | 智能化编辑体验 |

### P2 — 锦上添花（第三期）

| 组件名 | 类别 | 用途 | 实现难度 |
|--------|------|------|---------|
| **热力图（Heatmap）** | 数据 | ECharts 集成 | 中等 |
| **树形图（TreeView）** | 数据 | 目录/组织结构展示 | 中等 |
| **日历（Calendar）** | 数据 | 日期选择/事件展示 | 中等 |
| **侧边栏（Sidebar）** | 布局 | 页面侧边栏布局 | 中等 |
| **页头/页脚（Header/Footer）** | 布局 | 站点级页头页脚 | 中等 |
| **标签云（TagCloud）** | 展示 | 标签权重可视化 | 简单 |
| **社交分享（SocialShare）** | 业务 | 一键分享到社交媒体 | 简单 |
| **无限滚动（InfiniteScroll）** | UX | 滚动加载更多内容 | 简单 |
| **懒加载图片（改进 Image）** | UX | 改进现有 Image 组件 | 简单 |

---

## 二、React 源码导出功能方案

### 2.1 功能描述

用户通过 Puck 可视化搭建完页面后，可一键导出为**可直接在另一个 React 项目中使用的 `.tsx` 组件代码**，与现有 JSON/HTML 导出不同：

| 导出方式 | 用途 | 目标用户 |
|---------|------|---------|
| JSON 导出（已有） | 编辑器数据格式 | 系统内部 |
| HTML 导出（已有） | 浏览器预览/发布 | 终端用户 |
| **React 源码导出（新增）** | 代码复用/二次开发 | **开发者** |

### 2.2 技术选型建议

**推荐方案：字符串模板（模板引擎）+ 递归遍历生成**

不推荐 Babel AST 方案（过于重型，且项目已有 Tailwind 类名无需解析 AST）。

```
Puck Data (JSON)
    ↓
递归遍历 content[] 数组
    ↓
对每个组件节点匹配类型 → 映射到代码片段模板
    ↓
组装 import + props + JSX
    ↓
输出单个 .tsx 文件
```

### 2.3 导出内容结构

```tsx
// GeneratedPage.tsx
// 自动生成，请勿手动修改

import React from "react"
// 自动收集所有依赖的 import
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
// ...

interface GeneratedPageProps {
  // 从组件 props 中提取可覆盖的变量
  title?: string
}

export default function GeneratedPage(props: GeneratedPageProps) {
  return (
    <div className="...">
      {/* 递归渲染组件树 */}
      <section className="...">
        <h2 className="text-2xl font-bold">{props.title ?? "默认标题"}</h2>
        <p className="text-muted-foreground">...</p>
      </section>
    </div>
  )
}
```

### 2.4 前端 UI 设计

在编辑器顶部工具栏添加「导出代码」按钮，点击后弹出代码预览弹窗：

```
┌─────────────────────────────────────┐
│ 导出 React 组件代码          [关闭] │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │  import React from "react"     │ │
│ │  import { Button } from ...    │ │
│ │                                 │ │
│ │  export default function ...    │ │
│ │    return (                     │ │
│ │      <section>                  │ │
│ │        ...                      │ │
│ │      </section>                 │ │
│ │    )                            │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│  [复制代码]  [下载 .tsx]  [关闭]      │
└─────────────────────────────────────┘
```

**交互细节**：
- 代码预览区使用代码块组件（第 0 期自己就用上 SyntaxHighlight）
- 「复制代码」调用 navigator.clipboard.writeText()
- 「下载 .tsx」通过 Blob 下载
- 支持选择「导出完整页面」或「仅导出选中区域」

### 2.5 核心模块设计

```
src/lib/codegen/
├── index.ts           # 主入口：generateSource(data) => string
├── template.ts        # 文件模板（文件头、import 排序、组件函数骨架）
├── renderers/
│   ├── index.ts       # 组件类型 → renderer 映射表
│   ├── heading.ts     # Heading 组件渲染器
│   ├── button.ts      # Button 组件渲染器
│   ├── card.ts        # Card 组件渲染器
│   └── ...            # 每个 Puck 组件对应一个渲染器
├── utils.ts           # props 序列化、类名合并、递归遍历
└── types.ts           # 代码生成中间类型
```

**渲染器示例（Button）**：

```ts
// renderers/button.ts
export function renderButton(props: ButtonProps): string {
  const variant = props.variant === "outline" ? "outline" : "primary"
  return `<Button variant="${variant}">${props.label}</Button>`
}
```

### 2.6 与现有系统的关系

- **静态 HTML 导出**：调用后端 `/preview/:pageId` 获取已渲染的 HTML → 给浏览器看
- **React 源码导出**：纯前端操作，读取 Puck Data → 转换为 .tsx 代码 → 给开发者用
- 两者互补，不存在冲突

---

## 三、AI 组件集成架构

### 3.1 整体架构

```
┌─────────── 前端（浏览器） ───────────┐
│                                      │
│  Puck Editor                         │
│    │                                 │
│    ├─ AI 文本生成块 ──┐              │
│    ├─ AI 图片生成块 ──┤              │
│    ├─ AI 翻译块 ──────┤              │
│    └─ AI 组件推荐 ────┤              │
│                       │              │
│              @cloudbase/js-sdk       │
│                       │              │
└───────────────────────│──────────────┘
                        │ POST /api/ai/*
                        │
┌─────────── 后端 ──────│──────────────┐
│                       ▼              │
│  API 代理层（Node/Express）          │
│    │                                 │
│    ├─ /api/ai/generate-text   → LLM  │
│    ├─ /api/ai/generate-image  → DALL-E / SD │
│    ├─ /api/ai/translate       → LLM  │
│    └─ /api/ai/recommend       → LLM  │
│                                      │
│  ┌─ AI 服务路由 ──────────────────┐  │
│  │  • 支持多 provider 切换        │  │
│  │  • OpenAI / 国内（DeepSeek/文心） │  │
│  │  • 请求/响应缓存               │  │
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

### 3.2 AI API 接入建议

**推荐双轨策略**：

| Provider | 场景 | 理由 |
|---------|------|------|
| **DeepSeek / 通义千问** | 文本生成+翻译+推荐（国内主力） | 费用低、合规、延迟低 |
| **OpenAI (GPT-4o)** | 文本生成+翻译（海外/高质量场景） | 质量最高但成本高 |
| **DALL-E 3 / Stable Diffusion** | 图片生成 | 按需选择 |

**后端 API 设计**：

```typescript
// POST /api/ai/generate-text
// 请求体
{
  "prompt": "写一段关于产品介绍的文案，风格：专业",
  "context": "当前页面已有内容摘要（可选）",
  "maxTokens": 500,
  "provider": "deepseek"  // 可选
}
// 响应
{
  "result": "我们的产品致力于...",
  "provider": "deepseek",
  "latencyMs": 850
}

// POST /api/ai/generate-image
{
  "prompt": "赛博朋克风格的城市夜景，霓虹灯",
  "size": "1024x1024",
  "provider": "dall-e"
}
// 响应
{
  "url": "https://...",  // 已自动上传到媒体库的 URL
  "mediaId": "abc123",
  "alt": "AI 生成：赛博朋克城市夜景"
}

// POST /api/ai/translate
{
  "text": "Hello, welcome to our website",
  "targetLang": "zh-CN",
  "sourceLang": "en"  // 可选，不传则自动检测
}
// 响应
{
  "result": "您好，欢迎访问我们的网站",
  "detectedSourceLang": "en"
}

// POST /api/ai/recommend
{
  "existingComponents": [
    { "type": "Heading", "props": { "text": "关于我们" } },
    { "type": "Text", "props": { "content": "..." } }
  ],
  "pageType": "about"  // 可选
}
// 响应
{
  "recommendations": [
    {
      "componentType": "Image",
      "reason": "建议添加团队照片以增加信任感",
      "confidence": 0.92
    },
    {
      "componentType": "StatsCard",
      "reason": "展示公司关键数据指标",
      "confidence": 0.85
    }
  ]
}
```

### 3.3 各 AI 组件详细设计

#### 3.3.1 AI 文本生成块

| 维度 | 说明 |
|------|------|
| **定位** | 用户在编辑器内添加一个占位块，输入 prompt 后生成文案 |
| **输入** | prompt 文本框 + 风格选择（专业/幽默/简洁/正式） |
| **输出** | 生成的文本内容，替换占位块为实际 Text 组件 |
| **渲染** | 编辑器中展示「AI 生成中…」加载态 → 生成后转为 Text 组件 |
| **字段** | `prompt`, `style`, `maxLength`, `tone` |
| **特殊** | 生成后可重新生成 / 编辑已生成文本 |

```tsx
// AI 文本生成块组件设计
export type AITextGeneratorProps = {
  prompt: string
  style: "professional" | "casual" | "humorous" | "formal"
  maxLength: number
  generatedContent: string
  provider: string
}

// 编辑器行为：
// 1. 用户输入 prompt，选择风格
// 2. 点击「生成」→ 调 /api/ai/generate-text
// 3. 返回后填充 generatedContent
// 4. 用户可继续编辑或「重新生成」
```

#### 3.3.2 AI 图片生成块

| 维度 | 说明 |
|------|------|
| **定位** | 用户输入描述词，AI 生成图片并存入媒体库 |
| **输入** | 描述文本框 + 风格/尺寸选择 |
| **输出** | 生成的图片自动上传到媒体库（调用现有 Media API） |
| **渲染** | 编辑器中展示生成进度 → 完成后展示图片预览 |
| **字段** | `prompt`, `style`, `size`, `generatedImageUrl`, `generatedMediaId` |
| **亮点** | 生成后自动关联媒体库，可在其他页面复用 |

```tsx
export type AIImageGeneratorProps = {
  prompt: string
  style: "realistic" | "artistic" | "3d" | "pixel"
  size: "512x512" | "1024x1024"
  generatedImageUrl: string
  generatedMediaId: string
}
```

#### 3.3.3 AI 翻译块

| 维度 | 说明 |
|------|------|
| **定位** | 一键翻译当前页面全部文本内容 |
| **输入** | 目标语言选择 |
| **输出** | 替换界面中所有文本组件的 content |
| **渲染** | 非独立渲染组件，而是作为编辑器操作（工具栏按钮） |
| **实现** | 遍历当前 Data 中所有 Text/Heading/Button 等组件的文本字段 → 批量调用翻译 API → 更新 Data |

#### 3.3.4 AI 组件推荐

| 维度 | 说明 |
|------|------|
| **定位** | 根据已添加的组件，智能推荐下一个应添加的组件 |
| **输入** | 当前页面所有组件类型 + props 摘要 |
| **输出** | 推荐组件列表（类型 + 理由 + 置信度） |
| **渲染** | 在编辑器组件面板中展示推荐区域（"AI 推荐"分类） |
| **实现** | 发送当前 content[] 到 /api/ai/recommend → 解析返回 → 高亮推荐组件 |

### 3.4 状态管理

```typescript
// AI 请求的通用状态
interface AIState {
  status: "idle" | "loading" | "success" | "error"
  error?: string
  latencyMs?: number
}

// 在 Puck 组件 props 中嵌入
export type AITextGeneratorProps = {
  prompt: string
  style: string
  maxLength: number
  generatedContent: string
  _aiStatus?: AIState  // 运行时状态，不由用户编辑
}
```

---

## 四、推荐实施路线

### 第一期（基础补齐 + AI 起步）

**预计工作量：2-3 周**

| 序号 | 工作项 | 产出 |
|------|--------|------|
| 1 | 代码块组件（SyntaxHighlight） | 1 个 Puck 组件 |
| 2 | Markdown 预览组件 | 1 个 Puck 组件 |
| 3 | 嵌入块（iframe）组件 | 1 个 Puck 组件 |
| 4 | 统计数字（CountUp）组件 | 1 个 Puck 组件 |
| 5 | 骨架屏（Skeleton）组件 | 1 个 Puck 组件 |
| 6 | **AI 文本生成块** | 1 个 Puck 组件 + 后端 API |
| 7 | **AI 图片生成块** | 1 个 Puck 组件 + 后端 API + 媒体库对接 |
| 8 | 后端 AI 代理层 | Express 路由 + provider 封装 |
| 9 | **React 源码导出 v1** | codegen 模块 + 编辑器UI |
| 10 | 注册到 config.tsx | 更新配置 |

### 第二期（数据可视化 + AI 深化）

**预计工作量：2-3 周**

| 序号 | 工作项 | 产出 |
|------|--------|------|
| 1 | Recharts 集成（折线图/柱状图/饼图/雷达图） | 4 个 Puck 组件 |
| 2 | StatCard 看板指标卡 | 1 个 Puck 组件 |
| 3 | 步骤条（Stepper） | 1 个 Puck 组件 |
| 4 | 时间线（Timeline） | 1 个 Puck 组件 |
| 5 | 评分/星级（Rating） | 1 个 Puck 组件 |
| 6 | 价格卡片（PricingCard） | 1 个 Puck 组件 |
| 7 | Toast 通知 + 空状态 + 回到顶部 | 3 个 UX 组件 |
| 8 | **AI 翻译块** | 编辑器工具栏按钮 + 后端 API |
| 9 | **AI 组件推荐 v1** | 推荐面板 + 后端 API |
| 10 | 增强数据表格（排序/搜索/分页） | 改进现有 Table |
| 11 | 改进 Accordion（FAQ 结构化数据） | 改进现有 Accordion |
| 12 | 源码导出 v2（支持区域选择导出） | codegen 增强 |

### 第三期（高级组件 + 优化）

**预计工作量：2-3 周**

| 序号 | 工作项 | 产出 |
|------|--------|------|
| 1 | 热力图/树形图/日历 | 3 个数据组件 |
| 2 | 侧边栏/页头页脚 | 3 个布局组件 |
| 3 | 标签云/社交分享 | 2 个业务组件 |
| 4 | 无限滚动/懒加载改进 | 2 个 UX 优化 |
| 5 | 多段式进度条 | 改进现有 Progress |
| 6 | AI 组件推荐 v2（基于历史数据训练） | 增强推荐准确性 |
| 7 | 源码导出 v3（自定义模板/多文件导出） | codegen 增强 |

### 资源依赖

| 依赖 | 用途 | 是否必须 |
|------|------|---------|
| `recharts` | 图表组件（折线图/柱状图/饼图/雷达图） | 第二期 |
| `prismjs` 或 `shiki` | 代码语法高亮 | 第一期 |
| `react-markdown` | Markdown 渲染 | 第一期 |
| `react-countup` | 数字动画 | 第一期 |
| `lucide-react` | 图标库（已有 shadcn 依赖，可复用） | 第一期 |
| AI API（DeepSeek / OpenAI） | 所有 AI 组件 | 第一期 |

---

## 五、总结

### 核心结论

1. **AI 组件是差异化核心竞争力**：市面上可视化编辑器大多缺 AI 能力，AI 文本生成 + 图片生成 + 翻译是用户最直接感知到的生产力提升
2. **源码导出是开发者转化的关键**：现有 JSON/HTML 导出无法满足开发者需求。一键导出可复用 .tsx 代码能显著降低用户"从编辑器迁移到代码项目"的门槛
3. **第一期聚焦 5 个基础组件 + 2 个 AI 组件 + 导出功能**即可形成完整故事线
4. **技术风险可控**：所有提议组件均遵循现有 Puck 组件模式（`ComponentConfig<T>` + Tailwind CSS），与现有架构完全兼容
