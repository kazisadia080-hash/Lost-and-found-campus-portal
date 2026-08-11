import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import type { Item } from '../types';
import { CATEGORIES } from '../types';
import ItemCard from '../components/ItemCard';
import { Search, SlidersHorizontal, Loader2, PackageSearch } from 'lucide-react';

const STATUSES = ['open', 'claimed', 'resolved'];
const TYPES = ['lost', 'found'];

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (category) params.set('category', category);
    if (status) params.set('status', status);
    if (type) params.set('type', type);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return params.toString();
  }, [q, category, status, type, from, to]);

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .listItems(query)
      .then((data) => setItems(data.items))
      .catch((e: unknown) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [query]);

  const clearFilters = () => {
    setQ('');
    setCategory('');
    setStatus('');
    setType('');
    setFrom('');
    setTo('');
  };

  const hasFilters = category || status || type || from || to;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Lost something? Found something?
        </h1>
        <p className="mt-2 text-slate-500">
          Browse campus lost & found listings and help reunite people with their belongings.
        </p>
      </div>

      {/* Search + filters */}
      <div className="mb-6 card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, description, or location…"
              className="input pl-10"
            />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input sm:w-36">
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="btn-secondary"
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">From date</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">To date</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
            </div>
            {hasFilters && (
              <div className="sm:col-span-2 lg:col-span-4">
                <button onClick={clearFilters} className="btn-ghost">
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={24} className="animate-spin" /> <span className="ml-2">Loading listings…</span>
        </div>
      ) : error ? (
        <div className="card p-8 text-center text-error-600">{error}</div>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center text-slate-400">
          <PackageSearch size={40} />
          <p className="font-medium text-slate-600">No listings match your search.</p>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary">Clear filters</button>
          )}
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-500">
            {items.length} {items.length === 1 ? 'listing' : 'listings'} found
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}