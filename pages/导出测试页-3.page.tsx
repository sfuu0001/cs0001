import React from "react"

interface 导出测试页Props {
  className?: string
}

export default function 导出测试页({ className }: 导出测试页Props) {
  return (
    <div className={"max-w-7xl mx-auto px-4 py-8" + (className ? " " + className : "")}>
<h1 className="font-bold text-foreground text-4xl">导出内容</h1>
    </div>
  )
}
