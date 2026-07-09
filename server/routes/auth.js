// server/routes/auth.js
// 用户认证路由：注册 / 登录 / 获取当前用户信息。

import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { randomUUID } from "node:crypto"
import { db } from "../db.js"
import { authenticateToken, JWT_SECRET } from "../middleware/auth.js"

const router = express.Router()

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

const SALT_ROUNDS = 10
const TOKEN_EXPIRY = "7d"

// POST /api/auth/register — 注册
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { username, email, password } = req.body || {}

    // 校验
    if (!username || typeof username !== "string" || username.trim().length < 2) {
      return res.status(400).json({
        error: "invalid_username",
        message: "用户名至少 2 个字符",
      })
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({
        error: "invalid_email",
        message: "请输入有效的邮箱地址",
      })
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        error: "invalid_password",
        message: "密码至少 6 个字符",
      })
    }

    const trimmedUsername = username.trim()
    const trimmedEmail = email.trim().toLowerCase()

    // 检查用户名是否已存在
    const existingUser = db
      .prepare("SELECT id FROM users WHERE username = ? OR email = ?")
      .get(trimmedUsername, trimmedEmail)
    if (existingUser) {
      return res.status(409).json({
        error: "user_exists",
        message: "用户名或邮箱已被注册",
      })
    }

    // 哈希密码
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const id = randomUUID()
    const now = new Date().toISOString()

    db.prepare(
      `INSERT INTO users (id, username, email, password_hash, role, created_at)
       VALUES (?, ?, ?, ?, 'user', ?)`
    ).run(id, trimmedUsername, trimmedEmail, passwordHash, now)

    // 签发 token
    const token = jwt.sign(
      { userId: id, username: trimmedUsername, role: "user" },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    )

    res.status(201).json({
      token,
      user: { id, username: trimmedUsername, email: trimmedEmail, role: "user" },
    })
  })
)

// POST /api/auth/login — 登录
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body || {}

    if (!username || !password) {
      return res.status(400).json({
        error: "missing_fields",
        message: "请输入用户名和密码",
      })
    }

    const user = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username.trim())

    if (!user) {
      return res.status(401).json({
        error: "invalid_credentials",
        message: "用户名或密码错误",
      })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({
        error: "invalid_credentials",
        message: "用户名或密码错误",
      })
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    )

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })
  })
)

// GET /api/auth/me — 获取当前用户信息（需要认证）
router.get(
  "/me",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = db
      .prepare("SELECT id, username, email, role, created_at FROM users WHERE id = ?")
      .get(req.user.userId)

    if (!user) {
      return res.status(404).json({
        error: "user_not_found",
        message: "用户不存在",
      })
    }

    res.json({ user })
  })
)

export default router
