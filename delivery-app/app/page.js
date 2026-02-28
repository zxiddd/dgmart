'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Bike, Lock, Mail, MapPin, DollarSign, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { user, login, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Only auto-redirect if already logged in on initial load, but don't fight the login form
        if (!authLoading && user && !loading) {
            window.location.href = '/dashboard';
        }
    }, [user, authLoading, loading]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            window.location.href = '/dashboard';
        } catch (err) {
            console.error(err);
            toast.error('Invalid email or password');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-20 left-20 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow"></div>
                    <div className="absolute top-40 right-20 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-5 gap-0 rounded-3xl overflow-hidden shadow-2xl bg-white animate-fadeIn">
                {/* Left Panel - Features */}
                <div className="hidden lg:flex lg:col-span-2 bg-gradient-to-br from-blue-600 to-purple-600 p-10 flex-col justify-between text-white">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                <Bike className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black">DegloorMart</h1>
                                <p className="text-sm text-white/90">Delivery Partner</p>
                            </div>
                        </div>

                        <div className="space-y-6 mt-16">
                            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-5 rounded-2xl">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Earn More</h3>
                                    <p className="text-white/80 text-sm">Flexible earning opportunities with competitive rates</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-5 rounded-2xl">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Work Anytime</h3>
                                    <p className="text-white/80 text-sm">Choose your own schedule and work hours</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-5 rounded-2xl">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Grow Your Income</h3>
                                    <p className="text-white/80 text-sm">Track earnings and get paid instantly</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-white/60 mt-8">© 2026 DegloorMart. Empowering Delivery Partners.</p>
                </div>

                {/* Right Panel - Login Form */}
                <div className="lg:col-span-3 p-10 flex flex-col justify-center bg-white">
                    <div className="max-w-md mx-auto w-full">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                                <Bike className="w-7 h-7 text-white" />
                            </div>
                            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">DegloorMart</h1>
                        </div>

                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome, Rider!</h2>
                            <p className="text-gray-600">Sign in to start delivering and earning</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-gray-900"
                                        placeholder="rider@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-gray-900"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-6"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Signing In...
                                    </div>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-gray-600">
                                New to DegloorMart?{' '}
                                <Link href="/register" className="text-blue-600 font-bold hover:underline">
                                    Join as Rider
                                </Link>
                            </p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                            <p className="text-xs text-gray-500">
                                By signing in, you agree to our Terms & Conditions
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
