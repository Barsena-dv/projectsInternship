import '../../../styles/owner/form.css';

/**
 * PaymentOptionToggle — Pay Now / Pay Later segmented toggle
 * Props: value ('now' | 'later'), onChange(value)
 */
const PaymentOptionToggle = ({ value, onChange }) => (
  <div style={{ marginTop: '0.5rem' }}>
    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Payment Timing</p>
    <div className="owner-pay-toggle">
      <div
        className={`owner-pay-toggle-option${value === 'now' ? ' active' : ''}`}
        onClick={() => onChange('now')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onChange('now')}
      >
        💳 Pay Now
      </div>
      <div
        className={`owner-pay-toggle-option${value === 'later' ? ' active' : ''}`}
        onClick={() => onChange('later')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onChange('later')}
      >
        ⏳ Pay Later
      </div>
    </div>
    <p style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '0.4rem' }}>
      {value === 'now'
        ? 'Your request will be published after payment is confirmed.'
        : 'You can complete payment from the request details page later.'}
    </p>
  </div>
);

export default PaymentOptionToggle;
