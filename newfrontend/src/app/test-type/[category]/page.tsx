'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { NewNavbar } from "@/components/layout/NewNavbar";

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

export default function SubTestTypePage({ params }: { params: { category: string } }) {
  const category = params.category as keyof typeof subTestTypes;
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
      <main className="min-h-screen bg-gray-900 text-white p-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold mb-4">{categoryTitles[category]}</h1>
            <p className="text-gray-400">
              Select the specific type of test you want to run
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 mb-8">
            {tests.map((test, index) => (
              <motion.div
                key={test.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-full"
              >
                <Link href={`/test-files?category=${category}&type=${test.title}`}>
                  <div className="relative group">
                    <div className={`${test.color} rounded-md p-3 text-white text-center transition-all duration-300 hover:scale-[1.02] cursor-pointer`}>
                      <span className="text-xl mr-2">{test.icon}</span>
                      <span className="font-medium">{test.title}</span>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute z-10 w-48 p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg
                      opacity-0 group-hover:opacity-100 invisible group-hover:visible
                      transition-all duration-200 -translate-y-2 group-hover:translate-y-0
                      left-1/2 -translate-x-1/2 bottom-full mb-2">
                      {test.description}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 transform rotate-45 w-2 h-2 bg-gray-900"></div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <Link href="/test-type" className="text-blue-400 hover:text-blue-300 transition-colors">
              ← Back to Test Categories
            </Link>
          </motion.div>
        </div>
      </main>
    </>
  );
}
