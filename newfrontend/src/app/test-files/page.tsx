'use client';

import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { FiFileText, FiImage } from 'react-icons/fi';
import dynamic from 'next/dynamic';

// Dynamically import components with no SSR
const TestFilesList = dynamic(() => import('../test-dashboard/test-files-new'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <p>Loading test files...</p>
    </div>
  ),
});

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

export default function TestFilesPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const category = searchParams.get('category') || '';
  const activeTab = type === 'visual' ? 'visual' : 'test-files';

  // Show tabs when type=visual, otherwise just show test files
  const isVisualType = type === 'visual';

  if (!isVisualType) {
    return (
      <div className="container mx-auto py-6">
        <TestFilesList />
      </div>
    );
  }

  // For visual type, show tabs with both test files and visual testing
  return (
    <div className="container mx-auto py-6">
      <Tabs 
        value={activeTab}
        defaultValue="test-files"
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger 
            value="test-files" 
            className="flex items-center gap-2"
          >
            <FiFileText className="h-4 w-4" />
            Test Files
          </TabsTrigger>
          <TabsTrigger 
            value="visual" 
            className="flex items-center gap-2"
          >
            <FiImage className="h-4 w-4" />
            Visual Testing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="test-files">
          <TestFilesList />
        </TabsContent>
        
        <TabsContent value="visual">
          {activeTab === 'visual' && <VisualTestRunner />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
