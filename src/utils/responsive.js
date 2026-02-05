// Responsive utility functions and breakpoints

export const breakpoints = {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
    wide: 1400,
}

export const useResponsive = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < breakpoints.mobile
    const isTablet = typeof window !== 'undefined' && window.innerWidth >= breakpoints.mobile && window.innerWidth < breakpoints.desktop
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= breakpoints.desktop

    return { isMobile, isTablet, isDesktop }
}

export const responsive = {
    // Helper to return different values based on screen size
    value: (mobile, tablet, desktop) => {
        if (typeof window === 'undefined') return desktop
        const width = window.innerWidth
        if (width < breakpoints.mobile) return mobile
        if (width < breakpoints.desktop) return tablet
        return desktop
    },

    // CSS clamp helper for fluid sizing
    clamp: (min, preferred, max) => `clamp(${min}, ${preferred}, ${max})`,
}