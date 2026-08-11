import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <SearchX size={48} className="text-slate-300" />
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="text-slate-500">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-primary">Back to Browse</Link>
    </div>
  );
}
