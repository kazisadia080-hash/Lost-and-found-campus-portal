import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import { Search } from 'lucide-react';

export default function Layout({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  // Redirect root away from Supabase auth if present (not used here)
  if (location.pathname === '/__supabase') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-6 text-center text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Search size={12} /> Lost & Found Campus Portal
          </span>
          <span>Helping campuses reunite people with their belongings.</span>
        </div>
      </footer>
    </div>
  );
}
