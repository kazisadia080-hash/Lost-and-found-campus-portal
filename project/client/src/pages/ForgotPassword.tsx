import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { toast } from '../components/Toast';
import { Loader2, Mail, KeyRound, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setStep('reset');
      toast('OTP sent to your email.');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.resetPassword({ email, otp, newPassword });
      toast('Password reset successfully! Please log in.');
      navigate('/login');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Forgot password</h1>
        <p className="mt-1 text-sm text-slate-500">
          {step === 'email'
            ? 'Enter your email and we will send you a one-time code.'
            : 'Enter the code from your email and choose a new password.'}
        </p>
      </div>

      {step === 'email' ? (
        <form onSubmit={sendOtp} className="card space-y-4 p-6">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input"
              placeholder="you@campus.edu"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
            Send OTP
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="card space-y-4 p-6">
          <div>
            <label className="label">OTP code</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              className="input tracking-[0.3em]"
              placeholder="6-digit code"
            />
          </div>
          <div>
            <label className="label">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="input"
              placeholder="At least 6 characters"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
            Reset password
          </button>
          <button
            type="button"
            onClick={() => setStep('email')}
            className="flex w-full items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft size={14} /> Use a different email
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-slate-500">
        Remembered your password? <Link to="/login" className="link">Back to login</Link>
      </p>
    </div>
  );
}
