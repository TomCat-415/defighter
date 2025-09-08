export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

let toastListeners: ((toast: Toast) => void)[] = [];
let recentToasts: Map<string, number> = new Map();

export function subscribeToToasts(callback: (toast: Toast) => void) {
  toastListeners.push(callback);
  return () => {
    toastListeners = toastListeners.filter(listener => listener !== callback);
  };
}

export function showToast(type: ToastType, title: string, message?: string, duration = 5000) {
  // Prevent duplicate toasts within 3 seconds
  const toastKey = `${type}:${title}:${message}`;
  const now = Date.now();
  const lastShown = recentToasts.get(toastKey);
  
  if (lastShown && now - lastShown < 3000) {
    return; // Skip duplicate toast
  }
  
  recentToasts.set(toastKey, now);
  
  const toast: Toast = {
    id: Math.random().toString(36),
    type,
    title,
    message,
    duration
  };
  
  toastListeners.forEach(listener => listener(toast));
  
  // Clean up old entries
  setTimeout(() => {
    recentToasts.delete(toastKey);
  }, 10000);
}

export function showSuccessToast(title: string, message?: string) {
  showToast('success', title, message);
}

export function showErrorToast(title: string, message?: string) {
  showToast('error', title, message);
}

export function showInfoToast(title: string, message?: string) {
  showToast('info', title, message);
}