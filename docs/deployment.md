# 部署指南

## Docker 方式（推荐）
```bash
docker-compose up -d
```
访问 http://localhost

## 手动部署
```bash
npm run build
NODE_ENV=production PORT=3000 node server/index.js
```
访问 http://localhost:3000

## 环境变量（见 .env.example）
PORT, DATABASE_PATH, UPLOAD_DIR, SESSION_SECRET, JWT_SECRET, ...

## CI/CD
推送 main 分支自动触发 GitHub Actions：test → build & push → deploy
