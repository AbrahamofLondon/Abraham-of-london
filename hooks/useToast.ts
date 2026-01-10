import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
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
    
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((title: string, message: string, duration?: number) => {
    return addToast({ title, message, type: 'success', duration });
  }, [addToast]);

  const error = useCallback((title: string, message: string, duration?: number) => {
    return addToast({ title, message, type: 'error', duration: duration || 10000 });
  }, [addToast]);

  const warning = useCallback((title: string, message: string, duration?: number) => {
    return addToast({ title, message, type: 'warning', duration });
  }, [addToast]);

  const info = useCallback((title: string, message: string, duration?: number) => {
    return addToast({ title, message, type: 'info', duration });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
};
