import { useState, useEffect } from 'react';

export const useBackendStatus = () => {
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkBackend = async () => {
    try {
      setIsChecking(true);
      setError(null);
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();
      setIsBackendReady(data.status === 'ok');
    } catch (err) {
      console.error('Backend check failed:', err);
      setError('Unable to connect to the backend server. Please make sure it is running.');
      setIsBackendReady(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  return {
    isBackendReady,
    isChecking,
    error,
    retry: checkBackend,
  };
};
