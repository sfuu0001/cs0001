// vite-plugin-component-scanner.ts
// Vite 插件：在 dev server 启动 / build 时扫描 BYO 组件并生成 registry

import type { Plugin } from "vite"
import { scanComponents } from "./src/lib/component-scanner/index"

interface PageforgePluginOptions {
  /** 自定义扫描目录 */
  scanDirs?: string[]
  /** 排除模式 */
  excludePatterns?: string[]
  /** 是否在控制台输出扫描详情 */
  verbose?: boolean
}

export function pageforgeComponentScanner(
  options: PageforgePluginOptions = {},
): Plugin {
  const verbose = options.verbose ?? false

  return {
    name: "pageforge-component-scanner",
    enforce: "pre",

    buildStart() {
      const root = process.cwd()
      const startTime = Date.now()

      if (verbose) {
        // eslint-disable-next-line no-console
        console.log("[pageforge-scanner] 开始扫描组件...")
      }

      const { components, warnings } = scanComponents(root, {
        scanDirs: options.scanDirs,
        excludePatterns: options.excludePatterns,
      })

      const elapsed = Date.now() - startTime

      if (verbose) {
        // eslint-disable-next-line no-console
        console.log(
          `[pageforge-scanner] 扫描完成: ${components.length} 个组件, ${warnings.length} 条警告, 耗时 ${elapsed}ms`,
        )
      }

      if (warnings.length > 0) {
        for (const warn of warnings) {
          console.warn(`[pageforge-scanner] ${warn}`)
        }
      }
    },
  }
}
