import * as React from "react"
import { cn } from "cn"
import { ChevronDownIcon } from "lucide-react"

// Lista desplegable nativa del navegador: en celular abre el selector del sistema, que es lo más cómodo.
function Selector({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative w-full">
      <select
        data-slot="selector"
        className={cn(
          "h-11 w-full min-w-0 cursor-pointer appearance-none rounded-xl border border-input bg-card py-2 pr-10 pl-3.5 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          className
        )}
        {...props}
      />
      <ChevronDownIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-texto-suave"
      />
    </div>
  )
}

export { Selector }
