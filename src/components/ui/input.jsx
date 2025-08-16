import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-10 w-full rounded-full border border-white bg-background-secondary px-4 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:cursor-not-allowed disabled:opacity-100 transition-all duration-300",
                className
            )}
            ref={ref}
            {...props}
        />
    )
})
Input.displayName = "Input"

export { Input }
