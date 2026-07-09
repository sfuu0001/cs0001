// src/puck/components/display/CodeBlock.tsx
// 代码块展示组件：带行号、语言标签、浅色/深色自适应

import { memo } from "react"
import type { ComponentConfig } from "@measured/puck"

export type CodeBlockProps = {
  code: string
  language: "js" | "jsx" | "ts" | "tsx" | "html" | "css" | "json" | "bash"
  showLineNumbers: "true" | "false"
}

const LANGUAGE_LABELS: Record<CodeBlockProps["language"], string> = {
  js: "JavaScript",
  jsx: "JSX",
  ts: "TypeScript",
  tsx: "TSX",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  bash: "Bash",
}

const CodeBlockRender = memo(function CodeBlockRender({ code, language, showLineNumbers }: CodeBlockProps) {
  const lines = code.split("\n")

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white dark:bg-gray-950 shadow-sm">
      {/* 语言标签栏 */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {LANGUAGE_LABELS[language]}
        </span>
      </div>
      {/* 代码区域 */}
      <div className="overflow-x-auto p-4">
        <pre className="leading-relaxed">
          <code className="font-mono text-sm text-foreground dark:text-gray-200">
            {lines.map((line, i) => (
              <span key={i} className="block">
                {showLineNumbers && (
                  <span className="mr-4 inline-block w-8 text-right text-xs text-muted-foreground/50 select-none">
                    {i + 1}
                  </span>
                )}
                {line || " "}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
})

CodeBlockRender.displayName = "CodeBlockRender"

export const CodeBlock: ComponentConfig<CodeBlockProps> = {
  fields: {
    code: { type: "textarea" },
    language: {
      type: "select",
      options: [
        { label: "JavaScript", value: "js" },
        { label: "JSX", value: "jsx" },
        { label: "TypeScript", value: "ts" },
        { label: "TSX", value: "tsx" },
        { label: "HTML", value: "html" },
        { label: "CSS", value: "css" },
        { label: "JSON", value: "json" },
        { label: "Bash", value: "bash" },
      ],
    },
    showLineNumbers: {
      type: "select",
      options: [
        { label: "是", value: "true" },
        { label: "否", value: "false" },
      ],
    },
  },
  defaultProps: {
    code: 'const greeting = "Hello World!";\nconsole.log(greeting);',
    language: "js",
    showLineNumbers: "true",
  },
  render: (props: CodeBlockProps) => <CodeBlockRender {...props} />,
}
