'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Utensils, Lock, Mail, User, Phone, MapPin, ChefHat, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '@/config/supabase';
import api from '@/lib/api';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
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
            router.push('/dashboard');
        } catch (err) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data: { user }, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { name, phone, role: 'restaurant_owner' }
                }
            });
            if (authError) throw authError;
            if (user) {
                await api.post('/restaurants', {
                    name,
                    phone,
                    address,
                    lat: 18.5492,
                    lng: 77.5750,
                    cuisine_type: ['Indian'],
                    avg_prep_time_mins: 20,
                    min_order_amount: 0,
                    delivery_radius_km: 5
                });
                router.push('/dashboard');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-pink-500 to-red-600">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-20 left-20 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow"></div>
                    <div className="absolute top-40 right-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>
                    <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" style={{animationDelay: '4s'}}></div>
                </div>
            </div>

            <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-5 gap-0 rounded-3xl overflow-hidden shadow-2xl bg-white animate-fadeIn">
                {/* Left Panel - Features */}
                <div className="hidden lg:flex lg:col-span-2 bg-gradient-to-br from-orange-500 to-pink-600 p-10 flex-col justify-between text-white">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                <ChefHat className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black">DegloorMart</h1>
                                <p className="text-sm text-white/90">Restaurant Partner</p>
                            </div>
                        </div>

                        <div className="space-y-6 mt-16">
                            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-5 rounded-2xl">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Grow Your Business</h3>
                                    <p className="text-white/80 text-sm">Reach thousands of hungry customers instantly</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-5 rounded-2xl">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Real-time Orders</h3>
                                    <p className="text-white/80 text-sm">Get notified instantly for new orders</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-5 rounded-2xl">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Utensils className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Easy Menu Management</h3>
                                    <p className="text-white/80 text-sm">Update your menu anytime, anywhere</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-white/60 mt-8">© 2026 DegloorMart. Empowering Restaurants.</p>
                </div>

                {/* Right Panel - Form */}
                <div className="lg:col-span-3 p-10 flex flex-col justify-center bg-white">
                    <div className="max-w-md mx-auto w-full">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl flex items-center justify-center">
                                <ChefHat className="w-7 h-7 text-white" />
                            </div>
                            <h1 className="text-2xl font-black bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">DegloorMart</h1>
                        </div>

                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                {isLogin ? 'Welcome Back!' : 'Join Our Network'}
                            </h2>
                            <p className="text-gray-600">
                                {isLogin ? 'Sign in to manage your restaurant' : 'Start growing your restaurant today'}
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 text-sm animate-fadeIn">
                                {error}
                            </div>
                        )}

                        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
                            {!isLogin && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Restaurant Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-900"
                                                placeholder="My Amazing Restaurant"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                                            <div className="relative group">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                                                <input
                                                    type="tel"
                                                    required
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="w-full pl-11 pr-3 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-900"
                                                    placeholder="9876543210"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                                            <div className="relative group">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                                                <input
                                                    type="text"
                                                    required
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    className="w-full pl-11 pr-3 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-900"
                                                    placeholder="Main Road"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-900"
                                        placeholder="owner@restaurant.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-900"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-orange-500 to-pink-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-6"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {isLogin ? 'Signing In...' : 'Creating Account...'}
                                    </div>
                                ) : (
                                    isLogin ? 'Sign In' : 'Create Account'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-gray-600">
                                {isLogin ? "New to DegloorMart?" : "Already have an account?"}
                                <button
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="text-orange-600 font-bold ml-1 hover:underline"
                                >
                                    {isLogin ? 'Sign Up' : 'Sign In'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
