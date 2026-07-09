import * as React from "react"

import { cn } from "@/lib/utils"

export interface SwitchProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        ref={ref}
        className="peer sr-only"
        {...props}
      />
      <div
        className={cn(
          "h-6 w-11 rounded-full border border-input bg-muted after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-background after:shadow-sm after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2",
          className
        )}
      />
    </label>
  )
)
Switch.displayName = "Switch"

export { Switch }
