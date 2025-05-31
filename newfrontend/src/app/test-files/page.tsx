'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { FiFileText, FiImage, FiCpu, FiSearch } from 'react-icons/fi';
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

type TabType = 'test-files' | 'visual' | 'smart' | 'content-analysis';

export default function TestFilesPage() {
  console.log('TestFilesPage component mounted');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const type = searchParams.get('type')?.toLowerCase() as TabType | null;
  const category = searchParams.get('category')?.toLowerCase() || '';
  // Ensure activeTab is one of the valid tab types
  const activeTab: TabType = (type && ['test-files', 'visual', 'smart', 'content-analysis'].includes(type) ? type as TabType : 'test-files');
  
  console.log('Active tab:', activeTab, 'Category:', category, 'Type:', type);

  const handleTabChange = (value: string) => {
    if (value === 'content-analysis') {
      // Navigate to the content analysis page
      router.push(`/test-files/content-analysis?category=${category || 'ai'}&type=content`);
      return;
    }

    const params = new URLSearchParams();
    
    if (value !== 'test-files') {
      params.set('type', value);
      // Only set category if it's not empty
      if (category) {
        params.set('category', category);
      } else if (value === 'visual') {
        // Default category for visual tests
        params.set('category', 'ui');
      }
    }
    
    // Only update URL if there are params or if we're switching to test-files tab
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  };

  // Show only SmartTestRunner when type is 'smart'
  if (activeTab === 'smart') {
    return (
      <div className="container mx-auto py-6">
        <SmartTestRunner />
      </div>
    );
  }

  // Show Content Analysis when type is 'content-analysis'
  if (activeTab === 'content-analysis') {
    // This will be handled by the content-analysis page route
    return null;
  }

  // Show only Test Files for non-special types
  if (activeTab === 'test-files') {
    console.log('Rendering TestFilesList with searchParams:', { category, type });
    return (
      <div className="container mx-auto py-6">
        <TestFilesList key={`${category}-${type}`} />
      </div>
    );
  }

  // For visual type, show visual testing tab
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
          
          <TabsTrigger 
            value="content-analysis" 
            className="flex items-center gap-2"
          >
            <FiSearch className="h-4 w-4" />
            Content Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual">
          <VisualTestRunner />
        </TabsContent>
      </Tabs>
    </div>
  );
}
