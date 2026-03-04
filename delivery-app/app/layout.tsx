import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { NotificationProvider } from "@/context/NotificationContext";

const inter = Inter({ subsets: ["latin"], weight: ['400', '700', '900'] });

export const metadata: Metadata = {
  title: "RIDER HUD | DEGLOOR MART",
  description: "Next-gen delivery logistics interface",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <div className="hud-scanline" />
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <main className="min-h-screen relative p-4 md:p-8 max-w-lg mx-auto">
                {/* Corner Indicators */}
                <div className="fixed top-2 left-2 w-4 h-4 border-t border-l border-orange-500/50" />
                <div className="fixed top-2 right-2 w-4 h-4 border-t border-r border-orange-500/50" />
                <div className="fixed bottom-2 left-2 w-4 h-4 border-b border-l border-orange-500/50" />
                <div className="fixed bottom-2 right-2 w-4 h-4 border-b border-r border-orange-500/50" />

                {children}
              </main>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
