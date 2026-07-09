import { createInterface } from "node:readline"
import { writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import { stdin as input, stdout as output } from "node:process"

/**
 * pageforge init — interactive scaffolding.
 *
 * Walks the user through a series of prompts (all with sensible defaults)
 * then generates:
 *   - pageforge.config.ts
 *   - pages/ directory
 *   - pages/example.page.tsx
 *
 * Uses readline's asyncIterator pattern for reliable piped‑stdin support.
 */
export async function init() {
  const cwd = process.cwd()
  const rl = createInterface({ input, output })

  try {
    const answers = await collectAnswers(rl, [
      { name: "projectName", prompt: "Project name", default: "my-app" },
      { name: "scanRaw", prompt: "Component scan directories", default: "src/components, src/ui" },
      { name: "outputDirRaw", prompt: "Output directory", default: "pages/" },
      { name: "portStr", prompt: "Port", default: "4000" },
    ])

    const projectName = answers.projectName
    const scanDirs = answers.scanRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const outputDir = answers.outputDirRaw.replace(/\/+$/, "") || "pages"
    const port = Number.parseInt(answers.portStr, 10) || 4000

    // ── Generate pageforge.config.ts ─────────────────────────────
    const configPath = join(cwd, "pageforge.config.ts")
    const configContent = [
      "export default {",
      "  components: {",
      `    scan: [${scanDirs.map((d) => `'${d}'`).join(", ")}],`,
      "    exclude: ['**/__tests__/**', '**/*.stories.*'],",
      "  },",
      "  output: {",
      `    dir: '${outputDir}',`,
      "    format: 'tsx',",
      "  },",
      "  dev: {",
      `    port: ${port},`,
      "  },",
      "}",
      "",
    ].join("\n")

    writeFileSync(configPath, configContent, "utf-8")
    console.log(`  \u2713 生成 pageforge.config.ts`)

    // ── Create output directory ──────────────────────────────────
    const outputPath = join(cwd, outputDir)
    if (!existsSync(outputPath)) {
      mkdirSync(outputPath, { recursive: true })
    }
    console.log(`  \u2713 创建 ${outputDir}/ 目录`)

    // ── Create example page ──────────────────────────────────────
    const examplePath = join(outputPath, "example.page.tsx")
    const exampleContent = [
      "// 这是 PageForge 自动生成的示例页面",
      "// 你可以在这里使用项目中的任意组件",
      "",
      'import React from "react"',
      "",
      "export default function ExamplePage() {",
      "  return (",
      "    <div",
      '      style={{',
      '        padding: "2rem",',
      '        fontFamily: "system-ui, sans-serif",',
      "      }}",
      "    >",
      "      <h1>欢迎使用 PageForge 🎉</h1>",
      "      <p>这是一个示例页面，你可以从这里开始构建。</p>",
      "    </div>",
      "  )",
      "}",
      "",
    ].join("\n")

    writeFileSync(examplePath, exampleContent, "utf-8")
    console.log(`  \u2713 创建 ${outputDir}/example.page.tsx（示例文件）`)

    console.log(`\n  \u2713 initialized`)
  } finally {
    rl.close()
  }
}

/**
 * Walk through an array of question definitions and collect user answers.
 *
 * Uses readline's asyncIterator so it works reliably both in TTY mode
 * (interactive) and when stdin is piped (e.g. echo | pageforge init).
 *
 * @param {import("node:readline").Interface} rl
 * @param {{ name: string, prompt: string, default: string }[]} questions
 * @returns {Promise<Record<string, string>>}
 */
async function collectAnswers(rl, questions) {
  const answers = {}
  const lines = rl[Symbol.asyncIterator]()

  for (const q of questions) {
    const promptText = q.default
      ? `${q.prompt} (${q.default}): `
      : `${q.prompt}: `
    output.write(promptText)

    const { value } = await lines.next()
    answers[q.name] = (value ?? "").trim() || q.default
  }

  return answers
}
