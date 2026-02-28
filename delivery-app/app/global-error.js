'use client';
import { useEffect } from 'react';

// global-error.js catches errors that bubble up to the root layout itself
// (e.g. context provider crashes during hydration). Unlike error.js, this
// component MUST render its own <html> and <body> tags because the root
// layout is not available when this renders.
export default function GlobalError({ error, reset }) {
    useEffect(() => {
        console.error('Global root error:', error);
    }, [error]);

    return (
        <html lang="en">
            <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#fff8f8' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '24px',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#b91c1c', marginBottom: '8px' }}>
                        Something went wrong
                    </h2>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', maxWidth: '320px' }}>
                        The app encountered an error while loading. Please try again.
                    </p>
                    <button
                        onClick={() => reset()}
                        style={{
                            background: '#ea580c',
                            color: '#fff',
                            border: 'none',
                            padding: '12px 28px',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                        }}
                    >
                        Try Again
                    </button>
                </div>
            </body>
        </html>
    );
}
