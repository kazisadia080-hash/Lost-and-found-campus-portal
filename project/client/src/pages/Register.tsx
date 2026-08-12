import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import { Loader2, UserPlus, Shield } from 'lucide-react';

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    studentId: '',
    password: '',
    role: 'student' as 'student' | 'teacher' | 'librarian' | 'staff' | 'other' | 'admin',
    adminCode: '',
    universityEmail: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        studentId: form.studentId,
        role: form.role,
        universityEmail: form.universityEmail,
      };
      if (form.role === 'admin') payload.adminCode = form.adminCode;
      const resp = await api.register(payload);
      toast('OTP sent to your university email. Please verify to activate account.');
      navigate(`/verify-university?userId=${resp.userId}`);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Create an account</h1>
        <p className="mt-1 text-sm text-slate-500">Register to post items and submit claims.</p>
      </div>

      <form onSubmit={submit} className="card space-y-4 p-6">
        <div>
          <label className="label">Account role</label>
          <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as any }))} className="input">
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="librarian">Librarian</option>
            <option value="staff">Staff</option>
            <option value="other">Other</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label className="label">Full name</label>
          <input name="name" value={form.name} onChange={handleChange} required className="input" placeholder="Jane Doe" />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required className="input" placeholder="you@campus.edu" />
        </div>
        <div>
          <label className="label">Phone number</label>
          <input name="phone" value={form.phone} onChange={handleChange} required className="input" placeholder="e.g. +1 555 123 4567" />
        </div>
        <div>
          <label className="label">Student / Staff ID (optional)</label>
          <input name="studentId" value={form.studentId} onChange={handleChange} className="input" placeholder="e.g. STU-2024-001" />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} className="input" placeholder="At least 6 characters" />
        </div>

        <div>
          <label className="label">University email (BUBT)</label>
          <input type="email" name="universityEmail" value={form.universityEmail} onChange={handleChange} required className="input" placeholder="yourid@cse.bubt.edu.bd" />
        </div>

        {form.role === 'admin' && (
          <div className="rounded-lg border border-primary-200 bg-primary-50 p-3">
            <label className="label text-primary-700">Admin registration code</label>
            <input
              name="adminCode"
              value={form.adminCode}
              onChange={handleChange}
              required
              className="input"
              placeholder="Enter the secret admin code"
            />
            <p className="mt-1.5 text-xs text-primary-600">
              Only people with the admin code can create an admin account.
            </p>
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          Create account
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account? <Link to="/login" className="link">Log in</Link>
      </p>
    </div>
  );
}