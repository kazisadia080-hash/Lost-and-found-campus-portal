import { useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error';
}

let externalSetter: ((t: ToastItem) => void) | null = null;

export function toast(message: string, type: 'success' | 'error' = 'success') {
  if (externalSetter) externalSetter({ message, type, id: Date.now() });
}

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((t: ToastItem) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, 4000);
  }, []);

  externalSetter = push;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`fade-in flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            t.type === 'success'
              ? 'bg-success-600 text-white'
              : t.type === 'error'
              ? 'bg-error-600 text-white'
              : 'bg-slate-800 text-white'
          }`}
        >
          {t.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {t.message}
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="ml-2 opacity-70 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}