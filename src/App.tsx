import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router-dom"

import { Navbar } from "@/components/Navbar"
import Home from "@/pages/Home"
import About from "@/pages/About"
// Preview / Home / About 保持同步（URL 直达场景，不要延迟）
import Preview from "@/pages/Preview"

// 路由懒加载：admin / editor 页面
const AdminList = lazy(() => import("@/pages/admin/List"))
const AdminCreate = lazy(() => import("@/pages/admin/Create"))
const Editor = lazy(() => import("@/pages/Editor"))
const ThemeList = lazy(() => import("@/pages/admin/Themes/List"))
const ThemeCreateEdit = lazy(() => import("@/pages/admin/Themes/CreateEdit"))
const ThemeImport = lazy(() => import("@/pages/admin/Themes/ImportTheme"))
const MediaList = lazy(() => import("@/pages/admin/Media/List"))
const TemplateList = lazy(() => import("@/pages/admin/Templates/List"))
const TemplateCreateFromPage = lazy(() => import("@/pages/admin/Templates/CreateFromPage"))

const SPINNER = (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
)

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Suspense fallback={SPINNER}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/admin" element={<AdminList />} />
          <Route path="/admin/create" element={<AdminCreate />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/editor/:pageId" element={<Editor />} />
          <Route path="/preview" element={<Preview />} />
          <Route path="/preview/:pageId" element={<Preview />} />

          {/* 二期主题路由 */}
          <Route path="/admin/themes" element={<ThemeList />} />
          <Route path="/admin/themes/create" element={<ThemeCreateEdit />} />
          <Route path="/admin/themes/import" element={<ThemeImport />} />
          <Route path="/admin/themes/:id/edit" element={<ThemeCreateEdit />} />

          {/* 二期媒体路由 */}
          <Route path="/admin/media" element={<MediaList />} />

          {/* 二期模板路由 */}
          <Route path="/admin/templates" element={<TemplateList />} />
          <Route path="/admin/templates/create-from-page" element={<TemplateCreateFromPage />} />
        </Routes>
      </Suspense>
    </div>
  )
}
