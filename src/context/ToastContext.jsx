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
            borderRadius: '12px',
            border: `1px solid ${colors.rule}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            pointerEvents: 'auto',
            animation: isExiting ? 'slideOut 0.2s ease-out forwards' : 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: '280px',
        }}>
            {/* Icon */}
            <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: `${typeColors[toast.type]}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
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
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
        }
      `}</style>
        </div>
    )
}
