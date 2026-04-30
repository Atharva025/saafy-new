import { createContext, useContext, useState, useEffect } from 'react'
import { safeGetStorage, safeSetStorage } from '@/lib/security'

// ─── Color Palettes ───────────────────────────────────────────────────────────

const lightColors = {
    // Surfaces (light → dark layering)
    paper: '#FAF7F2',
    paperDark: '#F0EBE3',
    paperDarker: '#E5DFD7',

    // Text hierarchy
    ink: '#1A1614',   // Primary text
    inkMuted: '#6B635B',   // Secondary text
    inkLight: '#9C948B',   // Tertiary / disabled text

    // Accent (terra-cotta rust)
    accent: '#C45C3E',
    accentHover: '#A94E34',
    accentActive: '#8C3F28',
    accentSubtle: 'rgba(196, 92, 62, 0.08)',
    accentBorder: 'rgba(196, 92, 62, 0.18)',

    // Structure
    rule: '#E5DFD7',   // Dividers
    border: 'rgba(26, 22, 20, 0.09)',  // Alpha-blended borders

    // Overlays
    overlay: 'rgba(250, 247, 242, 0.88)',  // Frosted header/panel bg
    overlayDeep: 'rgba(250, 247, 242, 0.96)',

    // Shadows (warm-toned)
    shadowSm: '0 1px 3px rgba(26, 22, 20, 0.07)',
    shadowMd: '0 4px 14px rgba(26, 22, 20, 0.09)',
    shadowLg: '0 12px 36px rgba(26, 22, 20, 0.13)',
    shadowXl: '0 24px 64px rgba(26, 22, 20, 0.16)',
}

const darkColors = {
    // Surfaces (dark → darker layering)
    paper: '#1A1614',
    paperDark: '#252220',
    paperDarker: '#2F2B28',

    // Text hierarchy
    ink: '#FAF7F2',   // Primary text
    inkMuted: '#A8A19A',   // Secondary text
    inkLight: '#6B635B',   // Tertiary / disabled text

    // Accent (warmer rust for dark mode)
    accent: '#E07356',
    accentHover: '#C45C3E',
    accentActive: '#A84E33',
    accentSubtle: 'rgba(224, 115, 86, 0.12)',
    accentBorder: 'rgba(224, 115, 86, 0.22)',

    // Structure
    rule: '#3A3633',   // Dividers
    border: 'rgba(255, 255, 255, 0.07)',  // Alpha-blended borders

    // Overlays
    overlay: 'rgba(26, 22, 20, 0.88)',
    overlayDeep: 'rgba(26, 22, 20, 0.96)',

    // Shadows (deeper for dark mode)
    shadowSm: '0 1px 3px rgba(0, 0, 0, 0.22)',
    shadowMd: '0 4px 14px rgba(0, 0, 0, 0.30)',
    shadowLg: '0 12px 36px rgba(0, 0, 0, 0.40)',
    shadowXl: '0 24px 64px rgba(0, 0, 0, 0.50)',
}

// ─── Typography ───────────────────────────────────────────────────────────────
// Space Grotesk is a geometric sans — used as UI/label font, not true monospace.
// Keeping the 'mono' key for backward compatibility with existing components.

const fonts = {
    display: "'Syne', sans-serif",         // Headings, section titles
    primary: "'Sora', sans-serif",         // Body text, UI copy
    mono: "'Space Grotesk', sans-serif", // Labels, badges, metadata, timestamps
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
// Shared constants that don't vary by theme. Reference these in components
// instead of hardcoding px values.

export const tokens = {
    // Border radius
    radius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        xxl: '24px',
        full: '9999px',
    },

    // Transitions
    transition: {
        fast: '120ms cubic-bezier(0.16, 1, 0.3, 1)',
        base: '180ms cubic-bezier(0.16, 1, 0.3, 1)',
        slow: '300ms cubic-bezier(0.16, 1, 0.3, 1)',
        spring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    },

    // Spacing (4px base unit)
    space: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
    },

    // Font sizes (fluid — use clamp in components)
    fontSize: {
        xs: 'clamp(0.72rem, 1.4vw, 0.78rem)',   // 11.5–12.5px — labels, badges
        sm: 'clamp(0.8rem,  1.6vw, 0.875rem)',  // 12.8–14px   — secondary UI
        base: 'clamp(0.875rem,1.8vw, 1rem)',      // 14–16px     — body copy
        lg: 'clamp(1rem,    2vw,   1.125rem)',  // 16–18px     — subheadings
        xl: 'clamp(1.2rem,  3vw,   1.5rem)',    // 19.2–24px   — section titles
        '2xl': 'clamp(1.5rem,  4vw,   2rem)',      // 24–32px     — page headings
        '3xl': 'clamp(2rem,    5vw,   2.5rem)',    // 32–40px     — hero headings
    },

    // Z-index scale
    zIndex: {
        base: 1,
        dropdown: 20,
        sticky: 30,
        overlay: 40,
        modal: 50,
        toast: 60,
        player: 70,
    },

    // Layout
    layout: {
        sidebarWidth: '200px',
        sidebarCollapsed: '64px',
        playerHeight: '80px',
        headerHeight: '60px',
        contentMax: '1400px',
    },
}

// ─── Context ──────────────────────────────────────────────────────────────────

const THEME_KEY = 'theme'
const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(() => {
        try {
            return safeGetStorage(THEME_KEY, 'dark') === 'dark'
        } catch {
            return true
        }
    })

    const colors = isDark ? darkColors : lightColors

    const toggleTheme = () => setIsDark(prev => !prev)

    useEffect(() => {
        safeSetStorage(THEME_KEY, isDark ? 'dark' : 'light')
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    }, [isDark])

    return (
        <ThemeContext.Provider value={{ isDark, colors, fonts, tokens, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) throw new Error('useTheme must be used within a ThemeProvider')
    return context
}

export { lightColors, darkColors, fonts }