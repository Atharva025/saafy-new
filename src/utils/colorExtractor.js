/**
 * Extract dominant colors from an image URL
 * Uses canvas to analyze pixel data
 */
export async function extractDominantColor(imageUrl) {
    if (!imageUrl) return null

    return new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'Anonymous'

        img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            // Use smaller canvas for performance
            canvas.width = 100
            canvas.height = 100

            ctx.drawImage(img, 0, 0, 100, 100)

            try {
                const imageData = ctx.getImageData(0, 0, 100, 100).data
                const colorCounts = {}

                // Sample every 4th pixel for performance
                for (let i = 0; i < imageData.length; i += 16) {
                    const r = imageData[i]
                    const g = imageData[i + 1]
                    const b = imageData[i + 2]
                    const a = imageData[i + 3]

                    // Skip transparent and too dark/bright pixels
                    if (a < 128 || (r + g + b) < 50 || (r + g + b) > 700) continue

                    // Round to reduce color variations
                    const roundedR = Math.round(r / 10) * 10
                    const roundedG = Math.round(g / 10) * 10
                    const roundedB = Math.round(b / 10) * 10

                    const key = `${roundedR},${roundedG},${roundedB}`
                    colorCounts[key] = (colorCounts[key] || 0) + 1
                }

                // Find most common color
                let dominantColor = null
                let maxCount = 0

                for (const [color, count] of Object.entries(colorCounts)) {
                    if (count > maxCount) {
                        maxCount = count
                        dominantColor = color
                    }
                }

                if (dominantColor) {
                    const [r, g, b] = dominantColor.split(',').map(Number)
                    resolve({
                        rgb: `rgb(${r}, ${g}, ${b})`,
                        rgba: (alpha) => `rgba(${r}, ${g}, ${b}, ${alpha})`,
                        hex: rgbToHex(r, g, b),
                    })
                } else {
                    resolve(null)
                }
            } catch (err) {
                // CORS or other error
                resolve(null)
            }
        }

        img.onerror = () => resolve(null)
        img.src = imageUrl
    })
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16)
        return hex.length === 1 ? '0' + hex : hex
    }).join('')
}

/**
 * Generate gradient from dominant color
 */
export function generateGradient(color, isDark = false) {
    if (!color) return null

    const baseOpacity = isDark ? 0.15 : 0.08
    const endOpacity = 0

    return {
        radial: `radial-gradient(circle at 50% 0%, ${color.rgba(baseOpacity)} 0%, ${color.rgba(endOpacity)} 70%)`,
        linear: `linear-gradient(180deg, ${color.rgba(baseOpacity)} 0%, ${color.rgba(endOpacity)} 100%)`,
        mesh: `
      radial-gradient(at 27% 37%, ${color.rgba(baseOpacity)} 0px, transparent 50%),
      radial-gradient(at 97% 21%, ${color.rgba(baseOpacity * 0.8)} 0px, transparent 50%),
      radial-gradient(at 52% 99%, ${color.rgba(baseOpacity * 0.6)} 0px, transparent 50%),
      radial-gradient(at 10% 29%, ${color.rgba(baseOpacity * 0.7)} 0px, transparent 50%),
      radial-gradient(at 97% 96%, ${color.rgba(baseOpacity * 0.5)} 0px, transparent 50%),
      radial-gradient(at 33% 50%, ${color.rgba(baseOpacity * 0.9)} 0px, transparent 50%)
    `,
    }
}
