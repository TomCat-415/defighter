"use client";
import { useEffect, useState } from 'react';
import { subscribeToToasts, Toast, ToastType } from '@/lib/toast';

export default function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((toast) => {
      setToasts(prev => [...prev, toast]);
      
      if (toast.duration && toast.duration > 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, toast.duration);
      }
    });

    return unsubscribe;
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600', 
    info: 'bg-blue-600'
  }[toast.type];

  return (
    <div className={`${bgColor} text-white p-4 rounded-lg shadow-lg max-w-sm animate-in slide-in-from-right duration-300`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-semibold">{toast.title}</div>
          {toast.message && (
            <div className="text-sm opacity-90 mt-1">{toast.message}</div>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-3 text-white/80 hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}