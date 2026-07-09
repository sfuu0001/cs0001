# =============================================================================
# Dockerfile — 全栈单容器方案 (API + 前端静态)
# 多阶段构建：build → production
# =============================================================================

# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# 先复制依赖描述文件，利用 Docker 缓存层
COPY package*.json ./
RUN npm ci

# 复制源码并构建前端
COPY . .
RUN npm run build

# ---- Production Stage ----
FROM node:22-alpine

WORKDIR /app

# 安装生产依赖（仅运行时，不含 devDependencies）
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# 复制后端服务代码
COPY server/ server/

# 从构建阶段复制前端构建产物
COPY --from=builder /app/dist dist/

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-3000}/api/hello', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

EXPOSE 3000

CMD ["node", "server/index.js"]
