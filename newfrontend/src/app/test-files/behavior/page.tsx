'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

// Import the BehaviorDashboard component
const BehaviorDashboard = dynamic(
  () => import('@/components/behavior-analysis/BehaviorDashboard'),
  { ssr: false, loading: () => <div className="p-8 text-center">Loading behavior analysis dashboard...</div> }
);

export default function BehaviorAnalysisPage() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || 'ai';
  const type = searchParams.get('type') || 'behavior';

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Behavior Analysis</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <BehaviorDashboard />
      </div>
    </div>
  );
}
