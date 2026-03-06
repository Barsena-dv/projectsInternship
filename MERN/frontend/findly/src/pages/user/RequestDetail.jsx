import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/ui/ConfirmModal';
import StatusBadge from '../../components/ui/StatusBadge';
import axiosInstance from '../../utils/axiosInstance';

const CATEGORY_ICONS = { Electronics: '💻', Wallet: '👛', Documents: '📄', Bags: '👜', Keys: '🗝️', Jewelry: '💍', Other: '📦' };

const InfoRow = ({ label, value }) => (
    <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{label}</span>
        <span className="text-sm text-text-primary">{value || '—'}</span>
    </div>
);

const RequestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const res = await axiosInstance.get(`/requests/${id}`);
                // Backend: { success: true, data: request }
                const requestData = res.data?.data || res.data?.request || res.data;
                if (!requestData || !requestData._id) {
                    toast.error('Request not found or invalid response.');
                    navigate('/user/requests');
                    return;
                }
                setRequest(requestData);
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to load request.');
                navigate('/user/requests');
            } finally {
                setLoading(false);
            }
        };
        fetchRequest();
    }, [id, navigate]);

    const handlePublish = async () => {
        setPublishing(true);
        try {
            await axiosInstance.patch(`/requests/${id}/status`, { status: 'OPEN' });
            setRequest(prev => ({ ...prev, status: 'OPEN' }));
            toast.success('Request published successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to publish request.');
        } finally {
            setPublishing(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await axiosInstance.delete(`/requests/${id}`);
            toast.success('Request deleted.');
            navigate('/user/requests');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete request.');
            setDeleting(false);
        }
        setShowDelete(false);
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto flex flex-col gap-4 animate-pulse">
                <div className="h-8 w-64 bg-gray-100 rounded-lg" />
                <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-4 bg-gray-100 rounded w-3/4" />)}
                </div>
            </div>
        );
    }

    if (!request) return null;

    const formattedLostDate = request.lostDate
        ? new Date(request.lostDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : '—';
    const formattedCreatedAt = request.createdAt
        ? new Date(request.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—';

    return (
        <>
            <div className="max-w-3xl mx-auto flex flex-col gap-5">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Link to="/user/requests" className="hover:text-primary-blue transition-colors">My Requests</Link>
                    <span>›</span>
                    <span className="text-text-primary font-medium truncate">{request.title}</span>
                </div>

                {/* Header card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-4 min-w-0">
                            <span className="text-3xl shrink-0">{CATEGORY_ICONS[request.category] || '📦'}</span>
                            <div className="min-w-0">
                                <h1 className="text-xl font-bold text-text-primary">{request.title}</h1>
                                <p className="text-sm text-text-secondary mt-1">{request.category} · Posted {formattedCreatedAt}</p>
                            </div>
                        </div>
                        <StatusBadge status={request.status} />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-gray-100">
                        {request.status === 'DRAFT' && (
                            <button
                                onClick={handlePublish}
                                disabled={publishing}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-success hover:bg-green-700 text-white text-sm font-semibold transition-all disabled:opacity-60"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {publishing ? 'Publishing…' : 'Publish Request'}
                            </button>
                        )}

                        {['DRAFT', 'OPEN'].includes(request.status) && (
                            <Link
                                to={`/user/requests/edit/${id}`}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-text-primary text-sm font-semibold hover:bg-gray-50 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                            </Link>
                        )}

                        <button
                            onClick={() => setShowDelete(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-error text-sm font-semibold hover:bg-red-50 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>

                {/* Details */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
                    <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest pb-3 border-b border-gray-100">Request Details</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                        <InfoRow label="Reward" value={request.rewardAmount != null ? `₹${Number(request.rewardAmount).toLocaleString('en-IN')}` : '—'} />
                        <InfoRow label="Date Lost" value={formattedLostDate} />
                        <InfoRow label="General Location" value={request.generalLocation} />
                        <InfoRow label="Exact Location" value={request.exactLocation} />
                        <InfoRow label="Status" value={<StatusBadge status={request.status} />} />
                    </div>

                    {request.description && (
                        <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-50">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Description</span>
                            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">{request.description}</p>
                        </div>
                    )}
                </div>

                {/* Images */}
                {Array.isArray(request.images) && request.images.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
                        <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest pb-3 border-b border-gray-100">Images</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {request.images.map((img, i) => (
                                <a href={img} target="_blank" rel="noopener noreferrer" key={i}
                                    className="rounded-lg overflow-hidden aspect-video border border-gray-100 hover:opacity-90 transition-opacity">
                                    <img src={img} alt={`img-${i}`} className="w-full h-full object-cover" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={showDelete}
                title="Delete this request?"
                message="This action is permanent and cannot be undone."
                confirmLabel={deleting ? 'Deleting…' : 'Yes, Delete'}
                onConfirm={handleDelete}
                onCancel={() => setShowDelete(false)}
                danger
            />
        </>
    );
};

export default RequestDetail;
