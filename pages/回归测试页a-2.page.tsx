import React from "react"

interface 回归测试页AProps {
  className?: string
}

export default function 回归测试页A({ className }: 回归测试页AProps) {
  return (
    <div className={"max-w-7xl mx-auto px-4 py-8" + (className ? " " + className : "")}>
      {/* 页面内容为空 */}
    </div>
  )
}
