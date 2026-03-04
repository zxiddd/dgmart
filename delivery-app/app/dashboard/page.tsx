'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package,
    MapPin,
    ChevronRight,
    CheckCircle2,
    Clock,
    LogOut,
    Signal,
    Bell,
    Box,
    Loader2
} from 'lucide-react';

interface Order {
    id: string;
    user_name: string;
    total_amount: number;
    payment_method: string;
    delivery_address: string;
    status: string;
}

export default function Dashboard() {
    const { signOut } = useAuth();
    const { socket, connected } = useSocket();
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [activeRes, availableRes] = await Promise.all([
                api.get('/rider/orders/active'),
                api.get('/rider/orders/available')
            ]);
            setActiveOrders(activeRes.data);
            setAvailableOrders(availableRes.data);
        } catch (err) {
            console.error('Data fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('newOrder', (order: Order) => {
            setAvailableOrders(prev => [order, ...prev]);
        });

        socket.on('orderAssigned', (orderId: string) => {
            setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
        });

        return () => {
            socket.off('newOrder');
            socket.off('orderAssigned');
        };
    }, [socket]);

    const handleAcceptOrder = async (orderId: string) => {
        try {
            await api.post(`/rider/orders/${orderId}/accept`);
            await fetchData();
        } catch (err) {
            console.error('Accept order error:', err);
            alert('Failed to accept assignment. It may have been taken.');
        }
    };

    const handleUpdateStatus = async (orderId: string, status: string) => {
        try {
            await api.patch(`/rider/orders/${orderId}/status`, { status });
            await fetchData();
        } catch (err) {
            console.error('Update status error:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            <header className="flex justify-between items-center mb-8 border-b border-orange-500/10 pb-4">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter">
                        Sector <span className="text-orange-500">Alpha-1</span>
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_8px_green]' : 'bg-red-500'}`} />
                        <span className="text-[8px] uppercase tracking-widest text-white/40 font-mono">
                            {connected ? 'Comms Stable' : 'Signal Lost'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => signOut()}
                    className="p-2 border border-white/10 hover:border-red-500/50 hover:text-red-400 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </header>

            <div className="grid grid-cols-2 gap-4">
                <div className="hud-border p-4 border-l-2 border-l-orange-500">
                    <p className="text-[8px] uppercase tracking-widest text-orange-500/60 mb-1">Active Tasks</p>
                    <p className="text-2xl font-black">{activeOrders.length}</p>
                </div>
                <div className="hud-border p-4 border-l-2 border-l-blue-500">
                    <p className="text-[8px] uppercase tracking-widest text-blue-500/60 mb-1">Queue</p>
                    <p className="text-2xl font-black">{availableOrders.length}</p>
                </div>
            </div>

            <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Signal className="w-3 h-3 text-orange-500" />
                    <h3 className="text-[10px] uppercase font-bold tracking-[0.2em]">Active Operations</h3>
                </div>

                <AnimatePresence mode="popLayout">
                    {activeOrders.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="hud-border p-8 border-dashed border-white/5 text-center"
                        >
                            <Box className="w-8 h-8 text-white/10 mx-auto mb-2" />
                            <p className="text-[10px] uppercase tracking-widest text-white/20">No active deployments</p>
                        </motion.div>
                    ) : (
                        activeOrders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                isActive
                                onUpdateStatus={(status: string) => handleUpdateStatus(order.id, status)}
                            />
                        ))
                    )}
                </AnimatePresence>
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-3 h-3 text-blue-400" />
                    <h3 className="text-[10px] uppercase font-bold tracking-[0.2em]">Broadcast Queue</h3>
                </div>

                <div className="space-y-4">
                    <AnimatePresence>
                        {availableOrders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onAccept={() => handleAcceptOrder(order.id)}
                            />
                        ))}
                    </AnimatePresence>
                    {availableOrders.length === 0 && (
                        <p className="text-[8px] text-center text-white/10 uppercase tracking-widest py-4">Scanning for signals...</p>
                    )}
                </div>
            </section>
        </div>
    );
}

interface OrderCardProps {
    order: Order;
    isActive?: boolean;
    onAccept?: () => void;
    onUpdateStatus?: (status: string) => void;
}

function OrderCard({ order, isActive = false, onAccept, onUpdateStatus }: OrderCardProps) {
    const getNextStatus = (current: string) => {
        if (current === 'assigned') return 'collected';
        if (current === 'collected') return 'delivered';
        return null;
    };

    const nextStatus = getNextStatus(order.status);

    return (
        <motion.div
            layout
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`hud-border p-4 ${isActive ? 'border-orange-500/40 bg-orange-500/[0.02]' : 'border-white/10 hover:border-white/20'}`}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-[8px] font-mono text-white/40 mb-1">#{order.id?.slice(0, 8)}</p>
                    <h4 className="font-bold uppercase tracking-tight text-sm">{order.user_name || 'Anonymous User'}</h4>
                </div>
                <div className="text-right">
                    <p className="text-orange-500 font-black text-sm">₹{order.total_amount}</p>
                    <p className="text-[8px] uppercase tracking-widest text-white/30 font-mono">
                        {order.payment_method === 'cod' ? 'Collect Cash' : 'Prepaid'}
                    </p>
                </div>
            </div>

            <div className="space-y-3 mb-4 font-mono text-[10px]">
                <div className="flex items-start gap-2">
                    <MapPin className="w-3 h-3 text-orange-500 mt-0.5" />
                    <p className="text-white/80 leading-relaxed uppercase">
                        {order.delivery_address}
                    </p>
                </div>
                {isActive && (
                    <div className="flex items-center gap-2 text-white/40">
                        <Clock className="w-3 h-3" />
                        <p className="uppercase">Status: <span className="text-orange-500 font-bold">{order.status}</span></p>
                    </div>
                )}
            </div>

            {isActive ? (
                <div className="space-y-2">
                    {nextStatus && (
                        <button
                            onClick={() => onUpdateStatus?.(nextStatus)}
                            className="btn-cyber w-full py-2 !bg-orange-500 !text-black flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-3 h-3" />
                            Complete {nextStatus}
                        </button>
                    )}
                </div>
            ) : (
                <button
                    onClick={onAccept}
                    className="btn-cyber w-full py-2 flex items-center justify-center gap-2"
                >
                    Engage Operation
                    <ChevronRight className="w-3 h-3 animate-pulse" />
                </button>
            )}
        </motion.div>
    );
}
