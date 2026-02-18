import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata = {
    title: 'Degloor Mart Restaurant',
    description: 'Restaurant Partner App',
    manifest: '/manifest.json',
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#FF6B35',
};

import { SocketProvider } from '@/context/SocketContext';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <SocketProvider>
                        {children}
                        <Toaster position="top-center" />
                    </SocketProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
