import { createContext, useContext, useState, useEffect } from 'react'

const ToastContext = createContext()

export const useToast = () => {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = (message, options = {}) => {
        const id = Date.now() + Math.random()
        const toast = {
            id,
            message,
            type: options.type || 'info', // info, success, error, warning
            duration: options.duration || 3000,
            action: options.action,
            onUndo: options.onUndo,
        }

        setToasts(prev => [...prev, toast])

        if (toast.duration !== Infinity) {
            setTimeout(() => {
                removeToast(id)
            }, toast.duration)
        }

        return id
    }

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }

    const success = (message, options) => addToast(message, { ...options, type: 'success' })
    const error = (message, options) => addToast(message, { ...options, type: 'error' })
    const info = (message, options) => addToast(message, { ...options, type: 'info' })
    const warning = (message, options) => addToast(message, { ...options, type: 'warning' })

    return (
        <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    )
}

function ToastContainer({ toasts, removeToast }) {
    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            pointerEvents: 'none',
            maxWidth: '90%',
            width: 'clamp(300px, 50vw, 480px)',
        }}>
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    )
}

function Toast({ toast, onClose }) {
    const [isExiting, setIsExiting] = useState(false)
    const [progress, setProgress] = useState(100)
    const isDark = localStorage.getItem('theme') === 'dark'

    const colors = isDark ? {
        paper: '#0D0D0D',
        ink: '#FAFAFA',
        accent: '#FF6B6B',
        rule: '#2A2A2A',
    } : {
        paper: '#FAFAFA',
        ink: '#0D0D0D',
        accent: '#FF6B6B',
        rule: '#E5E5E5',
    }

    const typeColors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: colors.accent,
    }

    // Progress bar animation
    useEffect(() => {
        if (toast.duration === Infinity) return
        const interval = setInterval(() => {
            setProgress(prev => Math.max(0, prev - (100 / (toast.duration / 50))))
        }, 50)
        return () => clearInterval(interval)
    }, [toast.duration])

    const handleClose = () => {
        setIsExiting(true)
        setTimeout(onClose, 200)
    }

    const handleUndo = () => {
        if (toast.onUndo) {
            toast.onUndo()
            handleClose()
        }
    }

    return (
        <div style={{
            background: colors.paper,
            borderRadius: '14px',
            border: `1px solid ${colors.rule}`,
            boxShadow: isDark
                ? '0 12px 32px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)'
                : '0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            pointerEvents: 'auto',
            animation: isExiting ? 'slideOut 0.25s ease-out forwards' : 'slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            minWidth: '300px',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
        }}>
            {/* Progress Bar */}
            {toast.duration !== Infinity && (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '3px',
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${typeColors[toast.type]}, ${typeColors[toast.type]}80)`,
                    transition: 'width 0.05s linear',
                    borderRadius: '0 2px 0 0',
                }} />
            )}
            {/* Icon */}
            <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: `${typeColors[toast.type]}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                animation: 'iconPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
                {toast.type === 'success' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={typeColors[toast.type]}>
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                )}
                {toast.type === 'error' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={typeColors[toast.type]}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                )}
                {toast.type === 'warning' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={typeColors[toast.type]}>
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                    </svg>
                )}
                {toast.type === 'info' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={typeColors[toast.type]}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                    </svg>
                )}
            </div>

            {/* Message */}
            <div style={{
                flex: 1,
                fontFamily: "'Sora', sans-serif",
                fontSize: '0.875rem',
                color: colors.ink,
                lineHeight: '1.4',
            }}>
                {toast.message}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                {toast.onUndo && (
                    <button
                        onClick={handleUndo}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: typeColors[toast.type],
                            fontFamily: "'Sora', sans-serif",
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = `${typeColors[toast.type]}15`}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        Undo
                    </button>
                )}

                <button
                    onClick={handleClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: colors.ink,
                        opacity: 0.5,
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                    </svg>
                </button>
            </div>

            <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(20px) scale(0.92);
          }
        }
        @keyframes iconPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
        </div>
    )
}
