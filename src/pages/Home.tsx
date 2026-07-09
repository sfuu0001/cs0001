import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// ─── Feature data ──────────────────────────────────────────────────

interface Feature {
  icon: string
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: "🎨",
    title: "Visual Editor",
    description: "Drag and drop interface with real-time preview. Build pages visually without writing a single line of code.",
  },
  {
    icon: "🧩",
    title: "45+ Components",
    description: "Headings, forms, media, layouts and more. Everything you need to build stunning pages out of the box.",
  },
  {
    icon: "🎭",
    title: "Custom Themes",
    description: "Full design system with light/dark mode. Customize colors, fonts, and spacing to match your brand.",
  },
  {
    icon: "⚛️",
    title: "Export to React",
    description: "One click generates clean .tsx code. Take your designs anywhere — no vendor lock-in.",
  },
  {
    icon: "📱",
    title: "Responsive Design",
    description: "Preview on desktop, tablet, and mobile. Every layout looks perfect on every screen size.",
  },
  {
    icon: "🔄",
    title: "Version Control",
    description: "Full page history with one-click restore. Never lose a change with automatic versioning.",
  },
]

// ─── Template data ─────────────────────────────────────────────────

interface TemplateItem {
  title: string
  description: string
  gradient: string
}

const TEMPLATES: TemplateItem[] = [
  {
    title: "SaaS Landing",
    description: "Modern SaaS product page with hero, features, and pricing sections.",
    gradient: "from-violet-500 to-purple-700",
  },
  {
    title: "Portfolio",
    description: "Showcase your work with a clean, minimal portfolio layout.",
    gradient: "from-emerald-400 to-cyan-600",
  },
  {
    title: "Blog Post",
    description: "Clean reading experience with typography-first design.",
    gradient: "from-amber-400 to-orange-600",
  },
  {
    title: "Contact Page",
    description: "Functional contact form with map integration placeholder.",
    gradient: "from-rose-400 to-pink-600",
  },
  {
    title: "Marketing Page",
    description: "High-conversion landing with testimonials and stats.",
    gradient: "from-blue-400 to-indigo-600",
  },
  {
    title: "Documentation",
    description: "Sidebar navigation layout for docs and knowledge base.",
    gradient: "from-slate-400 to-slate-600",
  },
]

// ─── Pricing data ──────────────────────────────────────────────────

interface PricingTier {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  popular?: boolean
}

const PRICING: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started.",
    features: ["5 pages", "Basic templates", "Single user", "Community support"],
    cta: "Get started",
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mo",
    description: "For professionals and small teams.",
    features: ["Unlimited pages", "Custom themes", "3 team members", "Priority support", "Export to React"],
    cta: "Start trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$49",
    period: "/mo",
    description: "For organizations with advanced needs.",
    features: ["Team collaboration", "Audit logs", "SSO integration", "Dedicated support", "Custom integrations"],
    cta: "Contact sales",
  },
]

// ─── Component ─────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="page-enter">
      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:pt-24">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Build beautiful pages.{" "}
              <span className="text-primary">Without code.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Drag-and-drop page builder with 45+ components, custom themes,
              and one-click export to React code.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" onClick={() => navigate("/register")}>
                Get started free
              </Button>
              <Button size="lg" variant="outline" onClick={() => {
                document.getElementById("templates")?.scrollIntoView({ behavior: "smooth" })
              }}>
                See templates
              </Button>
            </div>
          </div>

          {/* Editor mockup */}
          <div className="mt-16 overflow-hidden rounded-xl border bg-card shadow-2xl">
            <div className="flex items-center gap-1.5 border-b bg-muted/50 px-4 py-2.5">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-muted-foreground">editor.pageforge.app</span>
            </div>
            <div className="flex h-72 items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 md:h-96">
              <div className="grid grid-cols-3 gap-3 p-6">
                <div className="h-20 w-20 rounded-lg bg-primary/20" />
                <div className="h-20 w-20 rounded-lg bg-primary/30" />
                <div className="h-20 w-20 rounded-lg bg-primary/20" />
                <div className="h-20 w-20 rounded-lg bg-primary/30" />
                <div className="h-20 w-20 rounded-lg bg-primary/20" />
                <div className="h-20 w-20 rounded-lg bg-primary/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────── */}
      <section className="bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold">
            Everything you need to build pages
          </h2>
          <p className="mt-3 text-center text-muted-foreground">
            A complete toolkit for creating beautiful, responsive pages.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <span className="text-2xl">{f.icon}</span>
                  <CardTitle className="mt-2 text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {f.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Templates Showcase ──────────────────────────────── */}
      <section id="templates" className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold">
            Start with a template
          </h2>
          <p className="mt-3 text-center text-muted-foreground">
            Choose from our library of professionally designed templates.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((t) => (
              <Card
                key={t.title}
                className="overflow-hidden transition-shadow hover:shadow-md"
              >
                <div
                  className={`h-32 bg-gradient-to-br ${t.gradient} flex items-center justify-center`}
                >
                  <span className="text-4xl font-bold text-white/80">
                    {t.title.charAt(0)}
                  </span>
                </div>
                <CardHeader>
                  <CardTitle className="text-base">{t.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {t.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─────────────────────────────────────────── */}
      <section className="bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-center text-muted-foreground">
            No hidden fees. No surprises.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PRICING.map((tier) => (
              <Card
                key={tier.name}
                className={`relative flex flex-col transition-shadow hover:shadow-md ${
                  tier.popular ? "border-primary shadow-lg" : ""
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    <span className="text-sm text-muted-foreground">
                      {tier.period}
                    </span>
                  </div>
                  <CardDescription className="mt-1">
                    {tier.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ul className="mb-6 flex-1 space-y-2">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <span className="text-primary">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={tier.popular ? "default" : "outline"}
                    className="w-full"
                    onClick={() => {
                      if (tier.name === "Enterprise") {
                        window.location.href = "mailto:sales@pageforge.app"
                      } else {
                        navigate("/register")
                      }
                    }}
                  >
                    {tier.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">
            Ready to build your next page?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Join thousands of users who build beautiful pages with PageForge.
          </p>
          <Button size="lg" className="mt-8" onClick={() => navigate("/register")}>
            Get started free — no credit card
          </Button>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="border-t bg-background px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            {/* Brand */}
            <div>
              <h3 className="text-lg font-bold text-primary">PageForge</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Build beautiful pages without code.
              </p>
            </div>
            {/* Product */}
            <div>
              <h4 className="mb-3 text-sm font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate("/login")} className="hover:text-foreground transition-colors">Sign in</button></li>
                <li><button onClick={() => navigate("/register")} className="hover:text-foreground transition-colors">Get started</button></li>
                <li><span className="cursor-default">Templates</span></li>
                <li><span className="cursor-default">Pricing</span></li>
              </ul>
            </div>
            {/* Resources */}
            <div>
              <h4 className="mb-3 text-sm font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="cursor-default">Documentation</span></li>
                <li><span className="cursor-default">API Reference</span></li>
                <li><span className="cursor-default">Component Library</span></li>
                <li><span className="cursor-default">Changelog</span></li>
              </ul>
            </div>
            {/* Company */}
            <div>
              <h4 className="mb-3 text-sm font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="cursor-default">About</span></li>
                <li><span className="cursor-default">Blog</span></li>
                <li><span className="cursor-default">Careers</span></li>
                <li><span className="cursor-default">Contact</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} PageForge. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
