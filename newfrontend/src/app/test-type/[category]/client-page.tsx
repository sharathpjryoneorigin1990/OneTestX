'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import GitHubConnectionModal from "@/components/github/GitHubConnectionModal";

interface SubTestType {
  title: string;
  description: string;
  icon: string;
  color: string;
  isSpecial: boolean;
  href?: string;
}

const subTestTypes: Record<string, SubTestType[]> = {
  'ai': [
    {
      title: 'Build Your Test',
      description: 'Create custom tests using MCP concept',
      icon: '🛠️',
      color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      isSpecial: true,
      href: '/test-files?category=ai&type=test-builder'
    },
    {
      title: 'Visual AI Tests',
      description: 'Smart visual regression testing using machine learning',
      icon: '🤖',
      color: 'bg-purple-600',
      isSpecial: false
    },
    {
      title: 'Smart Element Tests',
      description: 'AI-powered dynamic element detection and interaction',
      icon: '🎯',
      color: 'bg-indigo-600',
      isSpecial: false
    },
    {
      title: 'Content Analysis',
      description: 'NLP-based content validation and testing',
      icon: '📝',
      color: 'bg-blue-600',
      isSpecial: false
    },
    {
      title: 'Behavior Analysis',
      description: 'ML-driven user behavior and flow analysis',
      icon: '🧠',
      color: 'bg-green-600',
      isSpecial: false
    }
  ],
  'mobile': [
    {
      title: 'Responsive Tests',
      description: 'Test layouts across different screen sizes',
      icon: '📱',
      color: 'bg-pink-600',
      isSpecial: false
    },
    {
      title: 'Gesture Tests',
      description: 'Test touch interactions and gestures',
      icon: '👆',
      color: 'bg-red-600',
      isSpecial: false
    },
    {
      title: 'Device Tests',
      description: 'Test on different mobile devices and OS versions',
      icon: '📲',
      color: 'bg-orange-600',
      isSpecial: false
    },
    {
      title: 'Network Tests',
      description: 'Test under various network conditions',
      icon: '📡',
      color: 'bg-yellow-600',
      isSpecial: false
    }
  ],
  'state': [
    {
      title: 'Redux Tests',
      description: 'Test Redux store, actions, and reducers',
      icon: '🔄',
      color: 'bg-purple-500',
      isSpecial: false
    },
    {
      title: 'Context Tests',
      description: 'Test React context providers and consumers',
      icon: '🌐',
      color: 'bg-blue-500',
      isSpecial: false
    },
    {
      title: 'Storage Tests',
      description: 'Test local/session storage interactions',
      icon: '💾',
      color: 'bg-green-500',
      isSpecial: false
    },
    {
      title: 'Session Tests',
      description: 'Test user session management',
      icon: '🔑',
      color: 'bg-yellow-500',
      isSpecial: false
    }
  ],
  'ui': [
    {
      title: 'Smoke Tests',
      description: 'Quick tests to verify basic UI functionality',
      icon: '🔍',
      color: 'bg-orange-500',
      isSpecial: false
    },
    {
      title: 'E2E Tests',
      description: 'End-to-end testing of user flows',
      icon: '🔄',
      color: 'bg-blue-400',
      isSpecial: false
    },
    {
      title: 'Component Tests',
      description: 'Test individual UI components in isolation',
      icon: '🧩',
      color: 'bg-green-400',
      isSpecial: false
    },
    {
      title: 'Visual Tests',
      description: 'Visual regression testing',
      icon: '👁️',
      color: 'bg-purple-400',
      isSpecial: false
    }
  ],
  'api': [
    {
      title: 'API Testing Suite',
      description: 'Comprehensive API testing with Swagger/Postman import',
      icon: '🌐',
      color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      isSpecial: true
    },
    {
      title: 'GraphQL Tests',
      description: 'Test GraphQL queries and mutations',
      icon: '📊',
      color: 'bg-pink-600',
      isSpecial: false
    },
    {
      title: 'WebSocket Tests',
      description: 'Test real-time WebSocket connections',
      icon: '🔌',
      color: 'bg-green-600',
      isSpecial: false
    },
    {
      title: 'Load Tests',
      description: 'Test API performance under load',
      icon: '⚡',
      color: 'bg-yellow-500',
      isSpecial: false
    }
  ],
  'e2e': [
    {
      title: 'User Flow Tests',
      description: 'Test complete user journeys',
      icon: '🚶',
      color: 'bg-green-500',
      isSpecial: false
    },
    {
      title: 'Cross-browser Tests',
      description: 'Test across different browsers',
      icon: '🌐',
      color: 'bg-blue-500',
      isSpecial: false
    },
    {
      title: 'Regression Tests',
      description: 'Test for regressions after changes',
      icon: '🔄',
      color: 'bg-red-500',
      isSpecial: false
    },
    {
      title: 'Performance Tests',
      description: 'Test application performance',
      icon: '⏱️',
      color: 'bg-green-600',
      isSpecial: false
    },
    {
      title: 'Scalability Tests',
      description: 'Test application scaling',
      icon: '📈',
      color: 'bg-purple-600',
      isSpecial: false
    }
  ],
  'security': [
    {
      title: 'Penetration Tests',
      description: 'Test for security vulnerabilities',
      icon: '🛡️',
      color: 'bg-red-600',
      isSpecial: false
    },
    {
      title: 'XSS Tests',
      description: 'Test for cross-site scripting vulnerabilities',
      icon: '🔒',
      color: 'bg-orange-600',
      isSpecial: false
    },
    {
      title: 'CSRF Tests',
      description: 'Test for cross-site request forgery vulnerabilities',
      icon: '🔑',
      color: 'bg-yellow-600',
      isSpecial: false
    },
    {
      title: 'SQL Injection Tests',
      description: 'Test for SQL injection vulnerabilities',
      icon: '💉',
      color: 'bg-red-500',
      isSpecial: false
    }
  ],
  'performance': [
    {
      title: 'Load Testing',
      description: 'Simulate high user traffic to test system stability and identify bottlenecks.',
      icon: '🏋️',
      color: 'bg-red-500',
      isSpecial: false,
      href: '/test-files?category=performance&type=load'
    },
    {
      title: 'Stress Testing',
      description: 'Push the system beyond normal operating limits to check its robustness and error handling.',
      icon: '🔥',
      color: 'bg-orange-600',
      isSpecial: false,
      href: '/test-files?category=performance&type=stress'
    },
    {
      title: 'Page Speed Analysis',
      description: 'Analyze and optimize web page loading times for better user experience and SEO.',
      icon: '⏱️',
      color: 'bg-yellow-500',
      isSpecial: false,
      href: '/test-files?category=performance&type=pagespeed'
    },
    {
      title: 'API Response Time',
      description: 'Measure and track the responsiveness of your API endpoints under various conditions.',
      icon: '💨',
      color: 'bg-teal-500',
      isSpecial: false,
      href: '/test-files?category=performance&type=apiresponse'
    }
  ],
  'accessibility': [
    {
      title: 'Screen Reader Tests',
      description: 'Test screen reader compatibility',
      icon: '🔊',
      color: 'bg-blue-600',
      isSpecial: false
    },
    {
      title: 'Keyboard Tests',
      description: 'Test keyboard navigation',
      icon: '⌨️',
      color: 'bg-purple-600',
      isSpecial: false
    },
    {
      title: 'Color Contrast Tests',
      description: 'Test color contrast ratios',
      icon: '🎨',
      color: 'bg-yellow-500',
      isSpecial: false
    },
    {
      title: 'ARIA Tests',
      description: 'Test ARIA attributes and roles',
      icon: '📝',
      color: 'bg-green-500',
      isSpecial: false
    }
  ],
  'integration': [
    {
      title: 'Component Tests',
      description: 'Test component interactions',
      icon: '🧩',
      color: 'bg-blue-500',
      isSpecial: false
    },
    {
      title: 'Service Tests',
      description: 'Test service integrations',
      icon: '🔌',
      color: 'bg-purple-500',
      isSpecial: false
    },
    {
      title: 'Database Tests',
      description: 'Test database interactions',
      icon: '💾',
      color: 'bg-green-500',
      isSpecial: false
    },
    {
      title: 'API Gateway Tests',
      description: 'Test API gateway integrations',
      icon: '🌐',
      color: 'bg-orange-500',
      isSpecial: false
    }
  ]
};

// Client component that doesn't need to deal with params Promise
export default function ClientSubTestTypePage({ category }: { category: string }) {
  const [isClient, setIsClient] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<keyof typeof subTestTypes>('ui');
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<any[]>([]);
  const [filteredTests, setFilteredTests] = useState<any[]>([]);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    // Only set if it's a valid category
    if (category && category in subTestTypes) {
      setCurrentCategory(category as keyof typeof subTestTypes);
    }
  }, [category]);

  // Get any additional search params
  const type = searchParams?.get('type');

  // We don't need to fetch tests on this page anymore
  // Tests will be fetched on the test-files page when a specific type is selected

  if (!isClient) {
    return null;
  }

  return (
    <>
      <NewNavbar />
      <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="container mx-auto px-4 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                {currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} Tests
              </h1>
              <p className="text-xl text-gray-300">
                Select a test type to configure and run
              </p>
            </div>
            <button 
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              onClick={() => setIsGitHubModalOpen(true)}
              aria-label="GitHub Settings"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 text-gray-400 hover:text-white" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
            </button>
          </div>
          </motion.div>

          <GitHubConnectionModal
            isOpen={isGitHubModalOpen}
            onClose={() => setIsGitHubModalOpen(false)}
            onConnect={(data: { username: string; token: string; repo: string }) => {
              console.log('GitHub connection data:', data);
              // Here you would typically make an API call to connect to GitHub
              setIsGitHubModalOpen(false);
              // Show success message
              alert('Successfully connected to GitHub!');
            }}
          />

          <GitHubConnectionModal
            isOpen={isGitHubModalOpen}
            onClose={() => setIsGitHubModalOpen(false)}
            onConnect={(data: { username: string; token: string; repo: string }) => {
              console.log('GitHub connection data:', data);
              // Here you would typically make an API call to connect to GitHub
              setIsGitHubModalOpen(false);
              // Show success message
              alert('Successfully connected to GitHub!');
            }}
          />

          <GitHubConnectionModal
            isOpen={isGitHubModalOpen}
            onClose={() => setIsGitHubModalOpen(false)}
            onConnect={(data: { username: string; token: string; repo: string }) => {
              console.log('GitHub connection data:', data);
              // Here you would typically make an API call to connect to GitHub
              setIsGitHubModalOpen(false);
              // Show success message
              alert('Successfully connected to GitHub!');
            }}
          />

          <GitHubConnectionModal
            isOpen={isGitHubModalOpen}
            onClose={() => setIsGitHubModalOpen(false)}
            onConnect={(data: { username: string; token: string; repo: string }) => {
              console.log('GitHub connection data:', data);
              // Here you would typically make an API call to connect to GitHub
              // For now, we'll just log the data and close the modal
              setIsGitHubModalOpen(false);
              // Show success message
              alert('Successfully connected to GitHub!');
            }}
          />

          <GitHubConnectionModal
            isOpen={isGitHubModalOpen}
            onClose={() => setIsGitHubModalOpen(false)}
            onConnect={(data: { username: string; token: string; repo: string }) => {
              console.log('GitHub connection data:', data);
              // Here you would typically make an API call to connect to GitHub
              // For now, we'll just log the data and close the modal
              setIsGitHubModalOpen(false);
              // Show success message
              alert('Successfully connected to GitHub!');
            }}
          />

          <GitHubConnectionModal
            isOpen={isGitHubModalOpen}
            onClose={() => setIsGitHubModalOpen(false)}
            onConnect={(data: { username: string; token: string; repo: string }) => {
              console.log('GitHub connection data:', data);
              // Here you would typically make an API call to connect to GitHub
              // For now, we'll just log the data and close the modal
              setIsGitHubModalOpen(false);
              // Show success message
              alert('Successfully connected to GitHub!');
            }}
          />

          <GitHubConnectionModal
            isOpen={isGitHubModalOpen}
            onClose={() => setIsGitHubModalOpen(false)}
            onConnect={(data) => {
              console.log('GitHub connection data:', data);
              // Here you would typically make an API call to connect to GitHub
              // For now, we'll just log the data and close the modal
              setIsGitHubModalOpen(false);
              // Show success message
              alert('Successfully connected to GitHub!');
            }}
          />

          {/* We don't show test files on this page anymore */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {subTestTypes[currentCategory]?.map((test, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="h-full"
              >
                {test.isSpecial ? (
                  <Link href={test.href || "/test-files?category=ai&type=test-builder"} className="h-full block group">
                    <div className="relative h-full flex flex-col bg-gradient-to-br from-blue-900/50 to-indigo-900/50 backdrop-blur-sm rounded-xl p-6 border border-blue-700/50 transition-all duration-300 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 overflow-hidden">
                      <div className="flex items-center mb-4">
                        <div className={`w-12 h-12 rounded-lg ${test.color} flex items-center justify-center text-2xl mr-4`}>
                          {test.icon}
                        </div>
                        <h3 className="text-2xl font-bold text-yellow-400">{test.title}</h3>
                      </div>
                      <p className="text-yellow-100 text-base mb-6">{test.description}</p>
                      <div className="mt-auto pt-2">
                        <div className="text-sm text-yellow-300 group-hover:text-white transition-colors flex items-center">
                          Start Building
                          <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute -right-2 -top-2 bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                        NEW
                      </div>
                    </div>
                  </Link>
                ) : (
                  <Link 
                    href={test.href || (() => {
                      if (test.title === 'Content Analysis') {
                        return `/test-files/content-analysis?category=${currentCategory}&type=content`;
                      } else if (test.title === 'API Testing Suite') {
                        return `/test-type/api`;
                      } else if (test.title === 'Color Contrast Tests') {
                        return '/test-files/color-contrast';
                      } else if (test.title === 'Keyboard Tests') {
                        return '/test-files/keyboard';
                      } else if (test.href) {
                        return test.href;
                      } else {
                        return `/test-files?category=${currentCategory}&type=${test.title.toLowerCase().split(' ')[0]}`;
                      }
                    })()}
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
                )}
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
      
      <GitHubConnectionModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        onConnect={(data: { username: string; token: string; repo: string }) => {
          console.log('GitHub connection data:', data);
          // The API call is now handled in the GitHubConnectionModal component
          setIsGitHubModalOpen(false);
          
          // We don't need an alert here anymore since we're showing the GitHubSyncResults component
          // You could add a toast notification here for a better UX
          // toast.success(`GitHub repository ${data.repo} connected and tests synchronized`);
        }}
      />
    </>
  );
}
