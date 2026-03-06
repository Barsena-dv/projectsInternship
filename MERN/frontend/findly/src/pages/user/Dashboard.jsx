import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import axiosInstance from '../../utils/axiosInstance';

const StatCard = ({ label, value, icon, color }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mt-0.5">{label}</p>
        </div>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axiosInstance.get('/requests/my');
                // Backend returns: { success: true, data: [...] }
                const raw = res.data;
                const list = Array.isArray(raw?.data) ? raw.data
                    : Array.isArray(raw?.requests) ? raw.requests
                        : Array.isArray(raw) ? raw
                            : [];
                setRequests(list);
            } catch (_) {
                // silent — user may have no requests yet
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const stats = {
        total: requests.length,
        open: requests.filter(r => r.status === 'OPEN').length,
        assigned: requests.filter(r => r.status === 'ASSIGNED').length,
        completed: requests.filter(r => r.status === 'COMPLETED').length,
    };

    const recent = requests.slice(0, 5);

    return (
        <div className="flex flex-col gap-6">
            {/* Greeting */}
            <div>
                <h1 className="text-2xl font-bold text-text-primary">
                    Welcome back, {user?.fullName?.split(' ')[0] || 'User'} 👋
                </h1>
                <p className="text-text-secondary mt-1">Here's an overview of your lost item requests.</p>
            </div>

            {/* Stat Cards */}
            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse h-24" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Requests"
                        value={stats.total}
                        color="bg-primary-blue/10"
                        icon={
                            <svg className="w-6 h-6 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        }
                    />
                    <StatCard
                        label="Open"
                        value={stats.open}
                        color="bg-yellow-50"
                        icon={
                            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                    <StatCard
                        label="Assigned"
                        value={stats.assigned}
                        color="bg-indigo-50"
                        icon={
                            <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        }
                    />
                    <StatCard
                        label="Completed"
                        value={stats.completed}
                        color="bg-green-50"
                        icon={
                            <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
                <Link
                    to="/user/create"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-blue hover:bg-deep-indigo text-white text-sm font-semibold shadow-md shadow-primary-blue/20 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    New Request
                </Link>
                <Link
                    to="/user/requests"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-text-primary text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                    View All Requests
                </Link>
            </div>

            {/* Recent Requests */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest">Recent Requests</h2>
                    <Link to="/user/requests" className="text-xs font-semibold text-primary-blue hover:text-deep-indigo">View All →</Link>
                </div>

                {loading ? (
                    <div className="divide-y divide-gray-50">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 shrink-0" />
                                <div className="flex-1 flex flex-col gap-1.5">
                                    <div className="h-3.5 w-2/3 bg-gray-100 rounded" />
                                    <div className="h-2.5 w-1/4 bg-gray-100 rounded" />
                                </div>
                                <div className="h-5 w-16 bg-gray-100 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : recent.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                        <p className="text-text-secondary text-sm">No requests found.</p>
                        <Link to="/user/create" className="text-primary-blue text-sm font-semibold hover:underline mt-1 inline-block">Create your first request →</Link>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {recent.map(req => {
                            const id = req._id || req.id;
                            return (
                                <Link
                                    key={id}
                                    to={`/user/requests/${id}`}
                                    className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-primary-blue/10 flex items-center justify-center text-base shrink-0">
                                        {getCategoryIcon(req.category)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-text-primary truncate">{req.title || 'Untitled'}</p>
                                        <p className="text-xs text-text-secondary mt-0.5">{req.generalLocation || '—'}</p>
                                    </div>
                                    <StatusBadge status={req.status} />
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

const ICONS = { Electronics: '💻', Wallet: '👛', Documents: '📄', Bags: '👜', Keys: '🗝️', Jewelry: '💍', Other: '📦' };
const getCategoryIcon = (cat) => ICONS[cat] || '📦';

export default Dashboard;
