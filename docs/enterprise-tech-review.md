# 企业级技术优化分析报告

> **项目**: 基于 Puck 低代码引擎的可视化页面搭建平台  
> **分析者**: Bob (架构师)  
> **日期**: 2026-07-10  
> **评级**: 🟡 **有条件可交付** — 核心功能完备，但距生产级标准差距明显，需优先处理 P0 问题

---

## 1️⃣ 架构评估

### 1.1 整体架构质量

| 维度 | 评级 | 说明 |
|------|------|------|
| 前端分层 | 🟡 B- | src/pages/ 路由级页面、src/puck/ 编辑器组件、src/lib/ API工具层，层次清晰；但部分逻辑（如 Editor.tsx）单文件 760+ 行，混合了状态管理、UI、快捷键、撤销/重做等职责，严重违反单一职责原则 |
| 后端分层 | 🟡 C+ | Repository 模式雏形存在（pageRepository 等），但 routes/ 层直接调用 repo 层，缺少 Service 业务逻辑层；所有路由都各自定义 asyncHandler 包装器，存在大量重复 |
| 数据流设计 | 🟢 B+ | 前端通过 src/lib/api.ts 统一封装 fetch，请求/响应格式一致；后端全部使用参数化查询（防 SQL 注入） |
| 模块耦合度 | 🟡 C | Editor.tsx 单文件 760 行耦合了 7 种独立职责；ThemeInjector、CodePreview、useUndoRedo 等组件未拆分为独立文件 |
| 可测试性 | 🟡 C- | 仅有两份 API 集成测试（node:test），无单元测试、无组件测试、无 CI 自动测试执行 |

### 1.2 单点故障 — SQLite 风险分析

**风险级别: 🔴 P0**

| 风险 | 详情 |
|------|------|
| 写入锁 | better-sqlite3 虽为同步驱动 + WAL 模式，但**单节点单进程**写入仍是串行化。多用户同时编辑时，并发写入请求排队，响应延迟会显著增加 |
| 无高可用 | SQLite 无主从复制、无故障转移机制。一旦 DB 文件损坏或磁盘故障，**全部数据丢失** |
| 单机瓶颈 | 应用与数据库同进程，无法独立扩展。后端进程重启时数据库不可用 |
| 备份复杂 | WAL 模式下的热备份需特殊处理（`.backup` API 或 VACUUM INTO），不能简单 cp |

### 1.3 可扩展性

| 能力 | 现状 | 评价 |
|------|------|------|
| 水平扩展 | ❌ 不支持 | SQLite + 本地文件存储 + 内存 rate limit 三重重度耦合，无法多节点部署 |
| 多进程 | ❌ 不支持 | 多进程同时写入 SQLite 会触发 `SQLITE_BUSY` |
| CDN 就绪 | ⚠️ 部分支持 | 前端静态资源可通过 CDN 分发，但未配置 content hash 文件名 |
| API 无状态 | ⚠️ 有状态 | Rate limit 存储在内存 Map 中，多实例下各自独立计数 |

---

## 2️⃣ 构建与发布 (Build & Release)

### 2.1 环境隔离

| 环境 | 现状 | 问题 |
|------|------|------|
| 开发 | `.env.example` + 默认配置 | JWT_SECRET 硬编码默认值 `my-app-jwt-secret-dev`，无真正的 .env 加载机制 |
| 测试 | 无独立配置 | 测试直接连接开发数据库（localhost:3001），测试数据与开发数据混杂 |
| 生产 | docker-compose.yml 环境变量 | 多环境变量（JWT_SECRET, DATABASE_PATH等）需在 .env 文件或 CI Secrets 中统一管理，**当前无任何文档指导** |

**改进方案**: 使用 `dotenv` + 多环境 `.env.{environment}` 文件 + Zod schema 验证环境变量完整性。

### 2.2 CI/CD 流水线

deploy.yml 整体结构合理（test → build → deploy），但存在以下问题：

| 问题 | 风险等级 | 说明 |
|------|---------|------|
| 测试步骤被注释 | 🔴 P0 | `# - name: Run tests` 被注释，CI 对测试覆盖率为零 |
| TypeScript 检查用 `--noEmit` 但加了 `|| echo` | 🟡 P1 | 即使类型检查失败，CI 也会因 `|| echo` 静默通过 |
| 无代码质量门禁 | 🟡 P1 | 无 ESLint/SonarQube/CodeQL 检查 |
| 部署脚本无蓝绿策略 | 🟡 P1 | `docker compose up -d --force-recreate` 直接重启，存在服务中断窗口 |
| 健康检查仅 curl 一次 | 🟡 P2 | 部署验证不够充分（无 API 功能验收测试） |

### 2.3 Docker 部署

**Dockerfile 问题**:

| 问题 | 风险等级 | 建议 |
|------|---------|------|
| ❌ **缺少 `.dockerignore`** | 🔴 P0 | `COPY . .` 会将 node_modules、.git、本地数据文件全部复制进构建上下文，严重拖慢构建并可能泄露本地凭据 |
| ❌ **以 root 运行** | 🔴 P0 | `FROM node:22-alpine` 默认以 root 运行，违反安全基线。应创建 `node` 非特权用户 |
| ❌ **server 目录不在构建阶段处理** | 🟡 P1 | `COPY server/ server/` 在生产阶段复制，意味着 server 代码变更无法利用构建缓存 |
| ⚠️ `npm ci --omit=dev` 但未锁 package-lock | 🟡 P2 | 需要确认 package-lock.json 是否在版本控制中 |
| ⚠️ 无镜像安全扫描 | 🟡 P1 | 建议集成 Docker Scout 或 Trivy |

**改进后的 Dockerfile 结构**:
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY server/ ./server/
USER appuser
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-3000}/api/hello', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"
EXPOSE 3000
CMD ["node", "server/index.js"]
```

### 2.4 版本管理与回滚

| 能力 | 现状 | 建议 |
|------|------|------|
| 语义化版本 | ❌ 无 | `package.json` 中 `"version": "0.0.0"` 占位 |
| CHANGELOG | ❌ 无 | 建议引入 conventional-changelog / standard-version |
| Git tag | ❌ 无 | Docker 镜像使用 `github.sha` 而非 tag，无法追溯版本 |
| 数据库回滚 | ❌ 无 | SQLite 无迁移记录，无法回退 schema 变更 |
| 蓝绿部署 | ❌ 无 | 当前 `--force-recreate` 导致停机 |

**建议方案**: 引入 `node-pg-migrate` 类迁移工具（即使 SQLite 也可以使用抽象层），Docker Compose 采用双容器滚动更新。

### 2.5 域名/SSL/CDN

| 检查项 | 现状 | 风险等级 |
|--------|------|---------|
| SSL 证书 | ❌ ssl/ 目录为空，nginx HTTPS server block 被注释 | 🔴 P0 — 生产环境无 HTTPS |
| CDN 配置 | ❌ 无 | 🟡 P2 |
| 静态资源文件名 Hash | ⚠️ Vite build 默认生成 hash，但未明确配置 | 🟢 可接受 |

### 2.6 监控告警

**完全缺失** 🔴 P0

| 需求 | 当前 | 建议方案 |
|------|------|---------|
| 错误日志 | `console.error` 直接输出到 stdout | 集成 pino/winston + 日志轮转 |
| API 响应时间 | 无 | 添加 express 请求计时中间件，输出到结构化日志 |
| 服务器负载 | 无 | Docker 级别监控 (cAdvisor + Prometheus) |
| 宕机告警 | 无 | 集成 uptime monitoring (Better Uptime / Pingdom) |
| 内存/CPU | 无 | Node.js `process.memoryUsage()` 定期上报 |

### 2.7 数据备份

**完全缺失** 🔴 P0

当前 SQLite 数据库文件 `server/data/app.db` 无任何备份策略。

**建议方案**:
```
日备份:  每天凌晨 3:00 执行 sqlite3 .backup 到本地 /backups/
周归档:  每周日将一周备份打包上传到对象存储（COS/S3）
保留策略: 日备份保留 7 天，周归档保留 3 个月
验证:     每月随机抽取备份文件恢复验证
```

备份脚本参考：
```bash
#!/bin/bash
# Daily SQLite backup
DB_PATH="/app/data/app.db"
BACKUP_DIR="/backups/daily"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"
sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/app_$TIMESTAMP.db'"
# 保留最近 7 天
find "$BACKUP_DIR" -name "*.db" -mtime +7 -delete
```

---

## 3️⃣ 性能评估

### 3.1 首次加载性能

| 指标 | 预测 | 风险等级 |
|------|------|---------|
| LCP | ⚠️ 中等（2-3s） | 🟡 P1 — 编辑器页面需加载 puck（~500KB gzip）和大量组件 |
| FCP | ⚠️ 中等（1.5-2s） | 🟡 P1 |
| TTI | ⚠️ 偏高（3-4s） | 🟡 P1 — React 19 + Puck 的 hydration 开销 |

**现有优化措施评估**:
- ✔️ Vite 自动代码分割
- ✔️ manualChunks 将 React、Puck、vendor 分离
- ❌ 缺少 `React.lazy()` 路由级懒加载
- ❌ 未启用 Vite `build.cssMinify` （Tailwind v4 会很大）
- ❌ 未配置预加载策略 (`<link rel="modulepreload">`)

### 3.2 构建产物分析

vite.config.ts 的 manualChunks 策略：
```typescript
manualChunks(id) {
  if (id.includes('@measured/puck')) return 'puck-vendor'    // ~500KB
  if (id.includes('react-dom') || id.includes('react/')) return 'react-vendor'  // ~130KB
  if (id.includes('node_modules')) return 'vendor'            // ~200KB+（其他三方库）
}
```

**问题**: 
- Tailwind CSS 生成的样式未单独提取，打入了主 bundle
- 45+ Puck 组件全部打包在主 chunk 中，建议按使用频率做更细粒度分割

### 3.3 编辑器运行时性能

| 机制 | 效果 | 评价 |
|------|------|------|
| RAF 节流 | `requestAnimationFrame` + 500ms 历史间隔 | 🟢 有效降低拖拽时的 setData 频率 |
| React.memo | Editor 组件整体 memo | 🟡 有效但粗粒度。更优方案：拆分 `EditorToolbar`、`EditorCanvas`、`ThemeSelector` 子组件各自 memo |
| structuredClone | 撤销/重做使用深拷贝 | 🟡 大数据量 content（如 100+ 组件）时 structuredClone 可能成为瓶颈（O(n) 内存） |
| JSON.stringify 去重 | RAF 回调中用 `JSON.stringify` 比较前后内容 | 🟡 大数据量时可能阻塞主线程 |

**建议**:
1. 拆分 Editor.tsx 为 5-7 个独立子组件，各自使用 React.memo
2. 历史栈改用增量存储（仅保存 diff），而非全量 structuredClone
3. 引入 `react-window` / `virtualized list` 处理长组件列表

### 3.4 数据库查询性能

SQLite WAL 模式已启用，但：
- 并发读 ✅ 支持（WAL 允许多读一写）
- 并发写 ❌ 串行化（better-sqlite3 同步驱动，写操作互斥）
- 复杂查询 ❌ 无索引优化

**当前索引情况**: 除了 PRIMARY KEY 外，**没有任何二级索引**。

需添加以下索引：
```sql
CREATE INDEX idx_pages_status ON pages(status);
CREATE INDEX idx_pages_deleted_at ON pages(deleted_at);
CREATE INDEX idx_pages_updated_at ON pages(updated_at);
CREATE INDEX idx_page_versions_page_id ON page_versions(page_id);
CREATE INDEX idx_media_mime_type ON media(mime_type);
CREATE INDEX idx_form_submissions_page_id ON form_submissions(page_id);
```

### 3.5 文件上传性能

multer 配置：
- 单文件限制: 10MB
- 批量限制: 最多 20 个文件
- 存储: 本地磁盘

**风险**: 
- 默认 `multer.diskStorage()` 在高并发下存在磁盘 I/O 瓶颈
- 无文件上传进度反馈（前端无进度条）
- STMP 服务端未做上传并发数限制

### 3.6 内存泄漏风险

| 风险点 | 现状 | 风险等级 |
|--------|------|---------|
| Editor.tsx 定时器 | RAF 使用 cancelAnimationFrame | 🟢 安全 |
| 组件卸载清理 | useEffect return 清理已实现 | 🟢 安全 |
| 历史栈 | 有 MAX_HISTORY=50 上限 | 🟢 安全 |
| 内存 rate limit Map | 有 setInterval 清理过期条目 | 🟢 安全，但单例模式下 Map 会无限增长（如有大量 IP） |
| 文件描述符 | multer 上传后未检查 fd 泄漏 | 🟡 建议增加 fd 监控 |

---

## 4️⃣ 安全评估

### 4.1 JWT 安全 — 多个严重问题

| 问题 | 风险等级 | 详情 |
|------|---------|------|
| ❌ 硬编码密钥 | 🔴 P0 | `const JWT_SECRET = process.env.JWT_SECRET || "my-app-jwt-secret-dev"`，开发环境生产环境均可回退到硬编码值 |
| ❌ Token 过期过长 | 🟡 P1 | `TOKEN_EXPIRY = "7d"`，无 refresh token 机制。一旦泄露，攻击者可持续使用 7 天 |
| ❌ 无 Refresh Token | 🟡 P1 | 无短期 access token + 长期 refresh token 的 Token 轮换机制 |
| ❌ 无密钥轮换 | 🟡 P2 | JWT_SECRET 一旦泄露无轮换机制 |
| ❌ 无黑名单 | 🟡 P2 | 无法将泄露的 token 作废 |

**改进方案**:
```typescript
// 双 Token 机制
const ACCESS_TOKEN_EXPIRY = "15m"   // 15 分钟
const REFRESH_TOKEN_EXPIRY = "7d"   // 7 天
// 密钥从环境变量强制读取，无默认值
const JWT_SECRET = process.env.JWT_SECRET // 启动时验证非空
```

### 4.2 API 安全

| 检查项 | 现状 | 风险等级 |
|--------|------|---------|
| Rate Limit | 内存实现，100 req/min/IP | 🟡 重启丢失，多实例无效 |
| CORS | `app.use(cors())` **无任何限制** | 🔴 P0 — 任何域名均可跨域请求 API |
| SQL 注入 | 全部使用参数绑定 | 🟢 安全（正确做法） |
| 请求体限制 | `express.json({ limit: "10mb" })` | 🟡 合理但偏大 |
| Helmet | 未使用 | 🟡 P1 — 缺少 XSS、点击劫持等 HTTP 头保护 |

**CORS 改进**:
```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,  // 预检请求缓存 24h
}))
```

### 4.3 XSS 防护

| 风险点 | 现状 | 风险等级 |
|--------|------|---------|
| Puck content 渲染 | Puck 内部使用 React JSX 渲染，自带 XSS 防护 | 🟢 安全 |
| 静态 HTML 导出 | `renderStaticHtml` 可能直接将用户 content 写入 HTML | 🔴 P0 — 需使用 DOMPurify 消毒 |
| Title/Description | 直接字符串渲染到页面 | 🟡 需确认 React 默认转义行为 |

### 4.4 文件上传安全

| 检查项 | 现状 | 风险等级 |
|--------|------|---------|
| MIME 白名单 | ✅ 限 JPEG/PNG/GIF/WebP/SVG | 🟢 有效但需注意 SVG XSS 风险 |
| 文件大小限制 | ✅ 10MB | 🟢 合理 |
| 文件扩展名 | ⚠️ 使用原始扩展名 | 🟡 建议完全随机化 UUID 文件名（当前已用 UUID，安全） |
| SVG 安全 | ⚠️ SVG 允许上传 | 🟡 SVG 可内嵌 script 标签，需扫描消毒 |
| 上传目录访问 | ✅ `/uploads` 静态服务 | 🟢 但建议限制为仅可访问图片类型 |

### 4.5 认证授权

| 检查项 | 现状 | 风险等级 |
|--------|------|---------|
| RBAC | ❌ 无 | 🔴 P0 — `role` 字段存在但从未验证，所有登录用户拥有全部权限 |
| 密码强度 | ⚠️ 仅 6 字符下限 | 🟡 P1 — 建议 8+ 字符 + 复杂度要求 |
| bcrypt 轮数 | 10 rounds | 🟢 可接受 |
| 注册开放 | 任意用户可注册 | 🟡 生产环境应限制注册（邀请码或管理员审批） |

---

## 5️⃣ 代码质量

### 5.1 TypeScript 严格度

| 配置 | 状态 | 评价 |
|------|------|------|
| `strict: true` | ✅ 已启用 | 好 |
| `noUnusedLocals: true` | ✅ 已启用 | 好 |
| `noUnusedParameters: true` | ✅ 已启用 | 好 |
| `noFallthroughCasesInSwitch: true` | ✅ 已启用 | 好 |
| `exactOptionalPropertyTypes` | ❌ 未启用 | 🟡 P2 — 启用可捕获更多类型错误 |
| `verbatimModuleSyntax: true` | ✅ 已启用 | 好 |
| **后端无 TypeScript** | ❌ 全部 server/ 代码为 JS | 🔴 P0 — 类型安全仅覆盖前端 |

### 5.2 错误处理模式

| 层面 | 现状 | 评价 |
|------|------|------|
| 前端 API 错误 | `ApiClientError` 统一封装 | 🟢 好 |
| 后端全局错误 | Express 5 错误中间件，统一 JSON 格式 | 🟢 好 |
| 未捕获异常 | Node.js 无 `process.on('uncaughtException')` 或 `unhandledRejection` | 🔴 P0 — 未捕获异常会导致进程退出 |
| 优雅关闭 | 无 SIGTERM/SIGINT 处理 | 🔴 P0 — Docker 停止时无法安全关闭数据库连接 |

**改进方案**:
```javascript
process.on('uncaughtException', (err) => {
  console.error('[fatal] Uncaught exception:', err)
  // 尝试优雅关闭
  server.close(() => process.exit(1))
  // 强制退出
  setTimeout(() => process.exit(1), 5000).unref()
})
process.on('unhandledRejection', (reason) => {
  console.error('[fatal] Unhandled rejection:', reason)
})
process.on('SIGTERM', () => {
  console.log('[server] SIGTERM received, shutting down...')
  server.close(() => process.exit(0))
})
```

### 5.3 日志系统

**当前**: 仅 `console.log` / `console.error`，无结构化日志、无日志级别、无日志轮转。

**生产级方案**: 集成 pino（最快 Node.js logger）：
```
pino@^9.0.0 (零依赖)
├── pino-pretty (开发环境格式化)
├── 生产: JSON 格式输出 stdout → Docker 日志驱动
└── 错误追踪: 自动关联 req.id 请求链路
```

### 5.4 代码规范

| 工具 | 现状 | 风险 |
|------|------|------|
| ESLint | ❌ 无项目级配置 | 🔴 P0 — 空有 TSC 检查，无代码风格/最佳实践校验 |
| Prettier | ❌ 无配置文件 | 🟡 P1 — 代码格式不一致 |
| Husky/lint-staged | ❌ 无 | 🟡 P2 — 无法阻止不合格代码提交 |

### 5.5 测试覆盖

| 测试类型 | 覆盖 | 评价 |
|---------|------|------|
| API 集成测试 | ✅ 核心 CRUD + 二期 API | 🟢 覆盖全面（19+ 测试用例） |
| 单元测试 | ❌ 无 | 🔴 P0 — Repository 层、工具函数完全无测试 |
| 组件测试 | ❌ 无 | 🔴 P0 — 45+ Puck 组件无测试 |
| E2E 测试 | ❌ 无 | 🟡 P2 |
| CI 自动运行 | ❌ 禁用 | 🔴 P0 — 测试脚本被注释 |

---

## 6️⃣ 技术债务

### 6.1 Express 5 兼容性风险

| 问题 | 详情 | 风险等级 |
|------|------|---------|
| Express 5 稳定性 | 截至 2025，Express 5 仍为 beta/早期版本，API 可能变更 | 🟡 P1 |
| Middleware 签名 | Express 5 的异步错误处理签名已变更，当前使用 `asyncHandler` 包装器是正确做法，但所有路由都需要包裹 | 🟡 工作量大 |
| 生态兼容性 | `cors@^2.8.5`、`multer@^2.2.0` 需验证兼容 Express 5 | 🟡 需锁定版本 |
| **建议**: 锁定 Express 5 次版本（`^5.0.1`），避免大版本自动升级破坏兼容性 |

### 6.2 Puck 版本锁定

| 检查项 | 现状 |
|--------|------|
| 当前版本 | `^0.20.1` |
| 升级风险 | Puck 仍处于 0.x 阶段，API 频繁变更 |
| 锁定建议 | 改为 `"@measured/puck": "0.20.1"`（去掉 ^），或使用 lockfile 锁定 |

### 6.3 数据库迁移策略

| 问题 | 现状 | 风险 |
|------|------|------|
| Schema 变更 | db.exec("CREATE TABLE IF NOT EXISTS ...") 幂等 | 能新增表，但无法修改已有表结构 |
| 列追加 | 手动 `ALTER TABLE ADD COLUMN` 检查 | 脆弱，无版本控制 |
| 数据迁移 | 无 | 无法回退 |

**建议**: 引入轻量级迁移工具如 `sqlite3-simple-migrator` 或 `humps` + 手写迁移脚本，迁移文件按时间戳命名并记录到 `_migrations` 表。

### 6.4 API 版本管理

所有 API 都在 `/api/` 下，无版本前缀。建议：
```
前: POST /api/pages
后: POST /api/v1/pages

同时保留旧版本短期兼容: /api/v1/ → Express Router mount
```

### 6.5 其他技术债务

| 项目 | 现状 | 建议 |
|------|------|------|
| 后端没有 TypeScript | server/ 全 JS | 逐步迁移，至少从 middleware 和 repository 层开始 |
| Editor.tsx 760 行 | 耦合 7 种职责 | 拆分为：`useUndoRedo.ts`、`useEditorData.ts`、`EditorToolbar.tsx`、`ThemeSelector.tsx`、`SavedTemplateDialog.tsx` |
| 错误处理用 `window.alert` | 全编辑器用 alert | 替换为 Toast 组件（shadcn 自带 Sonner） |
| `console.log` 残留 | 多处 `.catch(() => {})` | 静默 catch 隐藏真实错误 |

---

## 7️⃣ 企业级优化建议（优先级排序）

---

### 🔴 P0 — 必须立即做（7 项）

#### P0-1：SQLite → 生产级数据库评估 + 备份策略
| 字段 | 内容 |
|------|------|
| 问题 | SQLite 不适合生产环境多用户并发场景，且无高可用、无备份 |
| 风险 | 🔴 数据丢失 / 服务不可用 |
| 方案 | **短期**（1周）：实现 SQLite 日/周双轨备份脚本 + 自动上传对象存储；**长期**（2-3月）：评估迁移到 PostgreSQL（可考虑 CloudBase PG 模式） |
| 工作量 | 短期 2人天 / 长期 10人天 |

#### P0-2：强制 HTTPS + CORS 加固 + HTTP 安全头
| 字段 | 内容 |
|------|------|
| 问题 | 无 HTTPS、CORS 全开放、无安全头 |
| 风险 | 🔴 数据泄露 / XSS / CSRF |
| 方案 | 配置 Let's Encrypt SSL 证书；CORS 限制白名单；集成 `helmet` 中间件；nginx 禁止 server_tokens |
| 工作量 | 2人天 |

#### P0-3：JWT 安全加固
| 字段 | 内容 |
|------|------|
| 问题 | 硬编码密钥、7 天过期、无 refresh token |
| 风险 | 🔴 Token 泄露可永久访问 |
| 方案 | 引入双 Token 机制（15min access + 7d refresh）；密钥从环境变量强制读取；增加 Token 黑名单能力 |
| 工作量 | 3人天 |

#### P0-4：进程级可靠性（优雅关闭 + 未捕获异常处理）
| 字段 | 内容 |
|------|------|
| 问题 | 无 SIGTERM 处理、无 uncaughtException |
| 风险 | 🔴 进程异常退出导致连接未关闭、数据未保存 |
| 方案 | server/index.js 添加 `process.on('SIGTERM')` 优雅关闭 + `uncaughtException` 兜底退出 |
| 工作量 | 1人天 |

#### P0-5：添加 `.dockerignore` + Dockerfile 安全加固
| 字段 | 内容 |
|------|------|
| 问题 | 构建上下文包含敏感文件和 node_modules |
| 风险 | 🔴 凭据泄露 / 构建缓慢 |
| 方案 | 创建 `.dockerignore`（含 .git, node_modules, .env, server/data）；Dockerfile 使用非 root 用户 |
| 工作量 | 1人天 |

#### P0-6：CI 恢复测试执行 + 代码质量门禁
| 字段 | 内容 |
|------|------|
| 问题 | CI 测试注释、类型检查静默通过 |
| 风险 | 🔴 代码质量问题无法阻挡 |
| 方案 | 恢复 npm test 步骤；tsc 检查去掉 `|| echo`；集成 ESLint 检查 |
| 工作量 | 1人天 |

#### P0-7：RBAC 权限控制
| 字段 | 内容 |
|------|------|
| 问题 | 所有登录用户拥有全部权限（role 字段存在但不使用） |
| 风险 | 🔴 越权操作 |
| 方案 | 实现权限中间件 `requireRole('admin')`；管理后台页面增加权限校验 |
| 工作量 | 3人天 |

---

### 🟡 P1 — 应该尽快做（8 项）

#### P1-1：Editor.tsx 重构与模块拆分
| 字段 | 内容 |
|------|------|
| 问题 | 760 行单文件耦合 7 种职责 |
| 风险 | 🟡 难以维护、测试、扩展 |
| 方案 | 拆分出 `useUndoRedo.ts`、`EditorToolbar.tsx`、`ThemeSelector.tsx`、`ComponentTree.tsx` 等独立模块 |
| 工作量 | 3人天 |

#### P1-2：数据库索引优化
| 字段 | 内容 |
|------|------|
| 问题 | 5 张表均无二级索引 |
| 风险 | 🟡 大数据量下查询性能恶化 |
| 方案 | 为 status、deleted_at、updated_at、page_id 等字段添加索引 |
| 工作量 | 1人天 |

#### P1-3：引入结构化日志（pino）
| 字段 | 内容 |
|------|------|
| 问题 | console.log 无法生产运维 |
| 风险 | 🟡 无法排查问题 |
| 方案 | 集成 pino，开发用 pino-pretty，生产输出 JSON 到 stdout |
| 工作量 | 1人天 |

#### P1-4：路由级懒加载
| 字段 | 内容 |
|------|------|
| 问题 | 所有页面组件全部打包在主 bundle 中 |
| 风险 | 🟡 首屏加载慢 |
| 方案 | 使用 `React.lazy()` + `Suspense` 按路由拆分 |
| 工作量 | 1人天 |

#### P1-5：单元测试基础设施
| 字段 | 内容 |
|------|------|
| 问题 | 仅 API 集成测试，无单元测试 |
| 风险 | 🟡 代码重构无安全网 |
| 方案 | 搭建 vitest + React Testing Library；从 Repository 层和工具函数开始补测试 |
| 工作量 | 5人天 |

#### P1-6：Express 5 版本锁定 + 兼容性审计
| 字段 | 内容 |
|------|------|
| 问题 | Express 5 早期版本 API 不稳定 |
| 风险 | 🟡 大版本升级可能破坏代码 |
| 方案 | 锁定 `"express": "5.0.1"` 精确版本；审计所有 middleware 兼容性 |
| 工作量 | 1人天 |

#### P1-7：静态导出 HTML 消毒
| 字段 | 内容 |
|------|------|
| 问题 | 用户 content 直接写入 HTML 可能 XSS |
| 风险 | 🟡 导出的 HTML 页面存在 XSS 风险 |
| 方案 | 在 `renderStaticHtml` 中引入 `DOMPurify.sanitize()` |
| 工作量 | 1人天 |

#### P1-8：多环境配置 + 环境变量 Zod 验证
| 字段 | 内容 |
|------|------|
| 问题 | 开发/测试/生产配置混杂，硬编码默认值 |
| 风险 | 🟡 配置错误导致安全问题 |
| 方案 | 使用 `dotenv` + 多 `.env.{env}` 文件 + Zod 运行时验证环境变量完整性 |
| 工作量 | 2人天 |

---

### 🔵 P2 — 值得做（6 项）

| ID | 项目 | 工作量 | 说明 |
|----|------|--------|------|
| P2-1 | Docker 镜像安全扫描 (Trivy/Docker Scout) | 1人天 | 集成到 CI pipeline |
| P2-2 | 监控告警 (cAdvisor + Prometheus + 宕机检测) | 3人天 | Docker 级别 + 应用级别 |
| P2-3 | 蓝绿部署 / 滚动更新 | 3人天 | 零停机部署替换 `--force-recreate` |
| P2-4 | ESLint + Prettier + Husky 标准化 | 2人天 | 代码规范基础设施 |
| P2-5 | API 版本管理（/api/v1/） + 接口文档 | 3人天 | 便于向后兼容 |
| P2-6 | SVG 上传安全扫描 + 文件类型魔数校验 | 1人天 | 防止伪装文件 |

---

## 📊 总评

```
安全风险:      ██████████ 10/10 (6 项 P0 安全相关)
数据风险:      ████████░░  8/10 (SQLite 无备份)
构建风险:      ████████░░  8/10 (CI 测试禁用、Docker 不完善)
代码质量:      ██████░░░░  6/10 (无 ESLint、无单元测试)
性能风险:      ████░░░░░░  4/10 (尚可但可优化)
文档风险:      ████████░░  8/10 (环境配置、部署流程缺乏文档)

优先处理:      7 项 P0 → 8 项 P1 → 6 项 P2
总计工作量:    约 50-60 人天 (约 3-4 人工作一个月)
```

> **结论**: 项目核心功能（可视化编辑、页面管理、主题/模板）质量良好，但 **距离企业级生产交付仍有显著差距**。7 项 P0 问题涉及安全、数据可靠性、基础架构，建议在正式上线前优先解决。数据库选型（SQLite）是最根本的架构决策，建议在 2-3 个月内完成到 PostgreSQL 的迁移评估。
