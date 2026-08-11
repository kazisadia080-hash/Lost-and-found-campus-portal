import { Link, useNavigate } from 'react-router-dom';
import { Search, PlusCircle, LogOut, User as UserIcon, Shield, Package, Menu, X, MessageSquare, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  const navLink = (to, label, icon) => (
    <Link
      to={to}
      onClick={() => setOpen(false)}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-600 text-white">
            <Search size={18} />
          </span>
          <span className="hidden sm:inline">Lost & Found</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLink('/', 'Browse', <Search size={16} />)}
          {user && navLink('/post', 'Post Item', <PlusCircle size={16} />)}
          {user && navLink('/my-items', 'My Items', <Package size={16} />)}
          {user && navLink('/messages', 'Messages', <MessageSquare size={16} />)}
          {isAdmin && navLink('/admin', 'Admin', <Shield size={16} />)}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link to="/profile" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition">
                <UserCircle size={18} /> {user.name}
              </Link>
              <button onClick={handleLogout} className="btn-secondary">
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">Login</Link>
              <Link to="/register" className="btn-primary">Sign Up</Link>
            </>
          )}
        </div>

        <button
          className="btn-ghost md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {navLink('/', 'Browse', <Search size={16} />)}
            {user && navLink('/post', 'Post Item', <PlusCircle size={16} />)}
            {user && navLink('/my-items', 'My Items', <Package size={16} />)}
            {user && navLink('/messages', 'Messages', <MessageSquare size={16} />)}
            {user && navLink('/profile', 'Profile', <UserCircle size={16} />)}
            {isAdmin && navLink('/admin', 'Admin', <Shield size={16} />)}
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {user ? (
              <>
                <span className="text-sm text-slate-600">Signed in as {user.name}</span>
                <button onClick={handleLogout} className="btn-secondary">
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary">Login</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
