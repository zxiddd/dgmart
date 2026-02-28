import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata = {
    title: 'Degloor Mart Delivery',
    description: 'Delivery Partner App',
};

// Required for correct scaling on all mobile devices — without this the page
// renders at desktop zoom on Android/iOS.
export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <AuthProvider>
                    <NotificationProvider>
                        <SocketProvider>
                            <Toaster position="top-center" />
                            {children}
                        </SocketProvider>
                    </NotificationProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
