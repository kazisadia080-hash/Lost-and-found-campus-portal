import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Notification } from '../types';
import { Bell, MessageSquare, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from '../components/Toast';

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.notifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare size={16} />;
      case 'claim':
        return <ShieldCheck size={16} />;
      case 'reply':
      case 'comment':
        return <FileText size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Bell size={24} className="text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">Recent activity and updates for your account.</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <span className="animate-spin">Loading…</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">You have no new notifications.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`flex items-start justify-between gap-4 px-4 py-4 transition ${
                  notification.read ? 'bg-white' : 'bg-primary-50/40'
                }`}
              >
                <div className="flex gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                    {getIcon(notification.type)}
                  </div>
                  <div>
                    <p className="text-sm text-slate-900">{notification.text || 'You have a new notification.'}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      {notification.from && <span>From {notification.from.name}</span>}
                      {notification.item && <span>On {notification.item.title}</span>}
                      <span>{new Date(notification.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {notification.type === 'message' && notification.from ? (
                    <Link
                      to={`/messages/${notification.from._id}`}
                      className="btn-secondary btn-xs inline-flex items-center gap-1"
                    >
                      View chat <ArrowRight size={12} />
                    </Link>
                  ) : (notification.item || notification.comment?.item) ? (
                    <Link
                      to={`/items/${(notification.item || notification.comment?.item)!._id}`}
                      className="btn-secondary btn-xs inline-flex items-center gap-1"
                    >
                      View post <ArrowRight size={12} />
                    </Link>
                  ) : null}
                  {!notification.read && (
                    <button
                      type="button"
                      onClick={() => markRead(notification._id)}
                      className="btn-primary btn-xs"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
