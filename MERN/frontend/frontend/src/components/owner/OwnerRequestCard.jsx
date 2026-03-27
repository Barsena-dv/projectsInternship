import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/helpers';
import OwnerStatusBadge from './OwnerStatusBadge';
import '../../styles/owner/request.css';

const OwnerRequestCard = ({ request, lifecycleState, alerts, onEdit, onDelete, onPay, onViewApplicants }) => {
  const applicantCount = Number(request?.finders?.length || 0);

  return (
    <article className="owner-req-card">
      {/* Top row: title + badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="owner-req-card-title">{request.itemName || 'Untitled Request'}</h3>
          <p className="owner-req-card-meta">
            {request.itemCategory || '—'}
            {request.createdAt ? ` · ${formatDate(request.createdAt)}` : ''}
            {request.serviceDeadline ? ` · Due ${formatDate(request.serviceDeadline)}` : ''}
          </p>
        </div>
        <OwnerStatusBadge value={lifecycleState} />
      </div>

      {/* Alert chips */}
      {(alerts?.newEvidence || alerts?.newApplicant || alerts?.newMessage) && (
        <div className="owner-req-card-alerts">
          {alerts.newEvidence  && <span className="owner-alert-chip evidence">Evidence</span>}
          {alerts.newApplicant && <span className="owner-alert-chip applicant">{applicantCount} Applicant{applicantCount !== 1 ? 's' : ''}</span>}
          {alerts.newMessage   && <span className="owner-alert-chip message">New message</span>}
        </div>
      )}

      {/* Actions */}
      <div className="owner-req-actions">
        {lifecycleState === 'draft' && <>
          <button className="owner-req-btn outline" onClick={() => onEdit?.(request)} type="button">Edit</button>
          <button className="owner-req-btn danger"  onClick={() => onDelete?.(request)} type="button">Delete</button>
          <button className="owner-req-btn pay"     onClick={() => onPay?.(request)} type="button">Pay now</button>
        </>}
        {lifecycleState === 'pending_payment' && (
          <button className="owner-req-btn pay" onClick={() => onPay?.(request)} type="button">Complete payment</button>
        )}
        {lifecycleState === 'open' && <>
          <button className="owner-req-btn outline" onClick={() => onEdit?.(request)} type="button">Edit</button>
          <button className="owner-req-btn primary" onClick={() => onViewApplicants?.(request)} type="button">
            Applicants ({applicantCount})
          </button>
        </>}
        <Link className="owner-req-btn view" to={`/owner/requests/${request._id}`}>View details →</Link>
      </div>
    </article>
  );
};

export default OwnerRequestCard;
