'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import React from 'react';
import { NewNavbar } from "@/components/layout/NewNavbar";

export default function TestTypePage() {
  const testTypes = [
    {
      title: 'AI Tests',
      description: 'Smart testing using artificial intelligence',
      icon: '🤖',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      title: 'UI Tests',
      description: 'Verify visual elements, layouts, and user interactions',
      icon: '🎨',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      title: 'API Tests',
      description: 'Test API endpoints and data flows',
      icon: '🔌',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      title: 'E2E Tests',
      description: 'End-to-end testing of user flows',
      icon: '🔄',
      color: 'from-amber-500 to-orange-600'
    },
    {
      title: 'Performance Tests',
      description: 'Measure and optimize performance',
      icon: '⚡',
      color: 'from-rose-500 to-pink-600'
    },
    {
      title: 'Security Tests',
      description: 'Verify security measures and vulnerabilities',
      icon: '🔒',
      color: 'from-red-500 to-rose-600'
    },
    {
      title: 'Integration Tests',
      description: 'Test component and service interactions',
      icon: '🔗',
      color: 'from-indigo-500 to-violet-600'
    },
    {
      title: 'Accessibility Tests',
      description: 'Ensure WCAG compliance and accessibility',
      icon: '♿',
      color: 'from-fuchsia-500 to-purple-600'
    }
  ];

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
              Select Test Type
            </motion.h1>
            <motion.p 
              className="text-lg text-gray-300 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Choose the type of test you want to run or create a custom test flow
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {testTypes.map((test, index) => (
              <motion.div
                key={test.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="h-full"
              >
                <Link href={`/test-type/${test.title.toLowerCase().split(' ')[0]}`}>
                  <div className="relative h-full group">
                    <div className={`h-full flex flex-col bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 transition-all duration-300 hover:border-opacity-50 hover:shadow-xl hover:shadow-${test.color.split('-')[1]}/10`}>
                      <div className={`mb-4 w-12 h-12 rounded-lg bg-gradient-to-br ${test.color} flex items-center justify-center text-2xl`}>
                        {test.icon}
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-white">{test.title}</h3>
                      <p className="text-gray-300 text-sm flex-grow">{test.description}</p>
                      <div className="mt-4 text-sm text-gray-400 group-hover:text-white transition-colors flex items-center">
                        Get started
                        <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    </div>
                    <div className={`absolute inset-0 bg-gradient-to-br ${test.color} rounded-xl opacity-0 group-hover:opacity-10 transition-opacity -z-10`}></div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="col-span-full flex justify-center mt-8">
            <motion.div 
              className="w-full sm:max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: testTypes.length * 0.05 + 0.1 }}
            >
              <Link href="/custom-flow">
                <div className="relative h-full group">
                  <div className="h-full flex flex-col bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 transition-all duration-300 hover:border-opacity-50 hover:shadow-xl hover:shadow-purple-500/10">
                    <div className="mb-4 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl">
                      🔧
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">Create Custom Test Flow</h3>
                    <p className="text-gray-300 text-sm flex-grow">Design and execute custom test workflows with our visual editor</p>
                    <div className="mt-4 text-sm text-gray-400 group-hover:text-white transition-colors flex items-center">
                      Get started
                      <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity -z-10"></div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </main>
    </>
  );
}
