// server/middleware/rateLimit.js
// 基于 IP 的内存速率限制中间件。每分钟每 IP 最多 100 次请求，超限返回 429。

const WINDOW_MS = 60 * 1000 // 1 分钟窗口
const MAX_REQUESTS = 100

/** 内存存储：IP -> { count, resetAt } */
const ipMap = new Map()

// 每分钟清理过期条目
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of ipMap) {
    if (entry.resetAt <= now) {
      ipMap.delete(ip)
    }
  }
}, WINDOW_MS)

/**
 * 速率限制中间件。
 * 对每个 IP 限制每分钟 MAX_REQUESTS 次。
 */
export function rateLimit(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || "unknown"
  const now = Date.now()

  let entry = ipMap.get(ip)
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + WINDOW_MS }
    ipMap.set(ip, entry)
  }

  entry.count += 1

  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: "too_many_requests",
      message: "请求过于频繁，请稍后再试",
    })
  }

  next()
}
