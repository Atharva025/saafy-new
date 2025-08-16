import * as React from "react"
import { cn } from "@/lib/utils"

const Dialog = ({ open, onOpenChange, children }) => {
    React.useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && open) {
                onOpenChange?.(false)
            }
        }

        if (open) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [open, onOpenChange])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="fixed inset-0 bg-black"
                onClick={() => onOpenChange?.(false)}
            />
            <div className="relative z-50 max-h-[90vh] w-full max-w-lg overflow-auto">
                {children}
            </div>
        </div>
    )
}

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "relative bg-background-secondary border border-white rounded-2xl shadow-2xl p-6 animate-in fade-in-0 zoom-in-95 duration-300",
            className
        )}
        {...props}
    >
        {children}
    </div>
))
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className, ...props }) => (
    <div
        className={cn(
            "flex flex-col space-y-1.5 text-center sm:text-left mb-4",
            className
        )}
        {...props}
    />
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
    <h2
        ref={ref}
        className={cn(
            "text-lg font-heading font-semibold leading-none tracking-tight text-text-primary",
            className
        )}
        {...props}
    />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-text-secondary", className)}
        {...props}
    />
))
DialogDescription.displayName = "DialogDescription"

export {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
}
