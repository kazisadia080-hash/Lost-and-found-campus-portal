import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Item, Stats, User } from '../types';
import { Loader2, Trash2, Package, Users, CheckCircle2, Clock, AlertCircle, ShieldCheck } from 'lucide-react';
import { toast } from '../components/Toast';
import { Link } from 'react-router-dom';

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}

export default function Admin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'items' | 'users'>('items');

  const load = async () => {
    setLoading(true);
    try {
      const [s, i, u] = await Promise.all([api.adminStats(), api.adminItems(), api.adminUsers()]);
      setStats(s.stats);
      setItems(i.items);
      setUsers(u.users);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm('Remove this listing?')) return;
    try {
      await api.adminDeleteItem(id);
      toast('Listing removed.');
      load();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 size={24} className="animate-spin" /> <span className="ml-2">Loading admin dashboard…</span>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Items', value: stats?.totalItems ?? 0, icon: <Package size={18} />, color: 'text-primary-600 bg-primary-50' },
    { label: 'Open', value: stats?.openItems ?? 0, icon: <CheckCircle2 size={18} />, color: 'text-success-600 bg-success-50' },
    { label: 'Claimed', value: stats?.claimedItems ?? 0, icon: <ShieldCheck size={18} />, color: 'text-accent-600 bg-accent-100' },
    { label: 'Resolved', value: stats?.resolvedItems ?? 0, icon: <CheckCircle2 size={18} />, color: 'text-slate-600 bg-slate-100' },
    { label: 'Pending Claims', value: stats?.pendingClaims ?? 0, icon: <Clock size={18} />, color: 'text-warning-600 bg-warning-50' },
    { label: 'Users', value: stats?.totalUsers ?? 0, icon: <Users size={18} />, color: 'text-primary-600 bg-primary-50' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <ShieldCheck size={24} className="text-primary-600" />
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s) => (
          <div key={s.label} className="card p-4">
            <div className={`mb-2 grid h-9 w-9 place-items-center rounded-lg ${s.color}`}>{s.icon}</div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('items')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'items' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package size={16} /> All Items ({items.length})
        </button>
        <button
          onClick={() => setTab('users')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'users' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={16} /> Users ({users.length})
        </button>
      </div>

      {tab === 'items' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Poster</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => (
                  <tr key={it._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/items/${it._id}`} className="font-medium text-slate-900 hover:underline">
                        {it.title}
                      </Link>
                      <p className="text-xs text-slate-400">{it.category} · {it.location}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={it.type === 'lost' ? 'badge-lost' : 'badge-found'}>{it.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        it.status === 'open' ? 'badge-open' : it.status === 'claimed' ? 'badge-claimed' : 'badge-resolved'
                      }`}>{it.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{it.postedBy?.name || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove(it._id)} className="btn-danger !px-2.5 !py-1.5" title="Remove listing">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No items.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3 text-slate-600">{u.studentId || '—'}</td>
                    <td className="px-4 py-3">
                      {u.role === 'admin' ? (
                        <span className="badge bg-primary-100 text-primary-700"><ShieldCheck size={12} /> admin</span>
                      ) : (
                        <span className="badge bg-slate-100 text-slate-600">user</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No users.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}