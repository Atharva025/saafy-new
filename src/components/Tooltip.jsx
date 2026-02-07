import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'

export default function Tooltip({ children, text, delay = 300 }) {
    const { colors, fonts, isDark } = useTheme()
    const [isVisible, setIsVisible] = useState(false)
    const [position, setPosition] = useState({ top: 0, left: 0, placement: 'top' })
    const timeoutRef = useRef(null)
    const containerRef = useRef(null)
    const tooltipRef = useRef(null)

    const updatePosition = () => {
        if (containerRef.current && tooltipRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            const tooltipRect = tooltipRef.current.getBoundingClientRect()
            const scrollY = window.scrollY || window.pageYOffset
            const scrollX = window.scrollX || window.pageXOffset

            const spaceAbove = rect.top
            const spaceBelow = window.innerHeight - rect.bottom
            const tooltipHeight = tooltipRect.height || 40 // fallback height

            let top, left, placement

            // Determine if tooltip should be above or below
            if (spaceAbove >= tooltipHeight + 12 || spaceAbove > spaceBelow) {
                // Show above
                placement = 'top'
                top = rect.top + scrollY - tooltipHeight - 8
            } else {
                // Show below
                placement = 'bottom'
                top = rect.bottom + scrollY + 8
            }

            // Center horizontally relative to the container
            left = rect.left + scrollX + (rect.width / 2) - (tooltipRect.width / 2)

            // Keep tooltip within viewport horizontally
            const maxLeft = window.innerWidth - tooltipRect.width - 16 + scrollX
            const minLeft = 16 + scrollX
            left = Math.max(minLeft, Math.min(left, maxLeft))

            setPosition({ top, left, placement })
        }
    }

    const handleMouseEnter = () => {
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true)
        }, delay)
    }

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        setIsVisible(false)
    }

    // Update position when tooltip becomes visible or on scroll
    useEffect(() => {
        if (isVisible) {
            // Initial position calculation
            updatePosition()

            // Recalculate on scroll
            const handleScroll = () => {
                if (isVisible) {
                    updatePosition()
                }
            }

            window.addEventListener('scroll', handleScroll, true)
            window.addEventListener('resize', handleScroll)

            return () => {
                window.removeEventListener('scroll', handleScroll, true)
                window.removeEventListener('resize', handleScroll)
            }
        }
    }, [isVisible])

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return (
        <>
            <div
                ref={containerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{ display: 'inline-block', width: '100%' }}
            >
                {children}
            </div>

            {isVisible && (
                <div
                    ref={tooltipRef}
                    style={{
                        position: 'absolute',
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                        zIndex: 999999,
                        background: isDark ? 'rgba(26, 22, 20, 0.98)' : 'rgba(250, 250, 250, 0.98)',
                        color: colors.ink,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontFamily: fonts.primary,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        lineHeight: '1.4',
                        maxWidth: '320px',
                        border: `1px solid ${colors.rule}`,
                        boxShadow: isDark
                            ? '0 8px 24px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)'
                            : '0 8px 24px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.15)',
                        pointerEvents: 'none',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        whiteSpace: 'nowrap',
                        opacity: position.top === 0 && position.left === 0 ? 0 : 1,
                        transition: 'opacity 0.15s ease-out',
                    }}
                >
                    {text}
                </div>
            )}

            <style>{`
                @keyframes tooltipFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-2px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </>
    )
}
