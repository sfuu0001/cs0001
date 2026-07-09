import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Home() {
  const [message, setMessage] = useState("")
  const [count, setCount] = useState(0)

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("（后端未启动）"))
  }, [])

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>首页</CardTitle>
          <CardDescription>
            React + Vite + TS + Tailwind + Router + shadcn/ui
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            来自后端：{message || "加载中…"}
          </p>
          <div className="flex items-center gap-3">
            <Button onClick={() => setCount((c) => c + 1)}>计数 {count}</Button>
            <Button variant="outline" onClick={() => setCount(0)}>
              重置
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
