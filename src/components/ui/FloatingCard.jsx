import React, { useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

const FloatingCard = ({ children, className = "", intensity = 1 }) => {
    const [isHovered, setIsHovered] = useState(false)

    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [`${-10 * intensity}deg`, `${10 * intensity}deg`])
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [`${-10 * intensity}deg`, `${10 * intensity}deg`])
    const translateZ = useTransform(mouseXSpring, [-0.5, 0.5], [-5 * intensity, 5 * intensity])

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        x.set((e.clientX - centerX) / rect.width)
        y.set((e.clientY - centerY) / rect.height)
    }

    const handleMouseLeave = () => {
        setIsHovered(false)
        x.set(0)
        y.set(0)
    }

    return (
        <motion.div
            className={`relative ${className}`}
            style={{
                perspective: '1000px'
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    z: translateZ,
                    transformStyle: 'preserve-3d'
                }}
                animate={{
                    scale: isHovered ? 1.05 : 1
                }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                }}
                className="relative"
            >
                {children}

                {/* Glow effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-primary rounded-3xl blur-xl opacity-0 pointer-events-none"
                    animate={{
                        opacity: isHovered ? 0.2 : 0
                    }}
                    transition={{ duration: 0.3 }}
                />
            </motion.div>
        </motion.div>
    )
}

export default FloatingCard
