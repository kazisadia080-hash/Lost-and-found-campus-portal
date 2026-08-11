import { Link } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';
import type { Item } from '../types';

const statusClass = {
  open: 'badge-open',
  claimed: 'badge-claimed',
  resolved: 'badge-resolved',
};

export default function ItemCard({ item }: { item: Item }) {
  const date = new Date(item.dateLostOrFound).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link
      to={`/items/${item._id}`}
      className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {item.images?.[0] ? (
          <img
            src={item.images[0]}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-slate-300 text-sm">
            No image
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1.5">
          <span className={item.type === 'lost' ? 'badge-lost' : 'badge-found'}>
            {item.type === 'lost' ? 'Lost' : 'Found'}
          </span>
        </div>
        <div className="absolute right-2 top-2">
          <span className={statusClass[item.status]}>{item.status}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="truncate text-base font-semibold text-slate-900">{item.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.description}</p>
        <div className="mt-3 flex flex-col gap-1 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <MapPin size={13} /> {item.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={13} /> {date}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="badge bg-slate-100 text-slate-600">{item.category}</span>
          <div className="flex items-center gap-2">
            {item.pendingClaimCount ? (
              <span className="badge bg-warning-100 text-warning-700">
                {item.pendingClaimCount} pending claim{item.pendingClaimCount > 1 ? 's' : ''}
              </span>
            ) : null}
            <span className="text-xs text-slate-400">by {item.postedBy?.name || 'Unknown'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
