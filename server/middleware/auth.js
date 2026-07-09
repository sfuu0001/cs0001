// server/middleware/auth.js
// JWT 验证中间件：验证 Authorization: Bearer <token>，将用户信息挂载到 req.user。

import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "my-app-jwt-secret-dev"

/**
 * JWT 验证中间件。
 * 验证通过后将解码后的 payload 挂载到 req.user。
 * 验证失败返回 401。
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null

  if (!token) {
    return res.status(401).json({
      error: "unauthorized",
      message: "未提供认证令牌",
    })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({
      error: "invalid_token",
      message: "令牌无效或已过期",
    })
  }
}

export { JWT_SECRET }
