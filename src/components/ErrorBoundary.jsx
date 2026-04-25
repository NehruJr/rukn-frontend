import React from 'react';
import Button from '@/components/ui/Button';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ color: '#d32f2f', marginBottom: '1rem' }}>Something went wrong</h2>
                    <p style={{ color: '#666', marginBottom: '2rem' }}>We apologize for the inconvenience. An unexpected error has occurred.</p>
                    
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Button onClick={() => window.location.reload()} variant="primary">Refresh Page</Button>
                        <Button onClick={() => window.location.href = '/'} variant="outline">Go to Dashboard</Button>
                    </div>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <div style={{ marginTop: '2rem', textAlign: 'left' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Error details:</p>
                            <pre style={{ 
                                background: '#f5f5f5', 
                                padding: '1rem', 
                                borderRadius: '4px',
                                overflowX: 'auto',
                                fontSize: '0.875rem',
                                color: '#d32f2f'
                            }}>
                                {this.state.error.toString()}
                            </pre>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
