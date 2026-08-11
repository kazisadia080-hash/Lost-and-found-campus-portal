import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import { Loader2, User as UserIcon, Mail, Phone, Shield, Trash2, KeyRound, Save } from 'lucide-react';

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [studentId, setStudentId] = useState(user?.studentId || '');
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveName = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingName(true);
    try {
      const { user: updated } = await api.updateProfile({ name: name.trim(), studentId: studentId.trim() });
      updateUser(updated);
      toast('Profile updated.');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      const { user: updated } = await api.updateProfile({ currentPassword, newPassword });
      updateUser(updated);
      setCurrentPassword('');
      setNewPassword('');
      toast('Password updated.');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const sendOtp = async () => {
    setSendingOtp(true);
    try {
      await api.requestDeleteOtp();
      setOtpSent(true);
      toast('OTP sent to your email.');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  const confirmDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otp) return;
    setDeleting(true);
    try {
      await api.deleteAccount(otp);
      toast('Account deleted successfully.');
      logout();
      navigate('/');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">My Profile</h1>

      {/* Account info */}
      <div className="card mb-6 p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Account information</h2>
        <div className="space-y-3 text-sm">
          <p className="flex items-center gap-2 text-slate-600">
            <UserIcon size={16} className="text-slate-400" /> {user?.name}
          </p>
          <p className="flex items-center gap-2 text-slate-600">
            <Mail size={16} className="text-slate-400" /> {user?.email}
          </p>
          <p className="flex items-center gap-2 text-slate-600">
            <Phone size={16} className="text-slate-400" /> {user?.phone || '—'}
          </p>
          {user?.studentId && (
            <p className="flex items-center gap-2 text-slate-600">
              <Shield size={16} className="text-slate-400" /> {user.studentId}
            </p>
          )}
          <p className="flex items-center gap-2">
            <span className={`badge ${user?.role === 'admin' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}>
              {user?.role}
            </span>
          </p>
        </div>
      </div>

      {/* Update name */}
      <form onSubmit={saveName} className="card mb-6 space-y-4 p-6">
        <h2 className="text-sm font-semibold text-slate-700">Update profile</h2>
        <div>
          <label className="label">Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
        </div>
        <div>
          <label className="label">Student / Staff ID</label>
          <input value={studentId} onChange={(e) => setStudentId(e.target.value)} className="input" placeholder="e.g. STU-2024-001" />
        </div>
        <button type="submit" disabled={savingName} className="btn-primary">
          {savingName ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save
        </button>
      </form>

      {/* Update password */}
      <form onSubmit={savePassword} className="card mb-6 space-y-4 p-6">
        <h2 className="text-sm font-semibold text-slate-700">Change password</h2>
        <div>
          <label className="label">Current password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="input" placeholder="••••••••" />
        </div>
        <div>
          <label className="label">New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="input" placeholder="At least 6 characters" />
        </div>
        <button type="submit" disabled={savingPassword} className="btn-primary">
          {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
          Update password
        </button>
      </form>

      {/* Delete account */}
      <div className="card border-error-200 p-6">
        <h2 className="text-sm font-semibold text-error-700">Delete account</h2>
        <p className="mt-1 text-xs text-slate-500">
          Permanently delete your account and all your posts, claims, comments, and messages.
          An OTP will be sent to your email for confirmation.
        </p>
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)} className="btn-danger mt-4">
            <Trash2 size={16} /> Delete my account
          </button>
        ) : (
          <div className="mt-4 space-y-4">
            {!otpSent ? (
              <button onClick={sendOtp} disabled={sendingOtp} className="btn-danger">
                {sendingOtp ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                Send OTP to my email
              </button>
            ) : (
              <form onSubmit={confirmDelete} className="space-y-3">
                <div>
                  <label className="label">Enter the OTP sent to your email</label>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    className="input tracking-[0.3em]"
                    placeholder="6-digit code"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={deleting} className="btn-danger">
                    {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    Confirm deletion
                  </button>
                  <button type="button" onClick={() => { setShowDelete(false); setOtpSent(false); setOtp(''); }} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}