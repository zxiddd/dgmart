'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Utensils, Lock, Mail, User, Phone, MapPin } from 'lucide-react';
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

    // Auth Context login triggers session update, but we might need manual handling for signup flow
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
            // 1. Supabase Signup
            const { data: { user, session }, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { name, phone, role: 'restaurant_owner' } // Metadata
                }
            });

            if (authError) throw authError;

            if (user) {
                // 2. Create Restaurant in Backend
                // We need the session to be active. useAuth might update async.
                // We can use the session returned by signUp if auto-sign-in is enabled.
                // If email confirmation is required, this flow breaks. Assuming disabled for now or auto-confirmation.

                // Wait a moment for session propagation if needed, or manually set header if api.js relies on global session

                // Let's rely on api interceptor ensuring token if session exists in supabase client

                await api.post('/restaurants', {
                    name,
                    phone,
                    address,
                    lat: 18.5492, // Degloor approximate
                    lng: 77.5750,
                    cuisine_type: ['Indian'], // Default
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Utensils size={40} className="text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">{isLogin ? 'Restaurant Partner' : 'Join Degloor Mart'}</h1>
                    <p className="text-gray-500 mt-2">{isLogin ? 'Manage your restaurant' : 'Grow your business with us'}</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
                    {!isLogin && (
                        <>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Restaurant Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-gray-200 rounded-xl focus:border-primary focus:ring-primary focus:bg-white transition-all text-black"
                                        placeholder="My Tasty Restaurant"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-gray-200 rounded-xl focus:border-primary focus:ring-primary focus:bg-white transition-all text-black"
                                        placeholder="9876543210"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        required
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-gray-200 rounded-xl focus:border-primary focus:ring-primary focus:bg-white transition-all text-black"
                                        placeholder="Main Road, Degloor"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-gray-200 rounded-xl focus:border-primary focus:ring-primary focus:bg-white transition-all text-black"
                                placeholder="owner@restaurant.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-gray-200 rounded-xl focus:border-primary focus:ring-primary focus:bg-white transition-all text-black"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 active:scale-[0.98] transition-all disabled:opacity-70"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-500">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-primary font-bold ml-1 hover:underline"
                        >
                            {isLogin ? 'Sign Up' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
