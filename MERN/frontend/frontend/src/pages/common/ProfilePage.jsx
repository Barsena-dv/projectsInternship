import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';

const toVerificationStatus = (role, isVerified, accountStatus) => {
  if (role !== 'finder') return null;
  if (isVerified) return 'verified';
  if (accountStatus === 'blocked' || accountStatus === 'suspended') return 'rejected';
  return 'pending';
};

const statusClass = {
  verified: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-rose-100 text-rose-700',
};

const ProfilePage = () => {
  const { user, refreshMe } = useAuth();
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [idProofFile, setIdProofFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  const verificationStatus = toVerificationStatus(user?.role, user?.isVerified, user?.accountStatus);

  useEffect(() => {
    setProfileForm({
      full_name: user?.full_name || '',
      phone: user?.phone || '',
    });

    const existingImage = user?.profileImage?.url || user?.profileImage || '';
    setImagePreview(existingImage);
    setImageDataUrl('');
  }, [user]);

  if (!user) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      setImagePreview(result);
      setImageDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = {};
    if (!profileForm.full_name.trim()) nextErrors.full_name = 'Full name is required';
    if (!profileForm.phone.trim()) nextErrors.phone = 'Phone number is required';
    setProfileErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSavingProfile(true);
    try {
      await authApi.updateProfile({
        full_name: profileForm.full_name,
        phone: profileForm.phone,
        ...(imageDataUrl ? { profileImage: { url: imageDataUrl } } : {}),
      });
      await refreshMe();
      setImageDataUrl('');
      toast.success('Profile updated successfully.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = {};
    if (!passwordForm.currentPassword) nextErrors.currentPassword = 'Current password is required';
    if (!passwordForm.newPassword) nextErrors.newPassword = 'New password is required';
    if (passwordForm.newPassword.length > 0 && passwordForm.newPassword.length < 6) {
      nextErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSavingPassword(true);
    try {
      await authApi.changePassword({
        oldPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div>
      <PageHeader title="Profile" subtitle="View account information and manage profile settings" />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="pnf-card p-5">
          <h2 className="text-base font-semibold text-slate-900">User Info</h2>
          <div className="mt-4 flex items-center gap-4">
            <img
              src={imagePreview || 'https://placehold.co/100x100?text=User'}
              alt="Profile"
              className="h-20 w-20 rounded-full border border-slate-200 object-cover"
            />
            <div className="space-y-1 text-sm text-slate-700">
              <p><span className="font-medium">Full Name:</span> {user.full_name || '-'}</p>
              <p><span className="font-medium">Email:</span> {user.email || '-'}</p>
              <p><span className="font-medium">Role:</span> {String(user.role || '').toUpperCase()}</p>
            </div>
          </div>
        </section>

        <section className="pnf-card p-5">
          <h2 className="text-base font-semibold text-slate-900">Edit Profile</h2>
          <form className="mt-4 grid gap-3" onSubmit={handleProfileSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
              <input
                className="pnf-input"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))}
              />
              {profileErrors.full_name ? <p className="mt-1 text-xs text-rose-600">{profileErrors.full_name}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone Number</label>
              <input
                className="pnf-input"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
              {profileErrors.phone ? <p className="mt-1 text-xs text-rose-600">{profileErrors.phone}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Profile Image</label>
              <input className="pnf-input" type="file" accept="image/*" onChange={handleImageChange} />
              <p className="mt-1 text-xs text-slate-500">Select an image to preview before saving.</p>
            </div>

            <button className="pnf-btn-primary rounded-lg px-4 py-2 text-sm font-medium" type="submit" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </section>

        <section className="pnf-card p-5">
          <h2 className="text-base font-semibold text-slate-900">Update Password</h2>
          <form className="mt-4 grid gap-3" onSubmit={handlePasswordSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Current Password</label>
              <input
                className="pnf-input"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              />
              {passwordErrors.currentPassword ? <p className="mt-1 text-xs text-rose-600">{passwordErrors.currentPassword}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
              <input
                className="pnf-input"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              />
              {passwordErrors.newPassword ? <p className="mt-1 text-xs text-rose-600">{passwordErrors.newPassword}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Confirm Password</label>
              <input
                className="pnf-input"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              />
              {passwordErrors.confirmPassword ? <p className="mt-1 text-xs text-rose-600">{passwordErrors.confirmPassword}</p> : null}
            </div>

            <button className="pnf-btn-primary rounded-lg px-4 py-2 text-sm font-medium" type="submit" disabled={savingPassword}>
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </section>

        {user.role === 'finder' ? (
          <section className="pnf-card p-5">
            <h2 className="text-base font-semibold text-slate-900">Finder Verification</h2>
            <div className="mt-3 space-y-3 text-sm text-slate-700">
              <p>
                <span className="font-medium">Verification Status:</span>{' '}
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass[verificationStatus]}`}>
                  {String(verificationStatus || 'pending').toUpperCase()}
                </span>
              </p>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Upload ID Proof (Optional)</label>
                <input
                  className="pnf-input"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setIdProofFile(e.target.files?.[0] || null)}
                />
                {idProofFile ? <p className="mt-1 text-xs text-slate-500">Selected: {idProofFile.name}</p> : null}
                <p className="mt-1 text-xs text-slate-500">UI is ready. Upload API can be connected when backend endpoint is available.</p>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default ProfilePage;
