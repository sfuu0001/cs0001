// src/pages/Login.tsx
// 登录/注册页面：双 tab 切换表单，调用 JWT 认证接口。

import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { setToken, setStoredUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Mode = "login" | "register"

async function apiPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error((data as { message?: string }).message || "请求失败")
  }
  return data
}

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get("redirect") || "/admin"
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login"

  const [mode, setMode] = useState<Mode>(initialMode)

  // 登录字段
  const [loginUsername, setLoginUsername] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // 注册字段
  const [regUsername, setRegUsername] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!loginUsername.trim() || !loginPassword) {
      setError("请填写用户名和密码")
      return
    }
    setLoading(true)
    try {
      const data = (await apiPost("/api/auth/login", {
        username: loginUsername.trim(),
        password: loginPassword,
      })) as { token: string; user: { id: string; username: string; email: string; role: string } }
      setToken(data.token)
      setStoredUser({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role,
      })
      window.dispatchEvent(new Event("auth-change"))
      toast.success("Welcome back!")
      navigate(redirect, { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!regUsername.trim() || !regEmail.trim() || !regPassword) {
      setError("请填写所有字段")
      return
    }
    setLoading(true)
    try {
      const data = (await apiPost("/api/auth/register", {
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
      })) as { token: string; user: { id: string; username: string; email: string; role: string } }
      setToken(data.token)
      setStoredUser({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role,
      })
      window.dispatchEvent(new Event("auth-change"))
      toast.success("Account created successfully!")

      // Check if first-time user → go to onboarding
      const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding")
      if (!hasSeenOnboarding) {
        navigate("/onboarding", { replace: true })
      } else {
        navigate(redirect, { replace: true })
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-enter mx-auto mt-12 max-w-md p-4">
      {/* Brand */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-primary">PageForge</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build your next landing page in minutes, not days.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {mode === "login" ? "Sign in" : "Create account"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tab 切换 */}
          <div className="flex rounded-md border border-input p-0.5">
            <button
              type="button"
              className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "login"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => { setMode("login"); setError("") }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "register"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => { setMode("register"); setError("") }}
            >
              Sign up
            </button>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Username</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => { setMode("register"); setError("") }}
                >
                  Sign up
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Username</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="At least 2 characters"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account…" : "Create account"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Already registered?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => { setMode("login"); setError("") }}
                >
                  Log in
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
