'use client';

import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MaintenancePage() {
  const { isBackendReady, isChecking, error, retry } = useBackendStatus();
  const router = useRouter();

  useEffect(() => {
    if (isBackendReady && !isChecking) {
      router.push('/');
    }
  }, [isBackendReady, isChecking, router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Service Unavailable
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {error || 'The backend service is currently unavailable.'}
          </p>
          <div className="mt-6">
            <button
              onClick={retry}
              disabled={isChecking}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isChecking ? 'Checking...' : 'Retry Connection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
