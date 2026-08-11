import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Item, Claim } from '../types';
import ItemCard from '../components/ItemCard';
import { Loader2, Package, Inbox, ShieldCheck, Clock } from 'lucide-react';

export default function MyItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'posts' | 'claims'>('posts');

  useEffect(() => {
    Promise.all([api.myItems(), api.myClaims()])
      .then(([i, c]) => {
        setItems(i.items);
        setClaims(c.claims);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 size={24} className="animate-spin" /> <span className="ml-2">Loading…</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">My Activity</h1>

      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('posts')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'posts' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package size={16} /> My Posts ({items.length})
        </button>
        <button
          onClick={() => setTab('claims')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'claims' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck size={16} /> My Claims ({claims.length})
        </button>
      </div>

      {tab === 'posts' ? (
        items.length === 0 ? (
          <EmptyState icon={<Inbox size={40} />} text="You haven't posted any items yet.">
            <Link to="/post" className="btn-primary">Post an item</Link>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        )
      ) : claims.length === 0 ? (
          <EmptyState icon={<ShieldCheck size={40} />} text="You haven't submitted any claims." />
        ) : (
          <div className="space-y-3">
            {claims.map((c) => {
              const item = c.item as Item;
              return (
                <Link
                  to={`/items/${typeof item === 'string' ? item : item._id}`}
                  key={c._id}
                  className="card flex flex-wrap items-center justify-between gap-3 p-4 transition hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    {item?.images?.[0] ? (
                      <img src={item.images[0]} alt={item.title} className="h-14 w-14 rounded-lg object-cover" />
                    ) : (
                      <div className="grid h-14 w-14 place-items-center rounded-lg bg-slate-100 text-slate-300">
                        <Package size={18} />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{item?.title || 'Item'}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{c.verificationNote}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.status === 'pending' && <span className="badge-pending"><Clock size={12} /> pending</span>}
                    {c.status === 'approved' && <span className="badge-approved">approved</span>}
                    {c.status === 'rejected' && <span className="badge-rejected">rejected</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
    </div>
  );
}

function EmptyState({ icon, text, children }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-12 text-center text-slate-400">
      {icon}
      <p className="font-medium text-slate-600">{text}</p>
      {children}
    </div>
  );
}
