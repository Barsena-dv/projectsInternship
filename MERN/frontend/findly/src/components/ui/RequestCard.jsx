import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

const CATEGORY_ICONS = { Electronics: '💻', Wallet: '👛', Documents: '📄', Bags: '👜', Keys: '🗝️', Jewelry: '💍', Other: '📦' };

const RequestCard = ({ request = {}, onDelete }) => {
    const id = request._id || request.id || null;
    const title = request.title || 'Untitled Request';
    const category = request.category || 'Other';
    const rewardAmount = request.rewardAmount ?? null;
    const status = request.status || 'DRAFT';
    const createdAt = request.createdAt || null;
    const generalLocation = request.generalLocation || null;

    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—';

    const canEdit = ['DRAFT', 'OPEN'].includes(status);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-blue/20 transition-all duration-200 p-5 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{CATEGORY_ICONS[category] || '📦'}</span>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-text-primary text-base truncate">{title}</h3>
                        <p className="text-xs text-text-secondary mt-0.5">{category}</p>
                    </div>
                </div>
                <StatusBadge status={status} />
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Reward</span>
                    <span className="text-sm font-semibold text-text-primary">
                        {rewardAmount != null ? `₹${Number(rewardAmount).toLocaleString('en-IN')}` : '—'}
                    </span>
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Location</span>
                    <span className="text-sm text-text-primary truncate">{generalLocation || '—'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Posted</span>
                    <span className="text-sm text-text-primary">{formattedDate}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                {id ? (
                    <Link
                        to={`/user/requests/${id}`}
                        className="flex-1 text-center px-3 py-2 rounded-lg bg-primary-blue/10 text-primary-blue text-xs font-semibold hover:bg-primary-blue/20 transition-colors"
                    >
                        View
                    </Link>
                ) : null}

                {canEdit && id ? (
                    <Link
                        to={`/user/requests/edit/${id}`}
                        className="flex-1 text-center px-3 py-2 rounded-lg border border-gray-200 text-text-primary text-xs font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Edit
                    </Link>
                ) : null}

                {onDelete && id ? (
                    <button
                        onClick={() => onDelete(id, title)}
                        className="flex-1 text-center px-3 py-2 rounded-lg border border-red-100 text-error text-xs font-semibold hover:bg-red-50 transition-colors"
                    >
                        Delete
                    </button>
                ) : null}

                {!id && (
                    <span className="text-xs text-text-secondary italic">Details unavailable</span>
                )}
            </div>
        </div>
    );
};

export default RequestCard;
