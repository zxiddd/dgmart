'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { useSocket } from '@/src/context/SocketContext';
import api from '@/src/lib/api';
import {
  Phone, MapPin, Package, ChevronRight,
  CheckCircle2, Circle, Loader2, X, User, Banknote, CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const STEPS_PREPAID = [
  { key: 'accepted_by_driver', label: 'Order Accepted', sub: 'Head to the restaurant', emoji: '✅' },
  { key: 'picked_up', label: 'Picked Up', sub: 'Collected from restaurant', emoji: '🛵', action: 'MARK PICKED UP' },
  { key: 'out_for_delivery', label: 'Out for Delivery', sub: 'On the way to customer', emoji: '🏎️', action: 'OUT FOR DELIVERY' },
  { key: 'delivered', label: 'Delivered', sub: 'Order handed to customer', emoji: '🎉', action: 'MARK DELIVERED' },
];

const STEPS_COD = [
  { key: 'accepted_by_driver', label: 'Order Accepted', sub: 'Head to the restaurant', emoji: '✅' },
  { key: 'picked_up', label: 'Picked Up', sub: 'Collected from restaurant', emoji: '🛵', action: 'MARK PICKED UP' },
  { key: 'out_for_delivery', label: 'Out for Delivery', sub: 'On the way to customer', emoji: '🏎️', action: 'OUT FOR DELIVERY' },
  { key: 'collect_cash', label: 'Collect Cash', sub: 'Collect payment from customer', emoji: '💰', action: 'CASH COLLECTED' },
  { key: 'delivered', label: 'Delivered', sub: 'Enter OTP to confirm delivery', emoji: '🎉', action: 'MARK DELIVERED' },
];

export default function ActiveOrderPage() {
  const { profile } = useAuth();
  const { activeOrders, setActiveOrders } = useSocket();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCashCollect, setShowCashCollect] = useState(false);
  const [cashCollected, setCashCollected] = useState(false);
  const [earnings, setEarnings] = useState(null);

  const isCOD = order?.payment_method === 'cod';
  const STEPS = isCOD ? STEPS_COD : STEPS_PREPAID;

  const loadActiveOrder = useCallback(async () => {
    try {
      const res = await api.get('/delivery/orders');
      const activeList = res.data?.active || [];
      
      if (activeList.length > 0) {
        setActiveOrders(activeList);
      }

      let active;
      if (orderId) {
        active = activeList.find(o => (o.order_id || o.id) === orderId);
      } else {
        active = activeList[0];
      }
      
      if (active) {
        setOrder(active);
      } else if (activeOrders.length > 0) {
        active = orderId ? activeOrders.find(o => (o.order_id || o.id) === orderId) : activeOrders[0];
        if (active) setOrder(active);
      }
    } catch (err) {
      if (activeOrders.length > 0) {
        const active = orderId ? activeOrders.find(o => (o.order_id || o.id) === orderId) : activeOrders[0];
        if (active) setOrder(active);
      }
    }
  }, [activeOrders, orderId, setActiveOrders]);

  useEffect(() => {
    loadActiveOrder();
  }, [loadActiveOrder]);

  useEffect(() => {
    if (activeOrders.length > 0) {
      const active = orderId ? activeOrders.find(o => (o.order_id || o.id) === orderId) : activeOrders[0];
      if (active && (!order || (active.order_id || active.id) === (order.order_id || order.id))) {
        setOrder((prev) => prev ? { ...prev, ...active } : active);
      }
    }
  }, [activeOrders, orderId]);

  let currentStatus = order?.order_status || order?.status || 'accepted_by_driver';
  // Normalize intermediate restaurant statuses for the rider stepper
  if (['preparing', 'ready', 'searching_rider'].includes(currentStatus)) {
    currentStatus = 'accepted_by_driver';
  }
  // For COD: if cash has been collected locally, advance to collect_cash step
  if (isCOD && cashCollected && currentStatus === 'out_for_delivery') {
    currentStatus = 'collect_cash';
  }
  const currentStepIdx = STEPS.findIndex((s) => s.key === currentStatus);

  const handleStatusUpdate = async (newStatus) => {
    // For COD: "collect_cash" is a local step, not a server status
    if (newStatus === 'collect_cash') {
      setShowCashCollect(true);
      return;
    }
    if (newStatus === 'delivered') {
      setShowOTP(true);
      return;
    }
    setUpdating(true);
    try {
      const assignmentId = order?.assignment_id || order?.id;
      if (!assignmentId) throw new Error('Assignment ID not found. Please refresh.');
      await api.put(`/delivery/orders/${assignmentId}/status`, { status: newStatus });
      setOrder((prev) => ({ ...prev, order_status: newStatus, status: newStatus }));
      setActiveOrders((prev) => prev.map(o => 
        (o.order_id || o.id) === (order.order_id || order.id) ? { ...o, order_status: newStatus, status: newStatus } : o
      ));
      toast.success(newStatus === 'picked_up' ? 'Marked as picked up! 🛵' : 'Status updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCashCollected = () => {
    setCashCollected(true);
    setShowCashCollect(false);
    toast.success('Cash collected! Now confirm delivery with OTP 💰');
  };

  const handleDelivered = async (otp) => {
    setUpdating(true);
    try {
      const assignmentId = order?.assignment_id || order?.id;
      if (!assignmentId) throw new Error('Assignment ID not found. Please refresh.');
      const res = await api.put(`/delivery/orders/${assignmentId}/status`, {
        status: 'delivered',
        otp,
      });
      setShowOTP(false);
      setCashCollected(false);
      setEarnings(res.data?.earnings || order?.delivery_fee || order?.earning || 40);
      setShowSuccess(true);
      setActiveOrders((prev) => prev.filter(o => (o.order_id || o.id) !== (order.order_id || order.id)));
      setOrder(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Delivery failed';
      if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('invalid')) {
        throw new Error('WRONG_OTP');
      }
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  // No active order
  if (!order && !showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 text-center py-20">
        <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
          <Package className="w-9 h-9 text-gray-400" />
        </div>
        <h3 className="text-lg font-extrabold text-gray-700 mb-2">No Active Delivery</h3>
        <p className="text-sm text-gray-400 mb-6">Accept an order from the Home tab to start delivering.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-primary-500 text-white font-bold rounded-2xl active:scale-95 transition-transform"
        >
          Go to Home
        </button>
      </div>
    );
  }

  const orderTotal = order?.order_total || order?.order_details?.total || order?.total || 0;

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Success Modal */}
      {showSuccess && <SuccessModal earnings={earnings} onDone={() => router.replace('/dashboard')} />}

      {/* OTP Modal */}
      {showOTP && (
        <OTPModal
          onConfirm={handleDelivered}
          onClose={() => setShowOTP(false)}
          loading={updating}
        />
      )}

      {/* Cash Collect Modal */}
      {showCashCollect && (
        <CashCollectModal
          amount={orderTotal}
          onConfirm={handleCashCollected}
          onClose={() => setShowCashCollect(false)}
        />
      )}

      {/* Header */}
      <div className="bg-white px-5 pt-6 pb-5 border-b border-gray-100">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Active Delivery</p>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">
              {order?.restaurant_name || 'Restaurant'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 font-medium">
              Order #{order?.order_number || '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Your earning</p>
            <p className="text-lg font-extrabold text-green-600">
              ₹{order?.delivery_fee || order?.earning || '—'}
            </p>
          </div>
        </div>

        {/* Order Amount & Payment Badge */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Order Amount:</span>
            <span className="text-base font-bold text-gray-900">₹{orderTotal}</span>
          </div>
          <span className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold',
            isCOD
              ? 'bg-orange-100 text-orange-700 border border-orange-200'
              : 'bg-green-100 text-green-700 border border-green-200'
          )}>
            {isCOD ? (
              <><Banknote className="w-3.5 h-3.5" /> Cash on Delivery</>
            ) : (
              <><CreditCard className="w-3.5 h-3.5" /> Prepaid</>
            )}
          </span>
        </div>
      </div>

      {/* Order Info Card */}
      <div className="mx-4 mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-50">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-primary-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">{order?.customer_name || 'Customer'}</p>
            {order?.customer_phone && (
              <p className="text-xs text-gray-500">{order.customer_phone}</p>
            )}
          </div>
          {order?.customer_phone && (
            <a
              href={`tel:${order.customer_phone}`}
              className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
            >
              <Phone className="w-5 h-5 text-green-600" />
            </a>
          )}
        </div>

        {order?.delivery_address && (
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-0.5">DROP ADDRESS</p>
              <p className="text-sm text-gray-700 font-medium leading-snug">{order.delivery_address}</p>
            </div>
          </div>
        )}
      </div>

      {/* COD Alert */}
      {isCOD && !cashCollected && currentStepIdx >= 2 && (
        <div className="mx-4 mt-3 bg-orange-50 border border-orange-200 rounded-2xl p-3 flex items-center gap-3">
          <Banknote className="w-5 h-5 text-orange-600 flex-shrink-0" />
          <p className="text-sm text-orange-700 font-medium">
            Collect <span className="font-extrabold">₹{orderTotal}</span> cash from customer before confirming delivery
          </p>
        </div>
      )}

      {/* Status Stepper */}
      <div className="mx-4 mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-4">Delivery Progress</p>

        <div className="space-y-1">
          {STEPS.map((step, idx) => {
            const isDone = currentStepIdx > idx;
            const isCurrent = currentStepIdx === idx;
            const isNext = currentStepIdx + 1 === idx;
            const isLocked = idx > currentStepIdx + 1;

            return (
              <div key={step.key}>
                <div className={clsx(
                  'flex items-center gap-3 p-3 rounded-xl transition-all',
                  isCurrent && 'bg-orange-50',
                  isDone && 'opacity-60',
                )}>
                  {/* Step indicator */}
                  <div className={clsx(
                    'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base',
                    isDone && 'bg-green-100',
                    isCurrent && 'bg-primary-100',
                    (isNext || isLocked) && 'bg-gray-100',
                  )}>
                    {isDone ? '✅' : step.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={clsx(
                      'text-sm font-bold leading-tight',
                      isDone ? 'text-green-600' : isCurrent ? 'text-primary-700' : 'text-gray-400',
                    )}>
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{step.sub}</p>
                  </div>

                  {isDone && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
                  {isCurrent && <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse flex-shrink-0" />}
                </div>

                {/* Connector line */}
                {idx < STEPS.length - 1 && (
                  <div className={clsx(
                    'w-0.5 h-4 ml-7 rounded-full',
                    idx < currentStepIdx ? 'bg-green-300' : 'bg-gray-200'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Button */}
      {currentStepIdx < STEPS.length - 1 && (
        <div className="mx-4 mt-4 mb-2">
          <NextActionButton
            step={STEPS[currentStepIdx + 1]}
            loading={updating}
            onPress={() => handleStatusUpdate(STEPS[currentStepIdx + 1].key)}
          />
        </div>
      )}

      {/* OTP hint */}
      {STEPS[currentStepIdx + 1]?.key === 'delivered' && (
        <p className="text-center text-xs text-gray-400 mb-4 px-8">
          💡 Ask the customer for the 4-digit OTP from their DegloorMart app to confirm delivery
        </p>
      )}

      {/* Cash collection hint */}
      {STEPS[currentStepIdx + 1]?.key === 'collect_cash' && (
        <p className="text-center text-xs text-gray-400 mb-4 px-8">
          💰 You need to collect ₹{orderTotal} cash from the customer before completing delivery
        </p>
      )}
    </div>
  );
}

/* ─── Next Action Button ─────────────────────────────── */
function NextActionButton({ step, loading, onPress }) {
  const colorMap = {
    picked_up: 'from-blue-500 to-blue-600 shadow-blue-200',
    out_for_delivery: 'from-purple-500 to-purple-600 shadow-purple-200',
    collect_cash: 'from-orange-500 to-amber-600 shadow-orange-200',
    delivered: 'from-green-500 to-emerald-500 shadow-green-200',
  };
  return (
    <button
      onClick={onPress}
      disabled={loading}
      className={clsx(
        'w-full py-4 rounded-2xl text-white font-extrabold text-base flex items-center justify-center gap-2 bg-gradient-to-r shadow-lg active:scale-[0.98] transition-all disabled:opacity-60',
        colorMap[step.key] || 'from-primary-500 to-orange-600 shadow-orange-200'
      )}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {step.emoji} {step.action}
          <ChevronRight className="w-5 h-5" />
        </>
      )}
    </button>
  );
}

/* ─── Cash Collect Modal ─────────────────────────────── */
function CashCollectModal({ amount, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 animate-scale-up shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Collect Cash</h2>
            <p className="text-sm text-gray-500 mt-1">Collect payment from the customer</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="bg-orange-50 rounded-2xl p-6 text-center mb-6 border border-orange-100">
          <Banknote className="w-10 h-10 text-orange-500 mx-auto mb-2" />
          <p className="text-xs text-gray-400 font-semibold mb-1">AMOUNT TO COLLECT</p>
          <p className="text-4xl font-black text-orange-600">₹{amount}</p>
          <p className="text-xs text-gray-400 mt-2">Cash on Delivery</p>
        </div>

        <p className="text-center text-xs text-gray-400 mb-5">
          Make sure you have received the exact amount from the customer before confirming
        </p>

        <button
          onClick={onConfirm}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-extrabold rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          💰 CASH COLLECTED — ₹{amount}
        </button>
      </div>
    </div>
  );
}

/* ─── OTP Modal ──────────────────────────────────────── */
function OTPModal({ onConfirm, onClose, loading }) {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef()];

  const handleInput = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    setError('');
    if (val && idx < 3) refs[idx + 1].current?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setOtp(pasted.split(''));
      refs[3].current?.focus();
    }
  };

  const handleConfirm = async () => {
    const code = otp.join('');
    if (code.length < 4) { setError('Enter the 4-digit OTP'); return; }
    setSubmitting(true);
    try {
      await onConfirm(code);
    } catch (err) {
      if (err.message === 'WRONG_OTP') {
        setError('Wrong OTP. Ask the customer again.');
        setShake(true);
        setOtp(['', '', '', '']);
        refs[0].current?.focus();
        setTimeout(() => setShake(false), 600);
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    setTimeout(() => refs[0].current?.focus(), 100);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 animate-scale-up shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Delivery OTP</h2>
            <p className="text-sm text-gray-500 mt-1">Ask the customer for their 4-digit code</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* OTP Boxes */}
        <div
          className={clsx('flex gap-3 justify-center mb-4', shake && 'animate-shake')}
          onPaste={handlePaste}
        >
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={refs[idx]}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInput(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={clsx(
                'otp-input',
                digit && 'border-primary-500 bg-primary-50 text-primary-700',
                error && 'border-red-400 bg-red-50'
              )}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-center text-sm text-red-500 font-semibold mb-3">{error}</p>
        )}

        {/* Hint */}
        <p className="text-center text-xs text-gray-400 mb-5">
          The customer sees this code in their DegloorMart app under order details
        </p>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={submitting || otp.join('').length < 4}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold rounded-2xl shadow-lg shadow-green-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {submitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Confirming...</>
          ) : (
            <>✅ CONFIRM DELIVERY</>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Success Modal ──────────────────────────────────── */
function SuccessModal({ earnings, onDone }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 text-center animate-bounce-in shadow-2xl">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Delivered!</h2>
        <p className="text-gray-500 text-sm mb-5">Great job! The customer has received their order.</p>

        <div className="bg-green-50 rounded-2xl p-4 mb-6">
          <p className="text-xs text-gray-400 font-semibold mb-1">YOU EARNED</p>
          <p className="text-3xl font-black text-green-600">₹{earnings}</p>
          <p className="text-xs text-gray-400 mt-1">Added to your wallet</p>
        </div>

        <button
          onClick={onDone}
          className="w-full py-4 bg-primary-500 text-white font-extrabold rounded-2xl active:scale-95 transition-transform"
        >
          Continue Delivering →
        </button>
      </div>
    </div>
  );
}
