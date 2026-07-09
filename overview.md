# 可视化页面编辑器 — 一期核心引擎 交付概述

## TL;DR
基于计划书构建的可视化页面编辑器一期：Puck 拖拽编辑 + 8 基础组件 + 管理后台(CRUD/发布/复制/软删) + SQLite 持久化 + 全量 API。已通过 SOP 四阶段验证。

## 技术栈
**前端** React 19 + Vite 6 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui + @measured/puck 0.20.1  
**后端** Express (ESM, JavaScript) + better-sqlite3  
**构建** `tsc -b && vite build` — 111 modules, 3.11s, 0 errors

## 交付概览
| 项 | 状态 |
|---|------|
| 产品需求 (PRD) | ✅ 许清楚产出，一期 P0/P1 覆盖，10 项待确认已采纳 |
| 架构设计 | ✅ 高见远输出，含类图/时序图/文件清单/12 任务分解 |
| 代码实现 | ✅ 寇豆码完成，IS_PASS=YES，构建 0 错误 |
| 测试验证 | ✅ 严过关完成，20/20 测试通过，路由判定: NoOne |
| 实时预览 | ✅ 前端 :5173 / 后端 :3001，已启动 |

## 文件清单

### 后端（新建/修改）
- `server/db.js` — better-sqlite3 连接 + pages 表建表（含 node:sqlite 兜底）
- `server/repositories/pageRepository.js` — CRUD 助手（参数绑定，snake↔camel 映射）
- `server/utils/slug.js` — kebab-case slug 生成 + 唯一化
- `server/routes/pages.js` — 9 个页面管理 API（CRUD/发布/取消发布/复制/恢复/导出占位）
- `server/routes/editor.js` — 编辑载入/保存/预览 API（按 pageId）
- `server/index.js`（改）— 移除 data.json，挂载路由，统一错误中间件

### 前端（新建）
- `src/puck/components/basic/` — 8 基础组件（Heading/Text/Image/Button/Input/Divider/Badge/Alert）
- `src/puck/config.tsx`（改）— 聚合 8 组件，移除 Box，export config + emptyData
- `src/types/page.ts` — Page 类型 + API 响应类型
- `src/lib/api.ts` — 12 个接口 typed 封装

### 前端（新建页面）
- `src/pages/Editor.tsx`（改）— 按 pageId 载入/保存/发布/取消发布
- `src/pages/Preview.tsx`（改）— 按 pageId 只读渲染
- `src/pages/admin/List.tsx` — 管理后台列表页（搜索/筛选/分页/行操作）
- `src/pages/admin/Create.tsx` — 创建页（标题/slug/描述）
- `src/App.tsx`（改）— 路由：/admin /admin/create /editor /editor/:pageId /preview
- `src/components/Navbar.tsx`（改）— 新增导航入口

### 文档
- `docs/system_design.md` — 完整架构设计（8 节）
- `docs/class-diagram.mermaid` — 类图
- `docs/sequence-diagram.mermaid` — 时序图
- `tests/api.integration.test.mjs` — 20 个 API 集成测试

## API 接口（一期已实现）
- `GET /api/pages` — 列表（分页/状态筛选/搜索/回收站）
- `POST /api/pages` — 创建页面
- `GET /api/pages/:id` — 页面详情
- `PUT /api/pages/:id` — 更新页面
- `DELETE /api/pages/:id` — 软删除
- `POST /api/pages/:id/publish` — 发布（校验 content 非空）
- `POST /api/pages/:id/unpublish` — 取消发布
- `POST /api/pages/:id/duplicate` — 复制
- `POST /api/pages/:id/restore` — 恢复
- `GET /api/load/:pageId` — 编辑器载入
- `POST /api/save/:pageId` — 编辑器保存
- `GET /api/preview/:pageId` — 预览（公开只读 + viewCount 自增）

## 用户下一步建议
1. **打开浏览器**访问 http://localhost:5173/admin/create 创建页面 → 自动跳转编辑器 → 拖组件 → 保存内容 → 发布 → 看 /preview
2. **启动方式**：`cd my-app && npm run dev:all`（前端 :5173 + 后端 :3001 同时起）
3. **二期扩展方向**：主题系统（导入/导出 CSS 变量）、媒体管理（上传/选择器）、模板系统（预设模板）、布局/展示/表单组件
4. **后端转 TS**：计划书偏好 TypeScript 后端，一期保持 JS ESM 快速交付，后续可迁移
