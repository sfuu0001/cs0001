import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function About() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>关于</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          这是一个演示项目，集成了路由（React Router）、组件库（shadcn/ui）和后端
          API（Express）。
        </CardContent>
      </Card>
    </div>
  )
}
