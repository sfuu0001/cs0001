import { readFileSync } from "node:fs"
import { createServer } from "node:net"
import { spawn } from "node:child_process"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

/**
 * Default config values used when pageforge.config.ts is missing.
 */
const DEFAULTS = {
  scan: ["src/components", "src/ui"],
  exclude: ["**/__tests__/**", "**/*.stories.*"],
  outputDir: "pages",
  format: "tsx",
  port: 4000,
}

/**
 * pageforge dev — start the development environment.
 *
 * 1. Read pageforge.config.ts from CWD
 * 2. Check port availability (auto-increment if busy)
 * 3. Spawn Vite dev server + API server
 * 4. Open browser & pipe all output to terminal
 */
export async function dev() {
  const cwd = process.cwd()

  // ── Load config ──────────────────────────────────────────────
  const config = await loadConfig(cwd)

  const port = config.dev?.port ?? DEFAULTS.port
  const vitePort = await findAvailablePort(port)
  if (vitePort !== port) {
    console.log(`[pageforge] Port ${port} is in use, using port ${vitePort} instead`)
  }

  // ── Spawn Vite dev server ────────────────────────────────────
  console.log(`[pageforge] Starting Vite dev server on http://localhost:${vitePort}`)

  const viteProcess = spawn(resolve(cwd, "node_modules", ".bin", "vite"), [`--port=${vitePort}`], {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  })

  // ── Spawn API server (port 3001) ─────────────────────────────
  console.log("[pageforge] Starting API server on http://localhost:3001")

  const apiProcess = spawn("node", ["server/index.js"], {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: "3001" },
    shell: true,
  })

  // ── Pipe output ──────────────────────────────────────────────
  viteProcess.stdout.on("data", (data) => process.stdout.write(data))
  viteProcess.stderr.on("data", (data) => process.stderr.write(data))

  apiProcess.stdout.on("data", (data) => process.stdout.write(data))
  apiProcess.stderr.on("data", (data) => process.stderr.write(data))

  // ── Open browser after a short delay ─────────────────────────
  const viteReadyTimeout = setTimeout(() => {
    const url = `http://localhost:${vitePort}`
    console.log(`[pageforge] Opening ${url} in your browser`)

    const platform = process.platform
    if (platform === "darwin") {
      spawn("open", [url])
    } else if (platform === "win32") {
      spawn("cmd", ["/c", "start", url])
    } else {
      spawn("xdg-open", [url])
    }
  }, 2000)

  // ── Cleanup on exit ──────────────────────────────────────────
  function cleanup() {
    clearTimeout(viteReadyTimeout)
    viteProcess.kill()
    apiProcess.kill()
  }

  process.on("SIGINT", () => {
    console.log("\n[pageforge] Shutting down...")
    cleanup()
    process.exit(0)
  })

  process.on("SIGTERM", () => {
    cleanup()
    process.exit(0)
  })

  viteProcess.on("close", (code) => {
    console.log(`[pageforge] Vite server exited with code ${code}`)
    cleanup()
    process.exit(code ?? 0)
  })

  apiProcess.on("close", (code) => {
    console.log(`[pageforge] API server exited with code ${code}`)
  })
}

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Load pageforge.config.ts from the given directory.
 *
 * Strips the `export default` wrapper and evaluates the config object,
 * supporting the simple TS-export format without requiring tsx/ts-node.
 *
 * @param {string} dir
 * @returns {Promise<object>}
 */
async function loadConfig(dir) {
  const configPath = resolve(dir, "pageforge.config.ts")

  let raw
  try {
    raw = readFileSync(configPath, "utf-8")
  } catch {
    console.warn("[pageforge] pageforge.config.ts not found, using defaults")
    return {
      components: { scan: DEFAULTS.scan, exclude: DEFAULTS.exclude },
      output: { dir: DEFAULTS.outputDir, format: DEFAULTS.format },
      dev: { port: DEFAULTS.port },
    }
  }

  // Try dynamic import first (works with tsx runner or Node 22+ --experimental-strip-types)
  try {
    const mod = await import(pathToFileURL(configPath).href)
    return normalizeConfig(mod.default)
  } catch {
    // Fallback: strip `export default` and evaluate the object literal
    // This works because the generated config contains no complex TS syntax.
    const jsCode = raw
      .replace(/^export default /m, "")
      .replace(/:\s*(\w+)/g, ": $1")
      .trim()

    try {
      const obj = eval(`(${jsCode})`)
      return normalizeConfig(obj)
    } catch (evalErr) {
      console.error("[pageforge] Failed to parse pageforge.config.ts:", evalErr.message)
      console.warn("[pageforge] Falling back to defaults")
      return {
        components: { scan: DEFAULTS.scan, exclude: DEFAULTS.exclude },
        output: { dir: DEFAULTS.outputDir, format: DEFAULTS.format },
        dev: { port: DEFAULTS.port },
      }
    }
  }
}

/**
 * Normalize config shape (accepts both nested and flat variants).
 * @param {object} cfg
 * @returns {object}
 */
function normalizeConfig(cfg) {
  if (!cfg || typeof cfg !== "object") {
    return { dev: { port: DEFAULTS.port } }
  }
  return cfg
}

/**
 * Find the first available port starting from `startPort`.
 * Tries up to 10 consecutive ports.
 *
 * @param {number} startPort
 * @returns {Promise<number>}
 */
function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const tryPort = (port) => {
      if (port > startPort + 10) {
        reject(new Error(`No available port found after trying ${startPort}–${port - 1}`))
        return
      }

      const server = createServer()
      server.listen(port, "127.0.0.1", () => {
        server.close(() => resolve(port))
      })
      server.on("error", () => {
        tryPort(port + 1)
      })
    }
    tryPort(startPort)
  })
}
