'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { User, Lock, Unlock, Mail, Phone, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [activeTab, setActiveTab] = useState('all');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let url = `/admin/users?page=${page}&limit=20`;
            if (activeTab !== 'all') {
                url += `&role=${activeTab}`;
            }
            const res = await api.get(url);
            if (res.data.success) {
                setUsers(res.data.data.users);
                setTotalPages(Math.ceil(res.data.data.pagination.total / 20));
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, activeTab]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setPage(1);
    };

    const handleToggleStatus = async (user) => {
        if (!confirm(`Are you sure you want to ${user.is_active === false ? 'unblock' : 'block'} this user?`)) return;
        try {
            await api.put(`/admin/users/${user.id}/toggle`);
            toast.success('User status updated');
            fetchUsers();
        } catch (error) {
            console.error('Failed to toggle:', error);
            toast.error('Action failed');
        }
    };

    const tabs = [
        { id: 'all', label: 'All Users' },
        { id: 'customer', label: 'Customers' },
        { id: 'restaurant_owner', label: 'Restaurants' },
        { id: 'delivery_partner', label: 'Delivery Partners' },
        { id: 'admin', label: 'Admins' },
    ];

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Users Management</h1>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-2 mb-6 border-b border-gray-200 pb-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-primary text-primary bg-primary/5'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">Loading users...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-600">
                            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Joined</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{u.name || 'No Name'}</p>
                                                    <p className="text-xs text-gray-400">ID: {u.id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm">
                                                <div className="flex items-center gap-2"><Mail size={14} /> {u.email}</div>
                                                <div className="flex items-center gap-2"><Phone size={14} /> {u.phone || 'N/A'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                u.role === 'delivery_partner' ? 'bg-orange-100 text-orange-700' :
                                                    u.role === 'restaurant_owner' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {u.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} />
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(u)}
                                                className={`p-2 rounded-lg transition-colors ${u.is_active === false ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                title={u.is_active === false ? "Unblock" : "Block"}
                                            >
                                                {u.is_active === false ? <Lock size={18} /> : <Unlock size={18} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && <div className="p-8 text-center text-gray-500">No users found.</div>}
                    </div>
                )}
                {/* Pagination Controls could go here */}
                <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="disabled:opacity-50">Previous</button>
                    <span>Page {page} of {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="disabled:opacity-50">Next</button>
                </div>
            </div>
        </div>
    );
}
