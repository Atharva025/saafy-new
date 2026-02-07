import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Format duration from seconds to MM:SS
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Truncate text with ellipsis
export function truncateText(text, maxLength = 50) {
  if (!text) return ''
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
}

// Clean HTML entities and decode
export function cleanText(text) {
  if (!text) return ''
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, '') // Remove HTML tags
}

// Get optimized image URL
export function getOptimizedImageUrl(url, size = 'medium') {
  if (!url || typeof url !== 'string') return '/placeholder-album.jpg'

  // If it's already optimized or doesn't need optimization
  if (url.includes('150x150') || url.includes('500x500')) {
    return url
  }

  // Replace image size for optimization
  const sizeMap = {
    small: '150x150',
    medium: '500x500',
    large: '1000x1000'
  }

  return url.replace(/\d+x\d+/, sizeMap[size] || sizeMap.medium)
}

// Debounce function for search
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Generate random ID
export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

// Get the last (highest quality) image from an image array
export function getLastImage(imageArray) {
  if (!imageArray || !Array.isArray(imageArray) || imageArray.length === 0) {
    return '/placeholder-album.jpg'
  }

  const lastImage = imageArray[imageArray.length - 1]
  return lastImage?.link || lastImage?.url || '/placeholder-album.jpg'
}

// Optimize image URL for different sizes
export function optimizeImage(url, width = 500, height = 300) {
  if (!url || url.includes('placeholder')) {
    return `https://via.placeholder.com/${width}x${height}/6366f1/ffffff?text=Music`
  }

  // If it's already a placeholder URL, return as is
  if (url.includes('via.placeholder.com')) {
    return url
  }

  // For other URLs, return as is (could be enhanced with image optimization service)
  return url
}

// Calculate luminance of RGB color (0-255 range)
function getLuminance(r, g, b) {
  // Convert to 0-1 range and apply sRGB gamma correction
  const rsRGB = r / 255
  const gsRGB = g / 255
  const bsRGB = b / 255

  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)

  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
}

// Adjust color brightness for better contrast
function adjustBrightness(r, g, b, factor) {
  return {
    r: Math.min(255, Math.max(0, Math.round(r * factor))),
    g: Math.min(255, Math.max(0, Math.round(g * factor))),
    b: Math.min(255, Math.max(0, Math.round(b * factor)))
  }
}

// Lighten/darken color for better visibility
export function adjustColorForTheme(colorObj, isDark) {
  if (!colorObj || !colorObj.rgb) return null

  // Extract RGB values from "rgb(r, g, b)" string
  const matches = colorObj.rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (!matches) return colorObj

  let r = parseInt(matches[1])
  let g = parseInt(matches[2])
  let b = parseInt(matches[3])

  const luminance = getLuminance(r, g, b)

  // Dark mode: ensure color is bright enough
  if (isDark) {
    // If color is too dark (luminance < 0.3), brighten it significantly
    if (luminance < 0.3) {
      // Brighten the color by mixing it with a lighter version
      const brightnessFactor = 0.3 / luminance * 2.5
      const adjusted = adjustBrightness(r, g, b, brightnessFactor)

      // Also add saturation to make it more vibrant
      const max = Math.max(adjusted.r, adjusted.g, adjusted.b)
      const min = Math.min(adjusted.r, adjusted.g, adjusted.b)
      const saturation = max === 0 ? 0 : (max - min) / max

      // If color is too desaturated (grayish), increase saturation
      if (saturation < 0.3) {
        const mid = (max + min) / 2
        r = adjusted.r > mid ? Math.min(255, adjusted.r * 1.3) : adjusted.r
        g = adjusted.g > mid ? Math.min(255, adjusted.g * 1.3) : adjusted.g
        b = adjusted.b > mid ? Math.min(255, adjusted.b * 1.3) : adjusted.b
      } else {
        r = adjusted.r
        g = adjusted.g
        b = adjusted.b
      }
    }
  }
  // Light mode: ensure color is not too light
  else {
    // If color is too bright (luminance > 0.6), darken it
    if (luminance > 0.6) {
      const darknessFactor = 0.6 / luminance * 0.7
      const adjusted = adjustBrightness(r, g, b, darknessFactor)
      r = adjusted.r
      g = adjusted.g
      b = adjusted.b
    }
  }

  // Return new color object with adjusted values
  return {
    rgb: `rgb(${r}, ${g}, ${b})`,
    rgba: (alpha) => `rgba(${r}, ${g}, ${b}, ${alpha})`,
    hex: rgbToHex(r, g, b)
  }
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}
