import * as React from "react"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef(({ className, value, onValueChange, max = 100, min = 0, step = 1, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || 0)

    const handleChange = (e) => {
        const newValue = Number(e.target.value)
        setInternalValue(newValue)
        onValueChange?.([newValue])
    }

    React.useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value)
        }
    }, [value])

    const progressPercentage = (internalValue / max) * 100

    return (
        <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
            <input
                ref={ref}
                type="range"
                min={min}
                max={max}
                step={step}
                value={internalValue}
                onChange={handleChange}
                className="w-full custom-range"
                style={{
                    background: `linear-gradient(to right, #1DB954 0%, #1DB954 ${progressPercentage}%, #404040 ${progressPercentage}%, #404040 100%)`
                }}
                {...props}
            />
        </div>
    )
})
Slider.displayName = "Slider"

export { Slider }
