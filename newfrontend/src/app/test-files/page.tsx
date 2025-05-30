'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { FiFileText, FiImage, FiCpu } from 'react-icons/fi';
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

const SmartTestRunner = dynamic(
  () => import('@/components/smart-tests/SmartTestRunner'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <p>Loading smart tests...</p>
      </div>
    ),
  }
);

type TabType = 'test-files' | 'visual' | 'smart';

export default function TestFilesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const type = searchParams.get('type') as TabType | null;
  const category = searchParams.get('category') || '';
  const activeTab: TabType = type || 'test-files';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'test-files') {
      params.delete('type');
      params.delete('category');
    } else {
      params.set('type', value);
      params.set('category', category || 'ai');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Show only SmartTestRunner when type is 'smart'
  if (activeTab === 'smart') {
    return (
      <div className="container mx-auto py-6">
        <SmartTestRunner />
      </div>
    );
  }

  // Show only Test Files for non-special types
  if (activeTab === 'test-files') {
    return (
      <div className="container mx-auto py-6">
        <TestFilesList />
      </div>
    );
  }

  // For visual type, show tabs with test files and visual testing
  return (
    <div className="container mx-auto py-6">
      <Tabs 
        value={activeTab}
        defaultValue="test-files"
        onValueChange={handleTabChange}
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
