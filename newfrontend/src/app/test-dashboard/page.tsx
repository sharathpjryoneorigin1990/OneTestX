'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { PlusCircle } from 'lucide-react';

// Dynamically import the TestTypesDashboard component with SSR disabled
const TestTypesDashboard = dynamic(
  () => import('./test-types-dashboard'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
);

/**
 * Main test dashboard page that displays test types and their statuses.
 * Uses dynamic imports for better performance and code splitting.
 */
const TestDashboardPage = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Test Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor and manage your test suites and their execution
            </p>
          </div>
          <Link href="/test-type">
            <Button className="flex items-center gap-2 w-full md:w-auto">
              <PlusCircle className="h-4 w-4" />
              <span>New Test Type</span>
            </Button>
          </Link>
        </div>
      </header>
      
      <TestTypesDashboard />
    </div>
  );
};

export default TestDashboardPage;
