# 一期「核心引擎」系统架构设计 + 任务分解

> 角色：架构师（高见远 / Gao）
> 范围：基于 Puck 的拖拽可视化编辑器 + 8 基础组件 + 管理后台 + SQLite 持久化 + 按 pageId 的编辑器/预览 API
> 对齐现状：`my-app` 现有 React19 + Vite6 + TS5 + Tailwind v4 + shadcn/ui + Puck0.20.1 + React Router 7；后端为 `server/index.js`（Express + JSON 文件，无数据库）

---

## 1. 实现方案 + 框架选型

### 1.1 前端（沿用现状，不引入新框架）
- **React 19 + Vite 6 + TypeScript 5**：已就绪，构建链路 `tsc -b && vite build` 保持不变。
- **Tailwind v4 + shadcn/ui**：用于管理后台（列表/创建/表单）的 UI 组件，保持与现有 `src/components/ui`、`cn()` 约定一致。
- **Puck 0.20.1**：可视化编辑器核心。`@measured/puck` 提供 `<Puck>`（编辑态）与 `<Render>`（预览只读态），`Data` / `Config` 类型直接复用。
- **React Router 7**：扩展路由，新增 `/admin`、`/admin/create`、`/editor/:pageId`、`/preview` 等。

### 1.2 后端（关键选型）
- **运行时语言：JavaScript（ESM）**。理由：
  1. `server/index.js` 当前已是 ESM 的 JS，前后端分别独立运行/构建，混用不影响类型安全；
  2. 一期目标是**快速交付可用核心引擎**，引入 `ts-node` / 后端编译会增加构建链与失败面；
  3. 后端 JS 不被前端 `tsc -b`（仅 `include: ["src"]`）纳入类型检查，互不干扰。
  - ⚠️ **计划书偏好 TS 后端，留待后续期转 `ts-node`/编译**——一期不强行转 TS。
- **Web 框架：Express**。⚠️ 现状 `package.json` 为 `express@^5.0.0`，与计划书「Express4」不一致；一期**沿用已安装的 Express 5**（路由写法兼容，无需降级）。
- **数据库：SQLite + `better-sqlite3`（同步 API）**。理由：同步 API 让 CRUD 代码直观、易测；文件型数据库零运维，契合一期单实例快速交付。相比 `node:sqlite` 生态更成熟、文档更全。

### 1.3 架构模式
- 后端采用 **Repository 分层**：`routes/*`（HTTP 层）→ `repositories/pageRepository.js`（数据访问层）→ `better-sqlite3`（DB）。HTTP 层只做参数校验与响应封装，数据访问集中，便于后续换存储/加缓存。
- 前端采用 **页面 + 共享 API 封装**：`src/lib/api.ts` 统一 `fetch` 调用，`src/types/page.ts` 定义前后端一致的 `Page` 类型。

### 1.4 现状到一期的变更要点
| 现状 | 一期 |
|------|------|
| `server/index.js` 直接读写 `data.json` | 拆分为 `db.js` + `routes/*`，数据入 SQLite |
| `/api/load`、`/api/save`（无 pageId，单文件） | `/api/load/:pageId`、`/api/save/:pageId`（按页） |
| Puck config 含 Heading/Text/Button/InputField/Box | 聚合成 8 基础组件，移除非基础组件 Box |
| 无管理后台、无发布概念 | 新增 pages CRUD + 发布/取消发布/复制/软删恢复 + 管理后台页面 |

---

## 2. 文件列表及相对路径

### 2.1 后端（新建 / 修改）
| 文件 | 职责 |
|------|------|
| `server/index.js`（改） | Express 启动、挂载 `pages` 与 `editor` 路由、监听 3001；移除 `data.json` 逻辑 |
| `server/db.js`（新） | `better-sqlite3` 连接初始化 + `pages` 表建表（CREATE TABLE IF NOT EXISTS）+ 导出 `db` |
| `server/repositories/pageRepository.js`（新） | pages 表 CRUD 助手：list/get/create/update/softDelete/restore/duplicate/findBySlug/incrementView（参数绑定防注入） |
| `server/routes/pages.js`（新） | 管理后台资源路由：列表/创建/详情/更新/软删/发布/取消发布/复制/导出占位 |
| `server/routes/editor.js`（新） | 编辑器路由：`/api/load/:pageId`、`/api/save/:pageId`、`/api/preview/:pageId`（预览只读 + viewCount+1） |
| `server/utils/slug.js`（新） | kebab-case slug 生成 + 唯一化（追加 `-2/-3`）；被 pages 路由复用 |
| `server/data/`（新目录） | SQLite 文件 `app.db` 存放位置（建议 gitignore） |

### 2.2 前端（新建 / 修改）
| 文件 | 职责 |
|------|------|
| `src/puck/components/basic/Heading.tsx`（新） | 标题组件（text + level h1/h2/h3） |
| `src/puck/components/basic/Text.tsx`（新） | 文本段落组件 |
| `src/puck/components/basic/Image.tsx`（新） | 图片组件（src + alt + width） |
| `src/puck/components/basic/Button.tsx`（新） | 按钮/链接组件（label + href + variant） |
| `src/puck/components/basic/Input.tsx`（新） | 输入框组件（由现状 InputField 重命名，label + placeholder） |
| `src/puck/components/basic/Divider.tsx`（新） | 分割线组件 |
| `src/puck/components/basic/Badge.tsx`（新） | 徽标组件（text + variant） |
| `src/puck/components/basic/Alert.tsx`（新） | 提示条组件（title + description + variant） |
| `src/puck/config.tsx`（改） | 聚合 8 基础组件为 `Config`，导出 `config` + `emptyData`；移除 Box |
| `src/types/page.ts`（新） | 前端 `Page` 类型 + 各 API 响应类型（与后端模型对齐） |
| `src/lib/api.ts`（新） | 统一 `fetch` 封装与类型化调用：listPages/getPage/createPage/updatePage/deletePage/publish/unpublish/duplicate/loadPage/savePage/previewPage |
| `src/pages/Editor.tsx`（改） | 读取 `?pageId=` 或 `/editor/:pageId`；按 pageId 载入/保存；发布/取消发布；含简易标题/描述头部 |
| `src/pages/Preview.tsx`（改） | 读取 `?pageId=`；调用 `/api/preview/:pageId` 只读渲染 |
| `src/pages/admin/List.tsx`（新） | 管理后台列表：搜索/状态筛选/分页 + 行操作（编辑/预览/发布/取消发布/复制/删除/恢复） |
| `src/pages/admin/Create.tsx`（新） | 创建页：标题/可选 slug/描述表单，提交后跳转编辑器 |
| `src/App.tsx`（改） | 新增路由：`/admin`、`/admin/create`、`/editor/:pageId`、`/editor`、`/preview` |
| `src/components/Navbar.tsx`（改） | 新增「管理后台」「创建页面」导航入口 |
| `package.json`（改） | `dependencies` 增加 `better-sqlite3` |

> 说明：`src/pages/Home.tsx`、`src/pages/About.tsx`、`src/index.css`、`tsconfig*`、`vite.config.ts`、`components.json` 一期**不改动**（Vite 代理 `/api → 3001` 已正确）。

---

## 3. 数据结构和接口

### 3.1 类图（Page 模型与 API 资源关系）
详见 `docs/class-diagram.mermaid`（Mermaid `classDiagram`）。要点：
- `Page`（前端 TS 类型）↔ `PageRow`（SQLite 列，snake_case）经 `PageRepository` 持久化映射。
- `PagesApi`、`EditorApi` 两族路由均操作 `Page` 资源，底层统一调用 `PageRepository`。

### 3.2 接口清单（严格对齐计划书命名）

| 方法 | 路径 | 请求 | 成功响应 | 说明 |
|------|------|------|----------|------|
| GET | `/api/pages` | Query: `page`(默认1), `limit`(默认10,上限100), `status`, `search` | `{ data, total, page, limit }` | 列表，默认 `deleted_at IS NULL`；越界回退 page=1；search 用 `LIKE` 参数绑定防注入 |
| POST | `/api/pages` | Body: `{ title, slug?, description?, template? }` | `{ page }` | 创建草稿；slug 缺省由 title 生成 kebab-case 并唯一化；template 一期忽略/返回暂不支持 |
| GET | `/api/pages/:id` | — | `{ page }` | 详情；软删后不返回（404） |
| PUT | `/api/pages/:id` | Body: `{ title?, content?, status?, description? }` | `{ page }` | 局部更新；content 为 Puck `Data` |
| DELETE | `/api/pages/:id` | — | `{ ok: true }` | **软删除**：置 `deleted_at=NOW` |
| POST | `/api/pages/:id/publish` | — | `{ page }` | 发布；**校验 content 非空，否则 400**；置 `status='published'`、`published_at=NOW` |
| POST | `/api/pages/:id/unpublish` | — | `{ page }` | 取消发布：置 `status='draft'`、`published_at=NULL` |
| POST | `/api/pages/:id/duplicate` | — | `{ page }` | 复制：新 id + `title+" 副本"` + 新唯一 slug，状态重置为 `draft` |
| GET | `/api/pages/:id/export` | — | `{ page }` 或占位 | **一期仅留接口占位**，不实现导出逻辑 |
| GET | `/api/load/:pageId` | — | `{ content: Data }` | 编辑器载入；`deleted_at IS NULL` 且存在则返回 content，否则返回 `emptyData` |
| POST | `/api/save/:pageId` | Body: `{ content: Data }` | `{ ok: true }` | 保存 content（不发布）；更新 `updated_at` |
| GET | `/api/preview/:pageId` | — | `{ content: Data }` | **公开只读**；返回 content 并 `view_count+1` |

> 错误响应统一：`{ error: string, message?: string }` + 对应 HTTP 状态（400/404/409/500）。
> 注：资源端点用 `:id`、编辑器端点用 `:pageId`，二者语义相同（均为 `pages.id`）。

---

## 4. 程序调用流程

详见 `docs/sequence-diagram.mermaid`（含两条 `sequenceDiagram`）：
- **链路 A**：创建页面 → 编辑器载入 → 编辑 → 保存 → 发布 → 预览（全链路）。
- **链路 B**：管理后台列表加载（分页/搜索/筛选）。

关键路径摘要：
1. 创建：`Create.tsx` → `POST /api/pages` → repository `create` → 跳转 `/editor?pageId=ID`。
2. 编辑/保存：`Editor.tsx` → `GET /api/load/:pageId`（取 content）→ 用户编辑 → `POST /api/save/:pageId`（存 content）。
3. 发布：`Editor.tsx` → `POST /api/pages/:id/publish`（校验 content 非空）。
4. 预览：`Preview.tsx` → `GET /api/preview/:pageId`（读 content + viewCount+1）。
5. 列表：`List.tsx` → `GET /api/pages?page&limit&status&search` → repository `list`（带 `deleted_at IS NULL` + 分页/筛选）→ 渲染。

---

## 5. 任务列表（核心产出，按实现顺序排列）

> 约定：`依赖` 指必须**先完成**的前置任务编号；`涉及文件` 仅列一期新建/修改文件；`验收点` 为可验证的完成标准。

### T11 · 安装依赖（better-sqlite3）
- **依赖**：无
- **涉及文件**：`package.json`
- **验收点**：`npm install better-sqlite3` 成功；`node -e "require('better-sqlite3')"` 可加载（或确认预编译二进制就绪）。

### T1 · 后端 DB 层（better-sqlite3 初始化 + 建表 + CRUD 助手）
- **依赖**：T11
- **涉及文件**：`server/db.js`、`server/repositories/pageRepository.js`
- **验收点**：启动后生成 `server/data/app.db`；`pages` 表按数据模型建好；`pageRepository` 的 list/get/create/update/softDelete/restore/duplicate/findBySlug/incrementView 单元测试/手工调用均正确；所有查询使用参数绑定（无字符串拼接 SQL）。

### T2 · 后端 pages 管理 API 路由
- **依赖**：T1
- **涉及文件**：`server/routes/pages.js`、`server/utils/slug.js`、`server/index.js`（挂载路由）
- **验收点**：9 个 pages 端点按第 3.2 节表实现；slug 自动生成且唯一（冲突返回 409）；列表分页默认 `page=1,limit=10`、上限 100、越界回退；发布校验 content 非空（空则 400）；软删后列表不出现、详情 404；复制生成独立记录。

### T3 · 后端编辑器 load/save/preview API
- **依赖**：T1
- **涉及文件**：`server/routes/editor.js`、`server/index.js`（挂载路由）
- **验收点**：`/api/load/:pageId` 返回 content 或 `emptyData`；`/api/save/:pageId` 写入 content 并更新 `updated_at`；`/api/preview/:pageId` 公开只读且每次 `view_count+1`；不存在/已软删的 page 返回 404。

### T4 · Puck 8 基础组件 config
- **依赖**：无
- **涉及文件**：`src/puck/components/basic/Heading.tsx`、`Text.tsx`、`Image.tsx`、`Button.tsx`、`Input.tsx`、`Divider.tsx`、`Badge.tsx`、`Alert.tsx`
- **验收点**：8 个组件各自导出合规的 Puck 组件配置（fields + defaultProps + render）；`Input` 由现状 `InputField` 重命名；无 `any` 滥用（至少 `props` 类型化或局部标注）。

### T5 · 聚合 config + 类型 + API 封装
- **依赖**：T4
- **涉及文件**：`src/puck/config.tsx`、`src/types/page.ts`、`src/lib/api.ts`
- **验收点**：`config.tsx` 聚合 8 基础组件并导出 `config` + `emptyData`（移除 Box）；`page.ts` 定义与后端一致的 `Page` 及响应类型；`api.ts` 提供全部 12 个接口的 typed 封装，响应形状与第 3.2 节一致。

### T6 · 编辑器页改造（按 pageId 载入/保存/发布）
- **依赖**：T3、T5
- **涉及文件**：`src/pages/Editor.tsx`
- **验收点**：支持 `?pageId=` 与 `/editor/:pageId`；进入即 `GET /api/load/:pageId`；保存调用 `POST /api/save/:pageId`；发布/取消发布按钮调用对应 pages 接口；含简易标题/描述头部（PUT 更新）；pageId 缺失/不存在有友好提示。

### T7 · 预览页改造（按 pageId）
- **依赖**：T3、T5
- **涉及文件**：`src/pages/Preview.tsx`
- **验收点**：支持 `?pageId=`；调用 `GET /api/preview/:pageId`；用 `<Render>` 只读渲染 content；无 pageId 时提示。

### T8 · 管理后台列表页
- **依赖**：T2、T5
- **涉及文件**：`src/pages/admin/List.tsx`
- **验收点**：表格展示页（标题/slug/状态/浏览量/更新时间）；搜索框、状态筛选、分页控件均调用 `GET /api/pages`；行操作：编辑（→`/editor?pageId=`）、预览（→`/preview?pageId=`）、发布/取消发布、复制、删除（软删）；已软删项提供「恢复」入口（可从独立视图或筛选 `deleted` 展示，一期以恢复按钮形式放在列表操作区或回收视图）。

### T9 · 管理后台创建页
- **依赖**：T2、T5
- **涉及文件**：`src/pages/admin/Create.tsx`
- **验收点**：表单含标题（必填）、slug（可选）、描述；提交 `POST /api/pages`；成功后跳转 `/editor?pageId=<新id>`；slug 非法/冲突有校验提示。

### T10 · 路由 + 导航接入
- **依赖**：T6、T7、T8、T9
- **涉及文件**：`src/App.tsx`、`src/components/Navbar.tsx`
- **验收点**：路由 `/admin`、`/admin/create`、`/editor`、`/editor/:pageId`、`/preview` 全部可达；Navbar 新增「管理后台」「创建页面」入口；旧路由（首页/关于）不受影响。

### T12 · 构建验证
- **依赖**：T1–T11（全部）
- **涉及文件**：全量
- **验收点**：`npm run build` 无 TS/Vite 错误；`npm run dev:all` 可同时起前端与后端；端到端走通「创建→编辑→保存→发布→预览→列表→软删/恢复→复制」；`/api/preview/:pageId` 公开可访问且 viewCount 自增。

---

## 6. 依赖包列表

### 新增运行依赖
```
better-sqlite3        // SQLite 同步驱动（运行依赖）
```
- 安装命令：`npm install better-sqlite3`
- 无新增前端依赖（Puck、shadcn/ui、React Router 7 均已具备）。

### 构建环境说明（Windows）
- `better-sqlite3` 为原生模块，安装时通常拉取**预编译二进制**（无需本地编译）。
- 若预编译不可用，Windows 需 `node-gyp` + Python 3 + MSVC 生成工具才能本地编译。本机 Node 为 **v22.22.2**（≥22）。
- **Fallback（按顺序）**：
  1. 优先使用预编译二进制（最常见，直接成功）；
  2. 若编译持续失败，改用 **`node:sqlite`**（Node 22+ 内置，零依赖）——需将 `server/db.js` 的驱动替换为 `node:sqlite`，接口语义基本一致；
  3. 再不行，改用纯 WASM 的 **`sql.js`**（完全免编译，但需自行管理内存持久化）。

> 因 DAL 已封装在 `pageRepository.js`，更换驱动仅需改 `server/db.js` 一处，上层路由无感。

---

## 7. 共享知识（跨文件约定）

| 主题 | 约定 |
|------|------|
| **字段映射** | 前端 `Page` 用 camelCase（`viewCount`、`createdAt`…）；DB `pages` 表用 snake_case（`view_count`、`created_at`…）；`pageRepository` 负责双向映射，HTTP 响应统一返回 camelCase 的 `page` 对象。 |
| **Puck 类型导入** | `import type { Config, Data } from "@measured/puck"`；`Data` 即 Puck 导出的内容结构 `{ root, content, zones? }`，直接作为 `Page.content`。 |
| **API 基础路径** | 所有接口以 `/api` 开头；开发态由 Vite 代理 `/api → http://localhost:3001`（`vite.config.ts` 已配置）。 |
| **fetch 封装** | 统一走 `src/lib/api.ts`：内部 `fetch`，非 2xx 时 `throw` 含状态码的错误；调用方 `try/catch` 处理；不在此层做业务校验。 |
| **响应信封** | 列表：`{ data, total, page, limit }`；单资源/写操作：`{ page }`；导出占位：`{ page }`；错误：`{ error, message? }` + HTTP 状态。 |
| **slug 规则** | kebab-case（小写、连字符），缺省由 title 转换；入库前查重，冲突追加 `-2/-3`；UNIQUE 约束兜底；冲突时返回 409。 |
| **时间戳** | 统一 **ISO 8601** 字符串（`new Date().toISOString()`）；SQLite 以 `DATETIME`/`TEXT` 存储；前端原样展示或按需格式化。 |
| **content 存取** | `Page.content` 为 Puck `Data` 对象；入库序列化为 JSON 文本存入 `content` 列；出库解析为对象返回（**非字符串**）。 |
| **id 生成** | `pages.id` 为 `TEXT` 主键，使用 `crypto.randomUUID()` 生成。 |
| **软删除语义** | 列表/详情默认 `WHERE deleted_at IS NULL`；删除置 `deleted_at=NOW`，恢复置 `NULL`。 |
| **分页稳健性** | `page` 下限 1，`limit` 默认 10、上限 100；非法/越界值回退默认，避免 SQL 越界或注入。 |

---

## 8. 待明确事项（均不在一期实现）

1. **后端转 TS**：计划书偏好 TS 后端（`ts-node`/编译），一期保持 JS(ESM) 快速交付，后续期再迁移。
2. **模板系统（template 字段）**：`POST /api/pages` 接收 `template` 但一期忽略/返回「暂不支持」，模板引擎后续期建设。
3. **鉴权**：一期管理类接口**不鉴权**；JWT/会话鉴权、权限控制留待后续期。
4. **导出逻辑**：`GET /api/pages/:id/export` 仅留接口占位，不实现实际导出。
5. **缓存/中间件**：Redis、CDN、多实例、限流等后续期；一期单 SQLite 文件即可。
6. **多用户与版本历史**：协作编辑、页面版本回溯不在一期。
7. **Box 布局组件**：一期 8 基础组件不含 Box，已从 config 移除；如后续需要布局容器，作为扩展组件后续期新增。
8. **`:id` vs `:pageId` 命名**：编辑器端点用 `:pageId`、资源端点用 `:id`（REST 惯例），二者语义相同（均为 `pages.id`）；是否统一命名留待后续，一期按计划书保持不变。
9. **预览可见性**：一期 `/api/preview/:pageId` 对「任意存在且未软删」的 page 公开只读（含草稿）；是否限制「仅已发布可预览」待产品确认，一期不限制。

---

### 一句话：最关键的 2 个技术风险与应对
1. **`better-sqlite3` 在 Windows/Node 原生编译失败** → 优先用预编译二进制；失败则替换为内置 `node:sqlite`（Node22+ 可用）或 `sql.js`，因 DAL 已封装在 `pageRepository.js`，仅改 `server/db.js` 一处即可切换驱动。
2. **Puck `Data` 内容与后端 `content` 序列化/反序列化不一致导致编辑器载入失败** → 约定 `content` 以 Puck `Data` 原样 JSON 存取、空画布用 `emptyData` 兜底、载入时校验 `root/content` 结构，确保前后端数据结构契约一致。
