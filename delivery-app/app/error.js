'use client';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Critical Client Exception captured:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-6">
            <h2 className="text-2xl font-bold text-red-700 mb-4">Something went wrong!</h2>
            <div className="bg-white p-4 rounded-xl shadow border border-red-200 w-full max-w-md overflow-auto">
                <p className="font-mono text-sm text-red-600 mb-2">{error?.message || 'Unknown Error'}</p>
                <p className="font-mono text-xs text-gray-500 whitespace-pre-wrap">{error?.stack}</p>
            </div>
            <button
                onClick={() => reset()}
                className="mt-6 bg-red-600 text-white px-6 py-3 rounded-xl font-bold"
            >
                Try again
            </button>
        </div>
    );
}
