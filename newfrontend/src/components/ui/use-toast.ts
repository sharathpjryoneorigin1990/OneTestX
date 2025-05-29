'use client';

import { type ToastType, type ToastProps } from './toast';
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

type ToastOptions = Omit<ToastProps, 'id' | 'onClose'>;

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(({ type, title, message, duration = 5000 }: ToastOptions) => {
    const id = uuidv4();
    
    setToasts((prevToasts) => [
      ...prevToasts,
      { id, type, title, message, duration, onClose: removeToast },
    ]);

    if (duration) {
      setTimeout(() => removeToast(id), duration);
    }

    return id;
  }, [removeToast]);

  const success = useCallback((title: string, message?: string, duration?: number) => {
    return toast({ type: 'success', title, message, duration });
  }, [toast]);

  const error = useCallback((title: string, message?: string, duration?: number) => {
    return toast({ type: 'error', title, message, duration });
  }, [toast]);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    return toast({ type: 'warning', title, message, duration });
  }, [toast]);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    return toast({ type: 'info', title, message, duration });
  }, [toast]);

  return {
    toasts,
    toast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
