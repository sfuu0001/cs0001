import React from "react"

interface 分页测试8Props {
  className?: string
}

export default function 分页测试8({ className }: 分页测试8Props) {
  return (
    <div className={"max-w-7xl mx-auto px-4 py-8" + (className ? " " + className : "")}>
      {/* 页面内容为空 */}
    </div>
  )
}
