// src/lib/export.ts
// JSON 文件导出工具函数。

/**
 * 将 JS 对象下载为 JSON 文件。
 * @param data - 要导出的数据
 * @param filename - 导出的文件名（不含 .json）
 */
export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `${filename.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fff]/g, "_")}.json`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
