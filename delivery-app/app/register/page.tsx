'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, Phone, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Supabase Auth Signup
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                        phone: formData.phone,
                    },
                },
            });

            if (authError) throw authError;

            // 2. Sync with Backend (ensure user is created in public.users)
            // Note: Backend should ideally handle this via trigger, but we'll call an explicit sync if needed.
            await api.post('/auth/rider/sync', {
                id: authData.user?.id,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                role: 'rider',
            });

            router.push('/dashboard');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Registration failed';
            setError(message);
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col justify-center min-h-[90vh] py-10">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hud-border p-8"
            >
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <UserPlus className="w-4 h-4 text-orange-500" />
                        <span className="text-[10px] uppercase tracking-[0.3em] text-orange-500/50 font-mono">
                            New Operator Uplink
                        </span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase">
                        Onboard <span className="text-orange-500 text-outline">Rider</span>
                    </h1>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[8px] uppercase tracking-widest text-white/40 font-bold mb-1 block">Full Legal Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors font-mono"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[8px] uppercase tracking-widest text-white/40 font-bold mb-1 block">Communication Uplink (Email)</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors font-mono"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[8px] uppercase tracking-widest text-white/40 font-bold mb-1 block">Mobile Frequency (Phone)</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-black border border-white/10 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors font-mono"
                                placeholder="10-digit mobile"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[8px] uppercase tracking-widest text-white/40 font-bold mb-1 block">Access Encryption (Password)</label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-black border border-white/10 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors font-mono"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-500 text-[10px] uppercase font-bold text-center bg-red-500/5 p-2">
                            Sync Error: {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-cyber w-full flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authorize & Join'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[8px] text-white/20 uppercase tracking-widest">
                        Already registered? <a href="/login" className="text-orange-500 font-bold">Login Here</a>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
