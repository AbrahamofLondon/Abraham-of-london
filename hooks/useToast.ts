import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
    
    if (toast.duration !== 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, toast.duration || 5000);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((title: string, message: string, duration?: number) => {
    addToast({ title, message, type: 'success', duration });
  }, [addToast]);

  const error = useCallback((title: string, message: string, duration?: number) => {
    addToast({ title, message, type: 'error', duration: duration || 10000 });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
  };
};