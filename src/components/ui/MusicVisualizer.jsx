import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

const MusicVisualizer = ({ isPlaying = true, className = "" }) => {
    const bars = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        delay: i * 0.1,
        height: 20 + Math.random() * 40,
        animationDuration: 0.5 + Math.random() * 0.5
    }))

    return (
        <div className={`flex items-end justify-center gap-1 ${className}`}>
            {bars.map((bar) => (
                <motion.div
                    key={bar.id}
                    className="bg-gradient-to-t from-accent-primary to-accent-secondary rounded-t-sm"
                    style={{
                        width: '3px',
                        minHeight: '4px'
                    }}
                    animate={isPlaying ? {
                        height: [bar.height * 0.3, bar.height, bar.height * 0.5, bar.height * 0.8, bar.height * 0.3],
                        opacity: [0.5, 1, 0.7, 0.9, 0.5]
                    } : {
                        height: bar.height * 0.3,
                        opacity: 0.3
                    }}
                    transition={{
                        duration: bar.animationDuration,
                        repeat: isPlaying ? Infinity : 0,
                        ease: "easeInOut",
                        delay: bar.delay
                    }}
                />
            ))}
        </div>
    )
}

export default MusicVisualizer
