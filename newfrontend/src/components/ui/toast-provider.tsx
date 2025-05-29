'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Toast, ToastContainer } from './toast';
import { useToast } from './use-toast';

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);

  // Only render after mounting to avoid hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {children}
      {mounted && (
        <ToastContainer>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              id={toast.id}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </ToastContainer>
      )}
    </>
  );
}
