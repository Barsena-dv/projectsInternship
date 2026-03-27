import '../../styles/owner/request.css';

const STATUS_CONFIG = {
  draft:              'Draft',
  pending_payment:    'Needs Payment',
  open:               'Open',
  assigned:           'Assigned',
  evidence_submitted: 'Evidence',
  verified:           'Verified',
  completed:          'Completed',
  failed:             'Failed',
  expired:            'Expired',
  cancelled:          'Cancelled',
  inactive:           'Inactive',
  released:           'Released',
  refunded:           'Refunded',
  rejected:           'Rejected',
};

const OwnerStatusBadge = ({ value }) => {
  const label = STATUS_CONFIG[value] || String(value || '—').replace(/_/g, ' ');
  const cls   = `owner-status-badge status-${String(value || 'draft').toLowerCase().replace(/\s+/g, '_')}`;

  return (
    <span className={cls}>
      <span className="badge-dot" />
      {label}
    </span>
  );
};

export default OwnerStatusBadge;
