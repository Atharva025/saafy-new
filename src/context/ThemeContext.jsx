import { createContext, useContext, useState, useEffect } from 'react'

// Light mode colors
const lightColors = {
    paper: '#FAF7F2',
    paperDark: '#F0EBE3',
    paperDarker: '#E5DFD7',
    ink: '#1A1614',
    inkMuted: '#6B635B',
    inkLight: '#9C948B',
    accent: '#C45C3E',
    accentHover: '#A94E34',
    rule: '#E5DFD7',
}

// Dark mode colors
const darkColors = {
    paper: '#1A1614',
    paperDark: '#252220',
    paperDarker: '#2F2B28',
    ink: '#FAF7F2',
    inkMuted: '#A8A19A',
    inkLight: '#6B635B',
    accent: '#E07356',
    accentHover: '#C45C3E',
    rule: '#3A3633',
}

// Fonts (same for both modes)
const fonts = {
    display: "'Syne', sans-serif",
    primary: "'Sora', sans-serif",
    mono: "'Space Grotesk', monospace",
}

const THEME_KEY = 'saafy_theme'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(() => {
        try {
            return localStorage.getItem(THEME_KEY) === 'dark'
        } catch {
            return false
        }
    })

    const colors = isDark ? darkColors : lightColors

    const toggleTheme = () => {
        setIsDark(prev => !prev)
    }

    useEffect(() => {
        localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light')
        // Apply to html element for global CSS access if needed
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    }, [isDark])

    return (
        <ThemeContext.Provider value={{ isDark, colors, fonts, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}

// Export color palettes for reference
export { lightColors, darkColors, fonts }
