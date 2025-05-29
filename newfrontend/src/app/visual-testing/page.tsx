'use client';

import dynamic from 'next/dynamic';

// Dynamically import the VisualTestRunner component with no SSR
const VisualTestRunner = dynamic(
  () => import('@/components/visual-tests/VisualTestRunner'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <p>Loading visual testing...</p>
      </div>
    ),
  }
);

export default function VisualTestingPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Visual Testing</h1>
      <VisualTestRunner />
    </div>
  );
}
