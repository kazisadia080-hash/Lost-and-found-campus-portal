import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { toast } from '../components/Toast';
import { Loader2 } from 'lucide-react';

export default function RequestUniversityVerify() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [universityEmail, setUniversityEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.requestUniversityVerify({ email, password, universityEmail });
      toast('OTP sent to your university email. Enter it to activate your account.');
      navigate(`/verify-university?userId=${data.userId}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Request failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Verify your account</h1>
        <p className="mt-1 text-sm text-slate-500">Provide your login credentials and your university email to receive an OTP.</p>
      </div>

      <form onSubmit={submit} className="card space-y-4 p-6">
        <div>
          <label className="label">Login email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input" />
        </div>
        <div>
          <label className="label">University email (bubt.edu.bd)</label>
          <input type="email" value={universityEmail} onChange={(e) => setUniversityEmail(e.target.value)} required className="input" />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Request OTP'}
        </button>
      </form>
    </div>
  );
}
