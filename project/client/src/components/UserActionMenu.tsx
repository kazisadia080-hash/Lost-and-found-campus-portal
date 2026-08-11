import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UserActionMenu({ user, itemId }: { user: { _id: string; name: string; email?: string }; itemId?: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();

  const handleViewProfile = () => {
    setOpen(false);
    navigate(`/users/${user._id}`);
  };

  const handleMessage = () => {
    setOpen(false);
    if (!auth.user) {
      navigate('/login');
      return;
    }
    navigate(`/messages/${user._id}${itemId ? `?itemId=${itemId}` : ''}`);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-900"
      >
        {user.name}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute left-0 z-10 mt-2 w-40 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <button
            type="button"
            onClick={handleViewProfile}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            View profile
          </button>
          <button
            type="button"
            onClick={handleMessage}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <MessageSquare size={14} /> Message
          </button>
        </div>
      )}
    </div>
  );
}
