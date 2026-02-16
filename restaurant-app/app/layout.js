import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata = {
    title: 'Degloor Mart Restaurant',
    description: 'Restaurant Partner App',
    manifest: '/manifest.json',
    themeColor: '#FF6B35',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
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
