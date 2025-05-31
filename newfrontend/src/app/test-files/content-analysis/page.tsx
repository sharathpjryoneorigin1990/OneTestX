'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { NewNavbar } from '@/components/layout/NewNavbar';

// Dynamically import the ContentAnalysis component with SSR disabled
const ContentAnalysis = dynamic(
  () => import('@/components/content-analysis/ContentAnalysis'),
  { ssr: false }
);

export default function ContentAnalysisPage() {
  const [isClient, setIsClient] = useState(false);
  const searchParams = useSearchParams();
  const category = searchParams?.get('category') || 'ai';
  const type = searchParams?.get('type') || 'content';

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <NewNavbar />
      <main className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
            Content Analysis
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Analyze text content for sentiment, readability, and key insights using AI-powered NLP techniques.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <ContentAnalysis />
        </motion.div>
      </main>
    </div>
  );
}
