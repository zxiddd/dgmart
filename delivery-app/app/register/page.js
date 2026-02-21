'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Bike, Mail, Lock, User, Phone } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const router = useRouter();
    const { user, signUp, login, loading: authLoading } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        vehicle_type: 'motorcycle',
        vehicle_number: '',
    });

    const [submitting, setSubmitting] = useState(false);

    // Note: Removed automatic redirect to dashboard if user exists.
    // This allows existing users who are missing a partner profile to complete registration.

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const toastId = toast.loading('Creating your account...');

        try {
            // 1. Sign up or Login
            try {
                await signUp(formData.email, formData.password, {
                    name: formData.name,
                    phone: formData.phone,
                    role: 'delivery_partner'
                });
                toast.success('Account created!', { id: toastId });
            } catch (signupError) {
                if (signupError.message?.toLowerCase().includes('already') || signupError.status === 422) {
                    toast.loading('User exists, logging you in...', { id: toastId });
                    await login(formData.email, formData.password);
                    toast.success('Welcome back!', { id: toastId });
                } else {
                    throw signupError;
                }
            }

            // 2. Register partner details on backend
            // We retry a few times in case the user profile creation on the backend is slow
            toast.loading('Setting up rider profile...', { id: toastId });

            let success = false;
            let attempts = 0;
            while (!success && attempts < 3) {
                try {
                    attempts++;
                    await api.post('/delivery/register', {
                        vehicle_type: formData.vehicle_type,
                        vehicle_number: formData.vehicle_number,
                        bank_details: {
                            account_name: formData.name,
                            account_number: 'PENDING',
                            bank_name: 'PENDING',
                            ifsc_code: 'PENDING'
                        }
                    });
                    success = true;
                } catch (err) {
                    if (err.response?.status === 400 && err.response?.data?.message?.includes('Already')) {
                        success = true;
                        break;
                    }
                    if (attempts < 3) {
                        await new Promise(r => setTimeout(r, 2000));
                    } else {
                        throw err;
                    }
                }
            }

            toast.success('Ready to ride! 🚀', { id: toastId });
            setSubmitting(false); // Stop block
            router.push('/dashboard');
        } catch (error) {
            console.error('Registration Error:', error);
            const msg = error.response?.data?.message || error.message || 'Registration failed';
            toast.error(msg, { id: toastId });
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-6">
            <div className="max-w-md w-full mx-auto">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Bike size={32} className="text-primary" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">Partner Signup</h2>
                    <p className="mt-2 text-gray-500 text-lg">Earn money on your schedule</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Full Name"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white text-black text-lg"
                            />
                        </div>

                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email Address"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white text-black text-lg"
                            />
                        </div>

                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                name="phone"
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Phone Number"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white text-black text-lg"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create Password"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white text-black text-lg"
                            />
                        </div>

                        <div className="border-t border-gray-100 my-2 pt-4">
                            <p className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Vehicle Details</p>
                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    name="vehicle_type"
                                    value={formData.vehicle_type}
                                    onChange={handleChange}
                                    className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary text-black font-medium"
                                >
                                    <option value="motorcycle">Motorcycle</option>
                                    <option value="scooter">Scooter</option>
                                    <option value="bicycle">Bicycle</option>
                                </select>
                                <input
                                    name="vehicle_number"
                                    type="text"
                                    required
                                    value={formData.vehicle_number}
                                    onChange={handleChange}
                                    placeholder="Vehicle No."
                                    className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary text-black font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-6"
                    >
                        {submitting ? 'Processing...' : 'Complete Registration'}
                    </button>

                    <p className="text-center text-gray-500 font-medium mt-6">
                        Already have an account?{' '}
                        <Link href="/" className="font-bold text-primary hover:underline">
                            Login here
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
