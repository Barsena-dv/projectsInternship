import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/ui/ConfirmModal';
import RequestCard from '../../components/ui/RequestCard';
import axiosInstance from '../../utils/axiosInstance';

const MyRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, title }
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await axiosInstance.get('/requests/my');
                // Backend returns: { success: true, data: [...] }
                const raw = response.data;
                const list = Array.isArray(raw?.data) ? raw.data
                    : Array.isArray(raw?.requests) ? raw.requests
                        : Array.isArray(raw) ? raw
                            : [];
                setRequests(list);
            } catch (error) {
                const msg = error.response?.data?.message || 'Failed to load requests.';
                setFetchError(msg);
                toast.error(msg);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    const openDeleteModal = (id, title) => setDeleteTarget({ id, title });
    const closeDeleteModal = () => { if (!deleting) setDeleteTarget(null); };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await axiosInstance.delete(`/requests/${deleteTarget.id}`);
            setRequests(prev => prev.filter(r => (r._id || r.id) !== deleteTarget.id));
            toast.success('Request deleted.');
            setDeleteTarget(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete request.');
        } finally {
            setDeleting(false);
        }
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-10 w-36 bg-gray-100 rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4 animate-pulse h-48" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">My Requests</h1>
                        <p className="text-text-secondary mt-1">
                            {requests.length} {requests.length === 1 ? 'request' : 'requests'} found
                        </p>
                    </div>
                    <Link
                        to="/user/create"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-blue hover:bg-deep-indigo text-white text-sm font-semibold shadow-md shadow-primary-blue/20 transition-all active:scale-[0.98]"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        New Request
                    </Link>
                </div>

                {/* Error state */}
                {fetchError && !loading && requests.length === 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-5 text-sm text-error">{fetchError}</div>
                )}

                {/* Empty State */}
                {!fetchError && requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] bg-white rounded-xl border border-gray-100 p-10 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary-blue/10 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">No requests yet</h3>
                        <p className="text-text-secondary text-sm mb-6 max-w-sm">
                            You haven't posted any lost item recovery requests. Create one to get started.
                        </p>
                        <Link
                            to="/user/create"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-blue hover:bg-deep-indigo text-white text-sm font-semibold transition-all"
                        >
                            Post Your First Request
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {requests.map(request => (
                            <RequestCard
                                key={request._id || request.id}
                                request={request}
                                onDelete={openDeleteModal}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete this request?"
                message={deleteTarget ? `"${deleteTarget.title}" will be permanently removed.` : ''}
                confirmLabel={deleting ? 'Deleting…' : 'Yes, Delete'}
                onConfirm={handleDelete}
                onCancel={closeDeleteModal}
                danger
            />
        </>
    );
};

export default MyRequests;
