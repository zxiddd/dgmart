'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/config/supabase';
import api from '@/src/lib/api';
import {
  User, Phone, Mail, Lock, Eye, EyeOff, Bike,
  ChevronRight, ChevronLeft, Loader2, Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Must match backend validator: 'bicycle' | 'motorcycle' | 'scooter' | 'car'
const VEHICLE_TYPES = [
  { label: 'Motorcycle', value: 'motorcycle' },
  { label: 'Scooter', value: 'scooter' },
  { label: 'Bicycle', value: 'bicycle' },
  { label: 'Car', value: 'car' },
];

const STEPS = ['Account', 'Vehicle', 'Done'];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    vehicleType: 'motorcycle',
    vehicleNumber: '',
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validateStep0 = () => {
    if (!form.name.trim()) return 'Full name is required';
    if (!/^\d{10}$/.test(form.phone)) return 'Enter a valid 10-digit phone number';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Enter a valid email address';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const validateStep1 = () => {
    if (!form.vehicleNumber.trim()) return 'Vehicle number is required';
    return null;
  };

  const handleNext = () => {
    const error = step === 0 ? validateStep0() : validateStep1();
    if (error) { toast.error(error); return; }
    setStep((s) => s + 1);
  };

  const handleRegister = async () => {
    const error = validateStep1();
    if (error) { toast.error(error); return; }
    setSubmitting(true);
    try {
      let session = null;

      // 1. Try to create Supabase auth account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            name: form.name.trim(),
            phone: form.phone,
            role: 'delivery_partner',
          },
        },
      });

      if (signUpError) {
        // If account already exists, sign them in silently and continue to create partner profile
        if (
          signUpError.message?.toLowerCase().includes('already registered') ||
          signUpError.message?.toLowerCase().includes('already exists') ||
          signUpError.message?.toLowerCase().includes('user already')
        ) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: form.email.trim(),
            password: form.password,
          });
          if (signInError) throw new Error('Account already exists but password is wrong. Try logging in.');
          session = signInData.session;
        } else {
          throw signUpError;
        }
      } else {
        // Fresh signup — get session
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData.session;
      }

      if (!session) throw new Error('Could not get session. Please try again.');

      // 2. Register delivery partner profile on backend
      // vehicle_type must match: 'bicycle' | 'motorcycle' | 'scooter' | 'car'
      await api.post('/delivery/register', {
        vehicle_type: form.vehicleType,        // already the correct backend value
        vehicle_number: form.vehicleNumber.trim().toUpperCase(),
      });

      setStep(2);
      toast.success('Registration successful! 🎉');
      setTimeout(() => router.replace('/dashboard'), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      // If partner profile already registered but they got past Supabase, send them to dashboard
      if (msg.toLowerCase().includes('already registered')) {
        toast.success('You already have an account! Redirecting...');
        setTimeout(() => router.replace('/dashboard'), 1500);
        return;
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const progressWidth = step === 0 ? 'w-1/3' : step === 1 ? 'w-2/3' : 'w-full';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-primary-500 to-orange-600 px-8 pt-10 pb-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            {step > 0 && step < 2 && (
              <button onClick={() => setStep((s) => s - 1)} className="p-1.5 rounded-xl bg-white/20">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-extrabold">Join as Delivery Partner</h1>
              <p className="text-orange-100 text-xs mt-0.5">
                Step {step + 1} of 2 — {STEPS[step]}
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className={`h-full bg-white rounded-full transition-all duration-500 ${progressWidth}`} />
          </div>
        </div>

        <div className="px-8 py-8">

          {/* STEP 0: Account Details */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Personal Details</h2>

              {/* Name */}
              <InputField
                label="Full Name"
                icon={<User className="w-4 h-4 text-gray-400" />}
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Rahul Sharma"
              />

              {/* Phone */}
              <InputField
                label="Phone Number"
                icon={<Phone className="w-4 h-4 text-gray-400" />}
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="9876543210"
                maxLength={10}
              />

              {/* Email */}
              <InputField
                label="Email Address"
                icon={<Mail className="w-4 h-4 text-gray-400" />}
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="rider@example.com"
              />

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Min. 8 characters"
                    className="input-field pl-10 pr-12"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    placeholder="Re-enter password"
                    className="input-field pl-10 pr-12"
                  />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button onClick={handleNext} className="btn-primary flex items-center justify-center gap-2 mt-2">
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 1: Vehicle Details */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Vehicle Details</h2>

              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Type</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {VEHICLE_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setForm((f) => ({ ...f, vehicleType: type.value }))}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold flex items-center gap-2 transition-all ${
                        form.vehicleType === type.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <Bike className="w-4 h-4" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle Number */}
              <InputField
                label="Vehicle Number"
                icon={<Hash className="w-4 h-4 text-gray-400" />}
                type="text"
                value={form.vehicleNumber}
                onChange={set('vehicleNumber')}
                placeholder="MH12AB1234"
                autoCapitalize="characters"
              />

              <button
                onClick={handleRegister}
                disabled={submitting}
                className="btn-primary flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Registering...</>
                ) : (
                  <>Complete Registration <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: Success */}
          {step === 2 && (
            <div className="text-center py-6 animate-bounce-in">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎉</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">You're registered!</h2>
              <p className="text-gray-500 text-sm mb-2">
                Your account is under review. You can start receiving orders once verified by our team.
              </p>
              <p className="text-primary-600 text-sm font-semibold">Redirecting to dashboard...</p>
              <div className="mt-4 flex justify-center">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          )}

          {/* Login link */}
          {step < 2 && (
            <div className="mt-5 text-center">
              <p className="text-sm text-gray-500">
                Already a partner?{' '}
                <button
                  onClick={() => router.push('/')}
                  className="text-primary-600 font-bold hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InputField({ label, icon, ...props }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2">{icon}</span>
        <input
          {...props}
          className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl
                     text-gray-900 placeholder-gray-400 text-sm font-medium
                     focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
                     transition-all"
        />
      </div>
    </div>
  );
}
