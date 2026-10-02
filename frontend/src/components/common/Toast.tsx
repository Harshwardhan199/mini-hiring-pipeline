import { useEffect } from 'react';
import { CheckIcon, AlertCircleIcon, CloseIcon } from './Icons.tsx';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-white text-slate-800 rounded-xl border border-slate-200/90 shadow-lg shadow-slate-900/5 max-w-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
    >
      <div
        className={`p-1 rounded-full shrink-0 ${
          isSuccess
            ? 'bg-emerald-50 text-emerald-600'
            : isError
              ? 'bg-rose-50 text-rose-600'
              : 'bg-indigo-50 text-indigo-600'
        }`}
      >
        {isSuccess && <CheckIcon className="w-4 h-4" />}
        {isError && <AlertCircleIcon className="w-4 h-4" />}
        {!isSuccess && !isError && <CheckIcon className="w-4 h-4" />}
      </div>

      <p className="text-sm font-medium text-slate-700 flex-1">{toast.message}</p>

      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
        aria-label="Dismiss notification"
      >
        <CloseIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
