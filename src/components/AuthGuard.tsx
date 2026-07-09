// src/components/AuthGuard.tsx
// 路由守卫：检查 isAuthenticated，未登录重定向 /login。

import { useEffect, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { isAuthenticated } from "@/lib/auth"

interface AuthGuardProps {
  children: ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login", { replace: true })
    }
  }, [navigate])

  if (!isAuthenticated()) {
    return null
  }

  return <>{children}</>
}
