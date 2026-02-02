import { Component } from 'react'

class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen p-8 bg-neutral-50 dark:bg-neutral-950">
                    <div className="max-w-md text-center p-10 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl">
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">Something went wrong</h2>
                        <p className="text-neutral-500 mb-6">An unexpected error occurred.</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={this.handleReset} className="px-6 py-3 bg-amber-500 text-white font-medium rounded-xl">
                                Try Again
                            </button>
                            <button onClick={() => window.location.href = '/'} className="px-6 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-600 dark:text-neutral-300">
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}

export default ErrorBoundary
