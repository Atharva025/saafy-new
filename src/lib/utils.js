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
