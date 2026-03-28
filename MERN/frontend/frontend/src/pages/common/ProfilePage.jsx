import { useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { FiCamera, FiCheckCircle, FiEdit3, FiLock, FiShield, FiUser } from 'react-icons/fi';
import Avatar from '../../components/common/Avatar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';
import '../../styles/owner/dashboard.css';

const ProfilePage = () => {
  const { user, refreshMe } = useAuth();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('account');
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  
  // Tab configurations consistent with theme
  const tabs = useMemo(() => {
    const items = [
      { id: 'account', label: 'Identity Overview', icon: <FiUser size={16} /> },
      { id: 'edit', label: 'Update Profile', icon: <FiEdit3 size={16} /> },
      { id: 'security', label: 'Security & Privacy', icon: <FiLock size={16} /> },
    ];
    if (user?.role === 'finder') {
      items.push({ id: 'verification', label: 'Trust & Verification', icon: <FiShield size={16} /> });
    }
    return items;
  }, [user?.role]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid identity image (JPG, PNG, WEBP).');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadingPhoto(true);
    try {
      await authApi.updateProfile(formData);
      await refreshMe();
      toast.success('Your profile identity image has been synchronized.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!profileForm.full_name.trim()) errors.full_name = 'Identity name is required';
    if (!profileForm.phone.trim()) errors.phone = 'Contact number is required';
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingProfile(true);
    try {
      await authApi.updateProfile({
        full_name: profileForm.full_name,
        phone: profileForm.phone,
      });
      await refreshMe();
      toast.success('Your professional identity has been updated.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!passwordForm.currentPassword) errors.currentPassword = 'Current security key is required';
    if (passwordForm.newPassword.length < 6) errors.newPassword = 'New key must be at least 6 characters';
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errors.confirmPassword = 'Security keys do not match';
    
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingPassword(true);
    try {
      await authApi.changePassword({
        oldPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Security credentials updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) return <LoadingSpinner text="Synchronizing Identity..." />;

  const labelStyle = "text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] mb-2 block ml-1";
  const cardStyle = "owner-section-card p-6 md:p-8 border border-white/5 shadow-2xl relative overflow-hidden";

  return (
    <div className="owner-page-enter max-w-6xl mx-auto pb-12 px-4 md:px-6">
      <PageHeader 
        title="Identity & Settings" 
        subtitle="Manage your professional presence and secure your account" 
      />

      <div className="grid gap-8 lg:grid-cols-12 mt-8">
        
        {/* Left Column: Premium Identity Card */}
        <aside className="lg:col-span-4 space-y-6">
          <div className={`${cardStyle} text-center flex flex-col items-center group`}>
            {/* Animated Glow Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="relative mb-6 z-10 transition-transform duration-500 group-hover:scale-[1.03]">
              <Avatar 
                src={user.profileImage?.url || user.profileImage} 
                name={user.full_name} 
                size="2xl" 
                className={`border-4 border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)] ring-1 ring-white/10 ${uploadingPhoto ? 'opacity-50 grayscale' : ''}`} 
              />
              {uploadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <LoadingSpinner className="!p-0" size="sm" />
                </div>
              )}
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-1 right-1 w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all text-stone-900 border-2 border-stone-900"
              >
                <FiCamera size={18} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
            
            <h2 className="text-2xl font-black text-white leading-tight z-10">
              {user.full_name || user.email.split('@')[0]}
            </h2>
            <div className="flex items-center gap-2 mt-2 z-10">
               <span className="px-3 py-1 rounded-md bg-stone-900 border border-white/10 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                 {user.role}
               </span>
               {user.isVerified && (
                 <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                   <FiCheckCircle size={10} /> Verified
                 </span>
               )}
            </div>
            
            <div className="w-full mt-8 pt-8 border-t border-white/5 space-y-5 z-10">
               <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Trust Rating</span>
                  <span className="text-sm font-black text-amber-500">4.9 / 5.0</span>
               </div>
               <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Account Status</span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/5 text-emerald-400 text-[9px] font-black uppercase border border-emerald-500/10">
                    <FiCheckCircle size={10} /> Active
                  </span>
               </div>
               <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Member Since</span>
                  <span className="text-xs text-stone-300 font-bold">{new Date(user.createdAt).getFullYear()}</span>
               </div>
            </div>
          </div>
          
          <div className="owner-section-card p-6 border-l-4 border-amber-500/50 bg-amber-500/5">
             <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
               <FiShield size={12} /> Security Protocol
             </h3>
             <p className="text-xs text-stone-400 leading-relaxed italic">
               Encryption is active. All identity changes require synchronization with our core trust protocols.
             </p>
          </div>
        </aside>

        {/* Right Column: Tabbed Content */}
        <main className="lg:col-span-8 space-y-6">
          
          {/* Custom Glassy Tabs */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-stone-950/40 backdrop-blur-md rounded-2xl border border-white/5 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-black text-xs transition-all duration-300 ${
                  activeTab === tab.id 
                  ? 'bg-amber-500 text-stone-950 shadow-[0_8px_20px_rgba(245,158,11,0.2)] scale-[1.02]' 
                  : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span className="uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'account' && (
              <div className={cardStyle}>
                <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                   <FiUser className="text-amber-500" /> Account Identity
                </h3>
                <div className="grid md:grid-cols-2 gap-8">
                   <div>
                      <label className={labelStyle}>Primary Email</label>
                      <div className="pnf-input bg-stone-900/50 border-white/5 text-stone-400 cursor-not-allowed">
                        {user.email}
                      </div>
                   </div>
                   <div>
                      <label className={labelStyle}>Registered Phone</label>
                      <div className="pnf-input bg-stone-900/50 border-white/5 text-stone-400 cursor-not-allowed">
                        {user.phone || 'Not provided'}
                      </div>
                   </div>
                   <div className="md:col-span-2">
                      <label className={labelStyle}>Permissions & Scope</label>
                      <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
                         <div className="mt-1 text-amber-500"><FiShield size={20} /></div>
                         <div>
                            <p className="text-sm text-stone-200 font-bold mb-1">Authenticated as {user.role.toUpperCase()}</p>
                            <p className="text-xs text-stone-400 leading-relaxed">
                             {user.role === 'owner' 
                               ? 'You have full authority to create requests, manage funds, and verify evidence submitted by finders.' 
                               : 'You are authorized to discover items, submit forensic evidence, and earn rewards for successful recoveries.'}
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'edit' && (
              <div className={cardStyle}>
                <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                   <FiEdit3 className="text-amber-500" /> Modify Identity Details
                </h3>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                   <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className={labelStyle}>Professional Name</label>
                        <input
                          className="pnf-input"
                          value={profileForm.full_name}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Legal or professional name"
                        />
                        {profileErrors.full_name && <p className="text-[10px] text-rose-500 font-bold ml-1">{profileErrors.full_name}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className={labelStyle}>Contact Mobile</label>
                        <input
                          className="pnf-input"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="+XX XXXXXXXXXX"
                        />
                        {profileErrors.phone && <p className="text-[10px] text-rose-500 font-bold ml-1">{profileErrors.phone}</p>}
                      </div>
                   </div>
                   <div className="pt-6 border-t border-white/5 flex justify-end">
                      <button 
                        className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 font-black text-xs uppercase tracking-widest transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_25px_rgba(245,158,11,0.3)] disabled:opacity-50" 
                        type="submit" 
                        disabled={savingProfile}
                      >
                        {savingProfile ? 'Synchronizing...' : 'Update Identity Profile'}
                      </button>
                   </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className={cardStyle}>
                <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                   <FiLock className="text-amber-500" /> Security Credentials
                </h3>
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                   <div className="space-y-2 max-w-md">
                    <label className={labelStyle}>Current Security Key</label>
                    <input
                      className="pnf-input"
                      type="password"
                      placeholder="••••••••"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    />
                    {passwordErrors.currentPassword && <p className="text-[10px] text-rose-500 font-bold ml-1">{passwordErrors.currentPassword}</p>}
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className={labelStyle}>New Security Key</label>
                      <input
                        className="pnf-input"
                        type="password"
                        placeholder="Secret key (min 6 chars)"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                      />
                      {passwordErrors.newPassword && <p className="text-[10px] text-rose-500 font-bold ml-1">{passwordErrors.newPassword}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className={labelStyle}>Confirm Authorization</label>
                      <input
                        className="pnf-input"
                        type="password"
                        placeholder="Re-enter new key"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                      {passwordErrors.confirmPassword && <p className="text-[10px] text-rose-500 font-bold ml-1">{passwordErrors.confirmPassword}</p>}
                    </div>
                  </div>
                  <div className="pt-6 border-t border-white/5 flex justify-end">
                      <button 
                        className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 font-black text-xs uppercase tracking-widest transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_25px_rgba(245,158,11,0.3)] disabled:opacity-50" 
                        type="submit" 
                        disabled={savingPassword}
                      >
                        {savingPassword ? 'Armoring Account...' : 'Confirm Security Update'}
                      </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'verification' && user.role === 'finder' && (
              <div className={cardStyle}>
                <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                   <FiShield className="text-amber-500" /> Trust & Verification
                </h3>
                <div className="p-12 rounded-3xl bg-stone-900/40 border border-white/5 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto mb-6 border border-amber-500/20 transform group-hover:rotate-12 transition-transform duration-500">
                       <FiShield size={40} />
                    </div>
                    <h4 className="text-white font-black text-lg mb-2">Verified Finder Status</h4>
                    <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
                      Your identity has been authenticated. You have access to premium search areas and guaranteed reward pools.
                    </p>
                    <div className="mt-8 pt-8 border-t border-white/5 inline-flex items-center gap-3 px-6 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                      <FiCheckCircle size={12} /> Identity Synchronized
                    </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
