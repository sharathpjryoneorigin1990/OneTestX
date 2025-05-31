'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const subTestTypes = {
  'ai': [
    {
      title: 'Visual AI Tests',
      description: 'Smart visual regression testing using machine learning',
      icon: '🤖',
      color: 'bg-purple-600'
    },
    {
      title: 'Smart Element Tests',
      description: 'AI-powered dynamic element detection and interaction',
      icon: '🎯',
      color: 'bg-indigo-600'
    },
    {
      title: 'Content Analysis',
      description: 'NLP-based content validation and testing',
      icon: '📝',
      color: 'bg-blue-600'
    },
    {
      title: 'Behavior Analysis',
      description: 'ML-driven user behavior and flow analysis',
      icon: '🧠',
      color: 'bg-green-600'
    }
  ],
  'mobile': [
    {
      title: 'Responsive Tests',
      description: 'Test layouts across different screen sizes',
      icon: '📱',
      color: 'bg-pink-600'
    },
    {
      title: 'Gesture Tests',
      description: 'Test touch interactions and gestures',
      icon: '👆',
      color: 'bg-red-600'
    },
    {
      title: 'Device Tests',
      description: 'Test on different mobile devices and OS versions',
      icon: '📲',
      color: 'bg-orange-600'
    },
    {
      title: 'Network Tests',
      description: 'Test under different network conditions',
      icon: '📡',
      color: 'bg-yellow-600'
    }
  ],
  'state': [
    {
      title: 'Redux Tests',
      description: 'Test Redux store, actions, and reducers',
      icon: '🔄',
      color: 'bg-purple-500'
    },
    {
      title: 'Context Tests',
      description: 'Test React Context providers and consumers',
      icon: '🌐',
      color: 'bg-blue-500'
    },
    {
      title: 'Storage Tests',
      description: 'Test local and session storage management',
      icon: '💾',
      color: 'bg-green-500'
    },
    {
      title: 'Session Tests',
      description: 'Test user session handling and persistence',
      icon: '🔑',
      color: 'bg-yellow-500'
    }
  ],
  'ui': [
    {
      title: 'Smoke Tests',
      description: 'Quick tests to verify basic UI functionality',
      icon: '🔍',
      color: 'bg-orange-500'
    },
    {
      title: 'E2E Tests',
      description: 'End-to-end testing of user flows and UI interactions',
      icon: '🔄',
      color: 'bg-blue-500'
    },
    {
      title: 'Visual Tests',
      description: 'Check layout, styling, and responsive design',
      icon: '👁️',
      color: 'bg-purple-500'
    },
    {
      title: 'Accessibility Tests',
      description: 'Verify WCAG compliance and a11y features',
      icon: '♿',
      color: 'bg-green-500'
    }
  ],
  'api': [
    {
      title: 'Functional Tests',
      description: 'Verify API endpoints work correctly',
      icon: '✅',
      color: 'bg-blue-500'
    },
    {
      title: 'Integration Tests',
      description: 'Test API interactions with other services',
      icon: '🔗',
      color: 'bg-purple-500'
    },
    {
      title: 'Security Tests',
      description: 'Check authentication and authorization',
      icon: '🔒',
      color: 'bg-red-500'
    },
    {
      title: 'Performance Tests',
      description: 'Test API response times and load handling',
      icon: '⚡',
      color: 'bg-yellow-500'
    }
  ],
  'e2e': [
    {
      title: 'User Flow Tests',
      description: 'Test complete user journeys',
      icon: '🚶',
      color: 'bg-green-500'
    },
    {
      title: 'Cross-browser Tests',
      description: 'Test across different browsers',
      icon: '🌐',
      color: 'bg-blue-500'
    },
    {
      title: 'Data-driven Tests',
      description: 'Test with different data sets',
      icon: '📊',
      color: 'bg-purple-500'
    },
    {
      title: 'Mobile Tests',
      description: 'Test on mobile devices',
      icon: '📱',
      color: 'bg-orange-500'
    }
  ],
  'performance': [
    {
      title: 'Load Tests',
      description: 'Test system under normal load',
      icon: '📈',
      color: 'bg-blue-500'
    },
    {
      title: 'Stress Tests',
      description: 'Test system under extreme conditions',
      icon: '💪',
      color: 'bg-red-500'
    },
    {
      title: 'Scalability Tests',
      description: 'Test system scaling capabilities',
      icon: '📊',
      color: 'bg-green-500'
    },
    {
      title: 'Endurance Tests',
      description: 'Test system over long periods',
      icon: '⏳',
      color: 'bg-yellow-500'
    }
  ],
  'security': [
    {
      title: 'Penetration Tests',
      description: 'Test for security vulnerabilities',
      icon: '🛡️',
      color: 'bg-red-500'
    },
    {
      title: 'Authentication Tests',
      description: 'Test login and access control',
      icon: '🔑',
      color: 'bg-blue-500'
    },
    {
      title: 'Data Security Tests',
      description: 'Test data encryption and protection',
      icon: '🔒',
      color: 'bg-purple-500'
    },
    {
      title: 'Compliance Tests',
      description: 'Test security compliance requirements',
      icon: '📋',
      color: 'bg-green-500'
    }
  ],
  'accessibility': [
    {
      title: 'Screen Reader Tests',
      description: 'Test screen reader compatibility',
      icon: '🔊',
      color: 'bg-blue-500'
    },
    {
      title: 'Keyboard Tests',
      description: 'Test keyboard navigation',
      icon: '⌨️',
      color: 'bg-purple-500'
    },
    {
      title: 'Color Contrast Tests',
      description: 'Test color accessibility',
      icon: '🎨',
      color: 'bg-yellow-500'
    },
    {
      title: 'ARIA Tests',
      description: 'Test ARIA attributes and roles',
      icon: '📝',
      color: 'bg-green-500'
    }
  ],
  'integration': [
    {
      title: 'Component Tests',
      description: 'Test component interactions',
      icon: '🧩',
      color: 'bg-blue-500'
    },
    {
      title: 'Service Tests',
      description: 'Test service integrations',
      icon: '🔌',
      color: 'bg-purple-500'
    },
    {
      title: 'Database Tests',
      description: 'Test database interactions',
      icon: '💾',
      color: 'bg-green-500'
    },
    {
      title: 'API Gateway Tests',
      description: 'Test API gateway integrations',
      icon: '🌐',
      color: 'bg-orange-500'
    }
  ]
};

// Define the type for our params
type PageParams = {
  category: keyof typeof subTestTypes;
};

// This is a client component that handles params properly
export default function SubTestTypePage({ 
  params 
}: { 
  params: PageParams;
}) {
  const [isClient, setIsClient] = useState(false);
  const [category, setCategory] = useState<keyof typeof subTestTypes>('ui');
  const searchParams = useSearchParams();
  
  // Handle params safely - in Next.js 13+, params is already available synchronously
  // We'll use a ref to track if we've processed the params
  const hasProcessedParams = React.useRef(false);
  
  React.useEffect(() => {
    if (!hasProcessedParams.current && params?.category && params.category in subTestTypes) {
      setCategory(params.category);
      hasProcessedParams.current = true;
    }
  }, [params]);
    
  // Get any additional search params
  const type = searchParams?.get('type');
  
  // Set isClient to true after mount to avoid hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Don't render anything during SSR to avoid hydration mismatch
  if (!isClient) {
    return null;
  }
    
  const tests = subTestTypes[category] || [];
  const categoryTitles: Record<string, string> = {
    'ai': 'AI-Powered Tests',
    'mobile': 'Mobile Tests',
    'state': 'State Management Tests',
    'ui': 'UI Tests',
    'api': 'API Tests',
    'e2e': 'E2E Tests',
    'performance': 'Performance Tests',
    'security': 'Security Tests',
    'accessibility': 'Accessibility Tests',
    'integration': 'Integration Tests'
  };

  return (
    <>
      <NewNavbar />
      <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {categoryTitles[category]}
            </motion.h1>
            <motion.p 
              className="text-lg text-gray-300 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Select the specific type of test you want to run
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {tests.map((test, index) => (
              <motion.div
                key={test.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="h-full"
              >
                <Link 
                  href={test.title === 'Content Analysis' 
                    ? `/test-files/content-analysis?category=${category}&type=content`
                    : `/test-files?category=${category}&type=${test.title.toLowerCase().split(' ')[0]}`}
                  className="h-full block group"
                >
                  <div className="relative h-full flex flex-col bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 transition-all duration-300 hover:border-opacity-50 hover:shadow-xl hover:shadow-cyan-500/10">
                    <div className={`mb-4 w-12 h-12 rounded-lg ${test.color} flex items-center justify-center text-2xl`}>
                      {test.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">{test.title}</h3>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">{test.description}</p>
                    <div className="mt-auto pt-2">
                      <div className="text-sm text-gray-400 group-hover:text-white transition-colors flex items-center">
                        Configure
                        <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    </div>
                    <div className={`absolute inset-0 ${test.color} rounded-xl opacity-0 group-hover:opacity-10 transition-opacity -z-10`}></div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <Link 
              href="/test-type" 
              className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors group"
            >
              <svg className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Test Categories
            </Link>
          </motion.div>
        </div>
      </main>
    </>
  );
}
