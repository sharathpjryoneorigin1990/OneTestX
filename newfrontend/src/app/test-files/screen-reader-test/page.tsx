'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Placeholder for available screen reader tests (can be replaced with API fetch)
const AVAILABLE_TESTS = [
  {
    id: 'aria-labels',
    name: 'ARIA Labels Test',
    description: 'Checks for missing or incorrect ARIA labels on interactive elements.'
  },
  {
    id: 'tab-order',
    name: 'Tab Order Test',
    description: 'Ensures logical tab order for keyboard and screen reader navigation.'
  },
  {
    id: 'landmarks',
    name: 'Landmark Roles Test',
    description: 'Verifies presence of ARIA landmark roles (main, navigation, etc.).'
  },
  {
    id: 'alt-text',
    name: 'Image Alt Text Test',
    description: 'Checks that all images have appropriate alt text.'
  },
];

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  issues: string[];
}

const mockRunTest = (testId: string): Promise<TestResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (testId === 'aria-labels') {
        resolve({
          id: testId,
          name: 'ARIA Labels Test',
          passed: false,
          issues: [
            'Button missing aria-label',
            'Input with unclear label',
          ],
        });
      } else {
        resolve({
          id: testId,
          name: AVAILABLE_TESTS.find(t => t.id === testId)?.name || 'Unknown Test',
          passed: true,
          issues: [],
        });
      }
    }, 1000);
  });
};

export default function ScreenReaderTestPage() {
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRunTest = async (testId: string) => {
    setIsLoading(true);
    const results = await mockRunTest(testId);
    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Screen Reader Tests</h1>
        <Link href="/test-files/accessibility">
          <Button variant="outline">
            <ExternalLink className="w-4 h-4 mr-2" />
            Back to Accessibility Tests
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {AVAILABLE_TESTS.map((test) => (
          <Card key={test.id}>
            <CardHeader>
              <CardTitle>{test.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{test.description}</p>
              <Button
                onClick={() => {
                  setSelectedTest(test.id);
                  handleRunTest(test.id);
                }}
                disabled={isLoading || selectedTest === test.id}
              >
                {isLoading && selectedTest === test.id ? 'Running...' : 'Run Test'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {testResults && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-lg font-semibold">
                  {testResults.passed ? '✅ Passed' : '❌ Failed'}: {testResults.name}
                </p>
                {testResults.issues.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Issues Found:</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      {testResults.issues.map((issue, index) => (
                        <li key={index} className="text-red-500">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {testResults.passed && <div className="mt-2 text-green-700 text-sm">No issues found!</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
