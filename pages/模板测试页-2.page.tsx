import React from "react"

interface 模板测试页Props {
  className?: string
}

export default function 模板测试页({ className }: 模板测试页Props) {
  return (
    <div className={"max-w-7xl mx-auto px-4 py-8" + (className ? " " + className : "")}>
      {/* 页面内容为空 */}
    </div>
  )
}
