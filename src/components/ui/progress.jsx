import * as React from "react"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef(({ className, value, max = 100, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "relative h-2 w-full overflow-hidden rounded-full bg-progress-empty",
            className
        )}
        {...props}
    >
        <div
            className="h-full w-full flex-1 bg-progress-filled transition-all duration-300"
            style={{
                transform: `translateX(-${100 - (value || 0)}%)`,
            }}
        />
    </div>
))
Progress.displayName = "Progress"

export { Progress }
