import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

export default function VerifyUniversity() {
  const [search] = useSearchParams();
  const userId = search.get('userId') || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await api.verifyUniversity({ userId, otp });
      // resp contains token and user
      login(resp.token, resp.user);
      toast('Account verified and activated');
      navigate('/');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return <div className="mx-auto max-w-md p-6">Missing userId in URL</div>;
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h2 className="text-lg font-bold">Verify your university email</h2>
      <p className="text-sm text-slate-600">Enter the OTP sent to your university email address.</p>
      <form onSubmit={submit} className="card space-y-4 mt-4 p-6">
        <div>
          <label className="label">OTP code</label>
          <input value={otp} onChange={(e) => setOtp(e.target.value)} className="input" required />
        </div>
        <button disabled={loading} className="btn-primary">
          Verify
        </button>
      </form>
    </div>
  );
}
