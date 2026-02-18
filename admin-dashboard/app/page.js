'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Lock, Mail, Sparkles, TrendingUp, Shield, Zap } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            try {
                console.log('Verifying admin privileges at:', api.defaults.baseURL);
                await api.get('/admin/dashboard');
                router.push('/dashboard');
            } catch (roleError) {
                console.error('Role Verification Error:', roleError);
                if (roleError.response?.status === 403 || roleError.response?.status === 401) {
                    await supabase.auth.signOut();
                    setError('Access denied: You do not have admin privileges.');
                } else if (!roleError.response) {
                    setError(`Network Error: Cannot connect to server at ${api.defaults.baseURL}. Please ensure the backend is running.`);
                } else {
                    setError(`Error: ${roleError.response?.data?.message || 'Verification failed'}`);
                }
            }
        } catch (err) {
            console.error('Login Error:', err);
            setError(err.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow"></div>
                    <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow animation-delay-4000"></div>
                </div>
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-6xl grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl animate-fadeIn">
                {/* Left Side - Branding */}
                <div className="bg-gradient-to-br from-orange-500 to-pink-600 p-12 text-white hidden md:flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <Sparkles className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black">DegloorMart</h1>
                                <p className="text-sm text-white/80">Admin Portal</p>
                            </div>
                        </div>

                        <div className="space-y-6 mt-12">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Real-time Analytics</h3>
                                    <p className="text-white/80 text-sm">Monitor your platform's performance in real-time</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Secure Access</h3>
                                    <p className="text-white/80 text-sm">Bank-level security for your data</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Lightning Fast</h3>
                                    <p className="text-white/80 text-sm">Optimized for speed and efficiency</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-sm text-white/60">
                        © 2026 DegloorMart. All rights reserved.
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="bg-white p-12 flex flex-col justify-center">
                    <div className="max-w-sm mx-auto w-full">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                            <p className="text-gray-600">Sign in to access your dashboard</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2 animate-fadeIn">
                                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold">!</span>
                                </div>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-900"
                                        placeholder="admin@degloormart.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-900"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-orange-500 to-pink-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
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

                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-500">
                                Need help? <a href="#" className="text-orange-600 font-semibold hover:underline">Contact Support</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
