# 可视化页面编辑器

基于 React 19 + Vite 6 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui + @measured/puck 构建的企业级可视化页面搭建系统。

## 技术栈
- 前端：React 19, Vite 6, TypeScript 5, Tailwind CSS v4, shadcn/ui, @measured/puck
- 后端：Express, better-sqlite3
- 部署：Docker, Nginx

## 快速开始
```bash
# 安装依赖
npm install

# 开发（前端+后端同时启动）
npm run dev:all

# 构建生产
npm run build
```

## 项目结构
```
my-app/
├── src/                    # 前端源码
│   ├── components/         # 通用 UI 组件
│   ├── puck/               # Puck 编辑器
│   │   ├── components/     # Puck 组件（basic/layout/display/form/advanced）
│   │   └── theme/          # 主题系统
│   ├── pages/              # 页面
│   │   ├── admin/          # 管理后台（Themes/Media/Templates）
│   │   └── ... Editor, Preview, Home, About
│   ├── lib/                # API 封装
│   ├── types/              # TypeScript 类型
│   └── App.tsx             # 路由
├── server/                 # 后端
│   ├── repositories/       # 数据访问层
│   ├── routes/             # API 路由（pages/editor/themes/media/templates）
│   ├── utils/              # 工具函数（slug, renderStaticHtml）
│   └── index.js            # 入口
├── docs/                   # 文档
├── tests/                  # 集成测试
├── nginx/                  # Nginx 配置
├── .github/workflows/      # CI/CD
├── Dockerfile
└── docker-compose.yml
```

## 功能
- 30 个可视化组件（拖拽编辑 + 属性配置）
- 管理后台（页面 CRUD/发布/复制/软删恢复/SEO）
- 主题系统（CSS 变量 + 导入导出 + 预设 5 主题）
- 媒体管理（上传/选择器）
- 模板系统（预设 5 模板 + 从页面保存）
- 静态 HTML 导出
- 响应式设备预览
