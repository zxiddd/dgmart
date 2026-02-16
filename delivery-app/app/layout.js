import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata = {
    title: 'Degloor Mart Delivery',
    description: 'Delivery Partner App',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <SocketProvider>
                        <Toaster position="top-center" />
                        {children}
                    </SocketProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
