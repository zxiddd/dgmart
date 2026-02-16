import BottomNav from '@/components/BottomNav';

export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <main className="max-w-md mx-auto min-h-screen bg-white shadow-2xl overflow-hidden">
                {children}
            </main>
            <div className="max-w-md mx-auto">
                <BottomNav />
            </div>
        </div>
    );
}
