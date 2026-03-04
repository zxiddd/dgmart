'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <div className="flex flex-col justify-center min-h-[80vh]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="hud-border p-8"
            >
                <div className="mb-8">
                    <h1 className="text-4xl font-black tracking-tighter hud-glitch-text uppercase">
                        Rider Access
                    </h1>
                    <p className="text-orange-500/60 text-xs tracking-widest mt-2 uppercase font-mono">
                        System Authentication Required
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-orange-500 font-bold mb-2 block">
                            Identifier (Email)
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-orange-500/20 px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors font-mono"
                            placeholder="operator@nexus.dm"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-orange-500 font-bold mb-2 block">
                            Security Key (Password)
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-orange-500/20 px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors font-mono"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-red-500 text-[10px] uppercase font-bold tracking-widest bg-red-500/10 p-2 border-l-2 border-red-500"
                        >
                            Auth Failure: {error}
                        </motion.p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-cyber w-full flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Initialize Session'}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center">
                    <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-mono">
                        V.2025.CORE.STABLE
                    </p>
                    <a href="/register" className="text-[10px] text-orange-500/60 hover:text-orange-500 transition-colors uppercase tracking-widest font-bold">
                        Request Uplink
                    </a>
                </div>
            </motion.div>
        </div>
    );
}
