'use client';

import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import TestResultViewer from '@/components/TestResultViewer';

export default function TestResultPage() {
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');

  if (!testId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No test ID provided. Please return to the test page and try again.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/test-files/keyboard">
            <Button variant="outline">
              Back to Keyboard Tests
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/test-files/keyboard" className="text-blue-600 hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
          Back to Tests
        </Link>
      </div>
      <TestResultViewer testId={testId} />
    </div>
  );
}
