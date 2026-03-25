import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/helpers';
import StatusBadge from '../common/StatusBadge';

const RequestCard = ({ request, lifecycleState, alerts, onEdit, onDelete, onPay, onViewApplicants }) => {
  const applicantCount = Number(request?.finders?.length || 0);

  const renderActions = () => {
    if (lifecycleState === 'draft') {
      return (
        <>
          <button className="pnf-btn-outline rounded-lg px-2.5 py-1 text-xs" onClick={() => onEdit(request)} type="button">Edit</button>
          <button className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-50" onClick={() => onDelete(request)} type="button">Delete</button>
          <button className="pnf-btn-primary rounded-lg px-2.5 py-1 text-xs" onClick={() => onPay(request)} type="button">Complete Payment</button>
        </>
      );
    }

    if (lifecycleState === 'pending_payment') {
      return <button className="pnf-btn-primary rounded-lg px-2.5 py-1 text-xs" onClick={() => onPay(request)} type="button">Pay Now</button>;
    }

    if (lifecycleState === 'open') {
      return (
        <>
          <button className="pnf-btn-outline rounded-lg px-2.5 py-1 text-xs" onClick={() => onEdit(request)} type="button">
            Edit
          </button>
          <button className="pnf-btn-outline rounded-lg px-2.5 py-1 text-xs" onClick={() => onViewApplicants(request)} type="button">
            Applicants ({applicantCount})
          </button>
        </>
      );
    }

    if (lifecycleState === 'assigned') {
      return null;
    }

    if (lifecycleState === 'evidence_submitted') {
      return null;
    }

    if (lifecycleState === 'verified') {
      return null;
    }

    if (lifecycleState === 'completed') {
      return null;
    }

    return null;
  };

  return (
    <article className="pnf-card p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">{request.itemName}</h3>
          <p className="text-sm text-slate-600">{request.itemCategory || '-'}</p>
          <p className="text-xs text-slate-500">Created {formatDate(request.createdAt)}</p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {alerts?.newEvidence ? <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">New Evidence</span> : null}
            {alerts?.newApplicant ? <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700">New Applicant</span> : null}
            {alerts?.newMessage ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">New Message</span> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <StatusBadge value={lifecycleState} />
          {renderActions()}
          <Link className="text-sm font-medium text-blue-600 hover:underline" to={`/owner/requests/${request._id}`}>
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
};

export default RequestCard;
