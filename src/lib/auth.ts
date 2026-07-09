// src/lib/auth.ts
// JWT 认证工具函数：token 存取 / 鉴权判断。

const TOKEN_KEY = "app-auth-token"
const USER_KEY = "app-auth-user"

export interface AuthUser {
  id: string
  username: string
  email: string
  role: string
}

/** 获取存储的 token */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/** 设置存储的 token */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

/** 移除存储的 token 及用户信息 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/** 获取存储的用户信息 */
export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

/** 存储用户信息 */
export function setStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/** 判断是否已认证 */
export function isAuthenticated(): boolean {
  return !!getToken()
}
