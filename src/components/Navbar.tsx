import { NavLink } from "react-router-dom"

import { cn } from "@/lib/utils"

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-md px-3 py-2 text-sm transition-colors",
    isActive
      ? "bg-accent font-medium text-accent-foreground"
      : "text-muted-foreground hover:text-foreground"
  )

export function Navbar() {
  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <span className="text-lg font-bold">My App</span>
        <div className="flex flex-wrap gap-1">
          <NavLink to="/" className={linkClass}>
            首页
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            关于
          </NavLink>
          <NavLink to="/admin" className={linkClass}>
            页面管理
          </NavLink>
          <NavLink to="/admin/themes" className={linkClass}>
            主题管理
          </NavLink>
          <NavLink to="/admin/media" className={linkClass}>
            媒体库
          </NavLink>
          <NavLink to="/admin/templates" className={linkClass}>
            模板库
          </NavLink>
          <NavLink to="/admin/create" className={linkClass}>
            创建页面
          </NavLink>
          <NavLink to="/editor" className={linkClass}>
            编辑器
          </NavLink>
          <NavLink to="/preview" className={linkClass}>
            预览
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
