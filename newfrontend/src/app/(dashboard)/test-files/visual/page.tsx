'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Dynamically import the VisualTestRunner component with SSR disabled
const VisualTestRunner = dynamic(
  () => import('@/components/visual-tests/VisualTestRunner'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    ),
  }
);

export default function VisualTestingPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense 
        fallback={
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        }
      >
        <VisualTestRunner />
      </Suspense>
    </div>
  );
}
