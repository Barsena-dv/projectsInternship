import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/owner/dashboard.css';
import '../../styles/owner/form.css';

const TABS = ['Info', 'Security', 'Activity'];

const OwnerProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Info');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });

  useEffect(() => {
    if (user) setForm({ full_name: user.full_name || '', email: user.email || '', phone: user.phone || '' });
  }, [user]);

  const initials = (n) => n ? n.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() : 'U';

  const T = { title: { fontSize: '0.9rem', fontWeight: 700, color: '#fffbeb', margin: 0 }, meta: { fontSize: '0.78rem', color: '#a8a29e', margin: '2px 0 0' } };

  const FIELDS = [['full_name','Full Name'],['email','Email'],['phone','Phone']];
  const INFO = [['Full Name', user?.full_name],['Email', user?.email],['Phone', user?.phone || '—'],['Role', user?.role]];

  return (
    <div className="owner-page-enter">
      <div className="owner-page-header">
        <h1 className="owner-page-title">Profile</h1>
        <p className="owner-page-subtitle">Manage your account information and preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* Sidebar */}
        <div className="owner-section-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: 'rgba(245,158,11,0.15)', border: '1.5px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', fontWeight: 800, fontSize: '1.5rem', margin: '0 auto 0.875rem' }}>
            {initials(user?.full_name)}
          </div>
          <p style={T.title}>{user?.full_name || 'User'}</p>
          <p style={T.meta}>{user?.email}</p>
          <span style={{ display: 'inline-block', marginTop: '0.625rem', padding: '0.2rem 0.7rem', borderRadius: '5px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', border: '1px solid rgba(245,158,11,0.3)' }}>
            {String(user?.role || 'owner').toUpperCase()}
          </span>
          <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
            {[['Member since', user?.createdAt ? new Date(user.createdAt).getFullYear() : '—'],['Status', '● Active']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '0.3rem 0' }}>
                <span style={{ color: '#a8a29e' }}>{k}</span>
                <span style={{ fontWeight: 600, color: k === 'Status' ? '#10b981' : '#fffbeb' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.2rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.2rem', width: 'fit-content', boxShadow: 'none' }}>
            {TABS.map((tab) => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s', background: activeTab === tab ? '#f59e0b' : 'transparent', color: activeTab === tab ? '#1c1917' : '#a8a29e', boxShadow: activeTab === tab ? '0 4px 12px rgba(245,158,11,0.3)' : 'none' }}
              >{tab}</button>
            ))}
          </div>

          {/* Info */}
          {activeTab === 'Info' && (
            <div className="owner-section-card">
              <div className="owner-section-header">
                <span className="owner-section-title">Personal Information</span>
                <button type="button" onClick={() => setEditing((p) => !p)}
                  style={{ fontSize: '0.78rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: editing ? 'rgba(239,68,68,0.15)' : 'rgba(0,0,0,0.2)', color: editing ? '#fca5a5' : '#fde68a', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                >{editing ? 'Cancel' : '✏ Edit'}</button>
              </div>
              {editing ? (
                <form onSubmit={(e) => { e.preventDefault(); toast.success('Profile saved!'); setEditing(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {FIELDS.map(([key, label]) => (
                    <div key={key} className="owner-field">
                      <input className="owner-field-input" value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} placeholder=" " />
                      <label className="owner-field-label">{label}</label>
                    </div>
                  ))}
                  <button type="submit" className="owner-form-submit" style={{ maxWidth: '180px' }}>Save changes</button>
                </form>
              ) : (
                INFO.map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.825rem', color: '#a8a29e', fontWeight: 500 }}>{k}</span>
                    <span style={{ fontSize: '0.875rem', color: '#fffbeb', fontWeight: 600 }}>{v || '—'}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Security */}
          {activeTab === 'Security' && (
            <div className="owner-section-card">
              <div className="owner-section-header"><span className="owner-section-title">Security Settings</span></div>
              {[
                { title: 'Change Password', desc: 'Use a strong, unique password for security.', action: 'Change password', disabled: false },
                { title: 'Two-Factor Authentication', desc: 'Add an extra layer of protection.', action: 'Coming soon', disabled: true },
              ].map((item) => (
                <div key={item.title} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#fffbeb' }}>{item.title}</p>
                  <p style={{ margin: '0.25rem 0 0.75rem', fontSize: '0.78rem', color: '#a8a29e' }}>{item.desc}</p>
                  <button type="button" disabled={item.disabled}
                    style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: item.disabled ? 'rgba(0,0,0,0.1)' : 'rgba(245,158,11,0.15)', color: item.disabled ? '#a8a29e' : '#fbbf24', fontSize: '0.8rem', fontWeight: 600, cursor: item.disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                  >{item.action}</button>
                </div>
              ))}
            </div>
          )}

          {/* Activity */}
          {activeTab === 'Activity' && (
            <div className="owner-section-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: '#a8a29e', fontSize: '0.875rem', margin: 0 }}>Activity history coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerProfilePage;
