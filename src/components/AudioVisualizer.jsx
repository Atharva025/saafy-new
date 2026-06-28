import { useEffect, useRef, useState } from 'react'
import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'

export default function AudioVisualizer({ compact = false }) {
    const { isPlaying, analyserNode } = usePlayer()
    const { colors } = useTheme()
    const canvasRef = useRef(null)
    const animationRef = useRef(null)
    const dataArrayRef = useRef(null)
    const [mode, setMode] = useState('wave') // 'bars' | 'wave'

    useEffect(() => {
        if (!analyserNode) return

        try {
            analyserNode.fftSize = compact ? 64 : 128
            const bufferLength = analyserNode.frequencyBinCount
            dataArrayRef.current = new Uint8Array(bufferLength)
        } catch (err) {
            console.warn('AudioVisualizer initialization error:', err)
        }
    }, [analyserNode, compact])

    useEffect(() => {
        if (!isPlaying || !analyserNode || !canvasRef.current || !dataArrayRef.current) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
            return
        }

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const analyzer = analyserNode
        const dataArray = dataArrayRef.current

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw)

            analyzer.getByteFrequencyData(dataArray)

            // Calculate average audio level to detect if there's actual sound
            let sum = 0
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i]
            }
            const average = sum / dataArray.length
            const SILENCE_THRESHOLD = 10 // Threshold below which we consider it silence

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const barCount = compact ? 12 : 24
            const gap = compact ? 2 : 3

            // Apply a subtle dynamic neon glow based on overall amplitude
            const glowStrength = Math.min(12, average / 8)
            ctx.shadowBlur = glowStrength
            ctx.shadowColor = colors.accent

            if (mode === 'bars') {
                const barWidth = canvas.width / barCount
                for (let i = 0; i < barCount; i++) {
                    const dataIndex = Math.floor((i / barCount) * dataArray.length)
                    let value = dataArray[dataIndex] / 255

                    if (average < SILENCE_THRESHOLD) {
                        value = 0.05 // Minimal height to show bars exist
                    }

                    const barHeight = Math.max(3, value * canvas.height * 0.8)
                    const x = i * barWidth
                    const y = canvas.height - barHeight

                    // Create gradient for each bar
                    const gradient = ctx.createLinearGradient(x, y, x, canvas.height)
                    gradient.addColorStop(0, colors.accent)
                    gradient.addColorStop(1, `${colors.accent}60`)

                    ctx.fillStyle = gradient

                    const w = barWidth - gap * 2
                    const h = barHeight
                    const r = w / 2 // round radius

                    ctx.beginPath()
                    if (ctx.roundRect) {
                        ctx.roundRect(x + gap, y, w, h, [r, r, 0, 0])
                    } else {
                        ctx.rect(x + gap, y, w, h)
                    }
                    ctx.fill()
                }
            } else {
                // Glow wave curve drawing using cubic splines (Bezier curve)
                ctx.beginPath()
                ctx.lineWidth = compact ? 2 : 3
                ctx.strokeStyle = colors.accent

                const sliceWidth = canvas.width / (barCount - 1)

                for (let i = 0; i < barCount; i++) {
                    const dataIndex = Math.floor((i / barCount) * dataArray.length)
                    let value = dataArray[dataIndex] / 255

                    if (average < SILENCE_THRESHOLD) {
                        value = 0.02
                    }

                    // Dynamic wave scaling
                    const waveHeight = value * canvas.height * 0.72
                    const x = i * sliceWidth
                    // Center the wave line vertically or bottom aligned
                    const y = canvas.height - 4 - waveHeight

                    if (i === 0) {
                        ctx.moveTo(x, y)
                    } else {
                        const prevX = (i - 1) * sliceWidth
                        const prevDataIndex = Math.floor(((i - 1) / barCount) * dataArray.length)
                        const prevValue = average < SILENCE_THRESHOLD ? 0.02 : dataArray[prevDataIndex] / 255
                        const prevY = canvas.height - 4 - (prevValue * canvas.height * 0.72)

                        // Smooth bezier control points
                        const cpX1 = prevX + sliceWidth / 2
                        const cpY1 = prevY
                        const cpX2 = prevX + sliceWidth / 2
                        const cpY2 = y

                        ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, x, y)
                    }
                }

                ctx.stroke()

                // Glow fill underneath Bezier path
                ctx.lineTo(canvas.width, canvas.height)
                ctx.lineTo(0, canvas.height)
                ctx.closePath()
                const fillGrad = ctx.createLinearGradient(0, 0, 0, canvas.height)
                fillGrad.addColorStop(0, `${colors.accent}35`)
                fillGrad.addColorStop(1, 'transparent')
                ctx.fillStyle = fillGrad
                ctx.fill()
            }
        }

        draw()

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [isPlaying, analyserNode, colors.accent, compact, mode])

    // Fallback animation when audio analysis unavailable
    const FallbackBars = () => (
        <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            height: '100%',
            padding: '0 2px',
            gap: compact ? '2px' : '3px',
        }}>
            {Array.from({ length: compact ? 12 : 24 }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        flex: 1,
                        background: `linear-gradient(to top, ${colors.accent}, ${colors.accent}60)`,
                        borderRadius: '3px 3px 0 0',
                        boxShadow: `0 0 6px ${colors.accent}30`,
                        animation: `wave 1s ease-in-out infinite`,
                        animationDelay: `${i * 0.05}s`,
                        minHeight: '20%',
                    }}
                />
            ))}
        </div>
    )

    return (
        <div 
            onClick={() => setMode(prev => prev === 'bars' ? 'wave' : 'bars')}
            title="Click to toggle visualizer mode"
            style={{
                width: '100%',
                height: compact ? '12px' : '40px',
                position: 'relative',
                cursor: 'pointer'
            }}
        >
            {analyserNode && isPlaying ? (
                <canvas
                    ref={canvasRef}
                    width={compact ? 150 : 300}
                    height={compact ? 12 : 40}
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                />
            ) : (
                isPlaying && <FallbackBars />
            )}

            <style>{`
        @keyframes wave {
          0%, 100% {
            height: 20%;
          }
          50% {
            height: 80%;
          }
        }
      `}</style>
        </div>
    )
}
