// src/pages/Onboarding.tsx
// 注册后引导流程：三步向导

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { isAuthenticated } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const TEMPLATES = [
  {
    id: "landing",
    name: "SaaS Landing",
    description: "Modern SaaS product landing page",
    gradient: "from-violet-500 to-purple-700",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Clean portfolio layout",
    gradient: "from-emerald-400 to-cyan-600",
  },
  {
    id: "blog",
    name: "Blog Post",
    description: "Typography-first blog design",
    gradient: "from-amber-400 to-orange-600",
  },
  {
    id: "contact",
    name: "Contact Page",
    description: "Functional contact form layout",
    gradient: "from-rose-400 to-pink-600",
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Guard: redirect if not authenticated
  if (!isAuthenticated()) {
    navigate("/login", { replace: true })
    return null
  }

  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true")
    if (selectedTemplate) {
      navigate(`/admin/templates?apply=${selectedTemplate}`, { replace: true })
    } else {
      navigate("/admin", { replace: true })
    }
  }

  return (
    <div className="page-enter flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 pt-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-2 rounded-full transition-colors ${
                s === step
                  ? "bg-primary"
                  : s < step
                    ? "bg-primary/40"
                    : "bg-muted"
              }`}
            />
          ))}
        </div>

        <CardHeader className="text-center">
          {step === 1 && (
            <>
              <span className="text-4xl">👋</span>
              <CardTitle className="mt-4 text-2xl">
                Welcome to PageForge!
              </CardTitle>
              <CardDescription className="mt-2">
                Build beautiful pages without code. Drag, drop, and publish
                in minutes. Let&apos;s get you started on your first page.
              </CardDescription>
            </>
          )}
          {step === 2 && (
            <>
              <span className="text-4xl">🎨</span>
              <CardTitle className="mt-4 text-2xl">
                Choose a template
              </CardTitle>
              <CardDescription className="mt-2">
                Pick a starting template to speed things up. You can always
                customize everything later.
              </CardDescription>
            </>
          )}
          {step === 3 && (
            <>
              <span className="text-4xl">🚀</span>
              <CardTitle className="mt-4 text-2xl">
                You&apos;re all set!
              </CardTitle>
              <CardDescription className="mt-2">
                You&apos;re ready to start building. Head to the editor to
                create your first page.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <div className="flex justify-center">
              <Button size="lg" onClick={() => setStep(2)}>
                Let&apos;s build your first page
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`overflow-hidden rounded-lg border-2 text-left transition-all hover:shadow-md ${
                    selectedTemplate === t.id
                      ? "border-primary"
                      : "border-border"
                  }`}
                  onClick={() => setSelectedTemplate(t.id)}
                >
                  <div
                    className={`h-16 bg-gradient-to-br ${t.gradient} flex items-center justify-center`}
                  >
                    <span className="text-2xl font-bold text-white/80">
                      {t.name.charAt(0)}
                    </span>
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.description}
                    </p>
                  </div>
                </button>
              ))}
              <div className="col-span-2 mt-2 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!selectedTemplate}
                >
                  {selectedTemplate ? "Continue" : "Select a template"}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex justify-center">
              <Button size="lg" onClick={handleComplete}>
                Start editing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
