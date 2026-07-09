import React from "react"

interface 主题测试页Props {
  className?: string
}

export default function 主题测试页({ className }: 主题测试页Props) {
  return (
    <div className={"max-w-7xl mx-auto px-4 py-8" + (className ? " " + className : "")}>
      {/* 页面内容为空 */}
    </div>
  )
}
