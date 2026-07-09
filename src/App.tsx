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
const Login = lazy(() => import("@/pages/Login"))
const VersionHistory = lazy(() => import("@/pages/admin/VersionHistory"))
const FormSubmissions = lazy(() => import("@/pages/admin/FormSubmissions"))
const AuthGuard = lazy(() => import("@/components/AuthGuard"))
const Onboarding = lazy(() => import("@/pages/Onboarding"))

const SPINNER = (
  <div className="flex items-center justify-center min-h-screen page-enter">
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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Login />} />
          <Route path="/pricing" element={<Home />} />

          {/* 引导流程 */}
          <Route
            path="/onboarding"
            element={
              <AuthGuard>
                <Onboarding />
              </AuthGuard>
            }
          />

          {/* 受保护的管理路由 */}
          <Route
            path="/admin"
            element={
              <AuthGuard>
                <AdminList />
              </AuthGuard>
            }
          />
          <Route
            path="/admin/create"
            element={
              <AuthGuard>
                <AdminCreate />
              </AuthGuard>
            }
          />
          <Route
            path="/admin/version-history"
            element={
              <AuthGuard>
                <VersionHistory />
              </AuthGuard>
            }
          />
          <Route
            path="/admin/form-submissions"
            element={
              <AuthGuard>
                <FormSubmissions />
              </AuthGuard>
            }
          />

          <Route path="/editor" element={<Editor />} />
          <Route path="/editor/:pageId" element={<Editor />} />
          <Route path="/preview" element={<Preview />} />
          <Route path="/preview/:pageId" element={<Preview />} />

          {/* 二期主题路由 */}
          <Route
            path="/admin/themes"
            element={
              <AuthGuard>
                <ThemeList />
              </AuthGuard>
            }
          />
          <Route
            path="/admin/themes/create"
            element={
              <AuthGuard>
                <ThemeCreateEdit />
              </AuthGuard>
            }
          />
          <Route
            path="/admin/themes/import"
            element={
              <AuthGuard>
                <ThemeImport />
              </AuthGuard>
            }
          />
          <Route
            path="/admin/themes/:id/edit"
            element={
              <AuthGuard>
                <ThemeCreateEdit />
              </AuthGuard>
            }
          />

          {/* 二期媒体路由 */}
          <Route
            path="/admin/media"
            element={
              <AuthGuard>
                <MediaList />
              </AuthGuard>
            }
          />

          {/* 二期模板路由 */}
          <Route
            path="/admin/templates"
            element={
              <AuthGuard>
                <TemplateList />
              </AuthGuard>
            }
          />
          <Route
            path="/admin/templates/create-from-page"
            element={
              <AuthGuard>
                <TemplateCreateFromPage />
              </AuthGuard>
            }
          />
        </Routes>
      </Suspense>
    </div>
  )
}
