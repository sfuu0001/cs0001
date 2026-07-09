import React from "react"

interface 更新后的标题Props {
  className?: string
}

export default function 更新后的标题({ className }: 更新后的标题Props) {
  return (
    <div className={"max-w-7xl mx-auto px-4 py-8" + (className ? " " + className : "")}>
<h1 className="font-bold text-foreground text-4xl">预览内容</h1>
    </div>
  )
}
