import { useEffect, useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useDarkMode } from "@/lib/theme"
import { isAuthenticated, getStoredUser, removeToken } from "@/lib/auth"
import { Button } from "@/components/ui/button"

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-accent text-accent-foreground"
      : "text-muted-foreground hover:text-foreground"
  )

export function Navbar() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useDarkMode()
  const [loggedIn, setLoggedIn] = useState(isAuthenticated())
  const user = getStoredUser()
  const [scrolled, setScrolled] = useState(false)

  // Listen to auth changes via storage events (cross-tab) and a custom event
  useEffect(() => {
    const checkAuth = () => {
      setLoggedIn(isAuthenticated())
    }
    window.addEventListener("storage", checkAuth)
    window.addEventListener("auth-change", checkAuth)
    return () => {
      window.removeEventListener("storage", checkAuth)
      window.removeEventListener("auth-change", checkAuth)
    }
  }, [])

  // Track scroll for backdrop-blur
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = () => {
    removeToken()
    setLoggedIn(false)
    window.dispatchEvent(new Event("auth-change"))
    navigate("/")
  }

  const scrollToSection = (id: string) => {
    // If on home page, scroll. Otherwise navigate and then scroll.
    if (window.location.pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    } else {
      navigate(`/#${id}`)
    }
  }

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 transition-all duration-200",
        scrolled
          ? "border-b bg-background/80 backdrop-blur-lg"
          : "bg-background"
      )}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <NavLink
          to="/"
          className="text-xl font-bold tracking-tight text-primary"
        >
          PageForge
        </NavLink>

        {/* Center nav — only visible when logged out */}
        {!loggedIn && (
          <div className="hidden items-center gap-1 md:flex">
            <button
              onClick={() => scrollToSection("templates")}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("templates")}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Templates
            </button>
            <NavLink to="/pricing" className={linkClass}>
              Pricing
            </NavLink>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md px-2 py-1.5 text-sm transition-colors text-muted-foreground hover:text-foreground"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {loggedIn && user ? (
            <>
              <NavLink to="/admin" className={linkClass}>
                Dashboard
              </NavLink>
              <span className="hidden text-sm text-muted-foreground md:inline">
                {user.username}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Sign in
              </NavLink>
              <Button size="sm" onClick={() => navigate("/register")}>
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
