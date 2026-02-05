import { useEffect, useRef, useState } from 'react'
import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'

export default function AudioVisualizer({ compact = false }) {
    const { audioRef, isPlaying } = usePlayer()
    const { colors } = useTheme()
    const canvasRef = useRef(null)
    const animationRef = useRef(null)
    const analyzerRef = useRef(null)
    const dataArrayRef = useRef(null)
    const [isInitialized, setIsInitialized] = useState(false)

    useEffect(() => {
        if (!audioRef?.current || isInitialized) return

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)()
            const analyzer = audioContext.createAnalyser()
            const source = audioContext.createMediaElementSource(audioRef.current)

            source.connect(analyzer)
            analyzer.connect(audioContext.destination)

            analyzer.fftSize = compact ? 64 : 128
            const bufferLength = analyzer.frequencyBinCount
            const dataArray = new Uint8Array(bufferLength)

            analyzerRef.current = analyzer
            dataArrayRef.current = dataArray
            setIsInitialized(true)
        } catch (err) {
            console.warn('AudioVisualizer: Could not initialize', err)
        }
    }, [audioRef, isInitialized, compact])

    useEffect(() => {
        if (!isPlaying || !analyzerRef.current || !canvasRef.current) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
            return
        }

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const analyzer = analyzerRef.current
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
            const barWidth = canvas.width / barCount
            const gap = compact ? 2 : 3

            for (let i = 0; i < barCount; i++) {
                const dataIndex = Math.floor((i / barCount) * dataArray.length)
                let value = dataArray[dataIndex] / 255

                // If average volume is below threshold, keep bars flat
                if (average < SILENCE_THRESHOLD) {
                    value = 0.05 // Minimal height to show bars exist
                }

                const barHeight = value * canvas.height * 0.8

                const x = i * barWidth
                const y = canvas.height - barHeight

                // Create gradient for each bar
                const gradient = ctx.createLinearGradient(x, y, x, canvas.height)
                gradient.addColorStop(0, colors.accent)
                gradient.addColorStop(1, `${colors.accent}60`)

                ctx.fillStyle = gradient
                ctx.fillRect(x + gap, y, barWidth - gap * 2, barHeight)
            }
        }

        draw()

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [isPlaying, colors.accent, compact])

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
                        borderRadius: '2px 2px 0 0',
                        animation: `wave 1s ease-in-out infinite`,
                        animationDelay: `${i * 0.05}s`,
                        minHeight: '20%',
                    }}
                />
            ))}
        </div>
    )

    return (
        <div style={{
            width: '100%',
            height: compact ? '12px' : '40px',
            position: 'relative',
        }}>
            {isInitialized && isPlaying ? (
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
