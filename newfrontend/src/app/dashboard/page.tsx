"use client";

import { useEffect } from 'react';
import { TestDashboard } from '@/components/dashboard/TestDashboard';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

export default function DashboardPage() {
  // Load debug script in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const script = document.createElement('script');
      script.src = '/test-console.js';
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 to-dark-950 text-white">
      <NewNavbar />
      <main className="container mx-auto px-4 py-8">
        <Card className="mb-8 bg-dark-800 border-dark-700">
          <CardHeader>
            <CardTitle className="text-white">Test Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <TestDashboard />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
