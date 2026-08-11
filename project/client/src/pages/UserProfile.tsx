import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import type { Item, User } from '../types';
import ItemCard from '../components/ItemCard';
import { Loader2, User as UserIcon, Mail, Shield } from 'lucide-react';
import { toast } from '../components/Toast';

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}

export default function UserProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([api.getUserProfile(userId), api.listItems(`postedBy=${userId}`)])
      .then(([userData, itemData]) => {
        setProfile(userData.user);
        setItems(itemData.items || []);
      })
      .catch((err: unknown) => toast(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 size={24} className="animate-spin" /> <span className="ml-2">Loading…</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-error-600">User not found.</p>
        <Link to="/" className="link mt-4 inline-block">Back to browse</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="card mb-6 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
            <p className="text-sm text-slate-500">{profile.email}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-slate-600">
            {profile.studentId && (
              <span className="badge bg-slate-100 text-slate-700">
                <Shield size={14} /> {profile.studentId}
              </span>
            )}
            <span className="badge bg-slate-100 text-slate-700">{profile.role}</span>
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Posted items</h2>
          <p className="text-sm text-slate-500">Browse all listings posted by this user.</p>
        </div>
        <Link to="/messages" className="btn-secondary">View messages</Link>
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">This user has not posted any items yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item._id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}