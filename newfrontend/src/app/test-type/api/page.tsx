'use client';

import React from 'react';
import { NewNavbar } from "@/components/layout/NewNavbar";
import APITestRunner from '@/components/api-tests/APITestRunner';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function APITestingPage() {
  return (
    <>
      <NewNavbar />
      <main className="flex min-h-screen flex-col bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">API Testing</h1>
                <p className="text-gray-400">
                  Create, manage, and run API tests with support for REST, GraphQL, and more
                </p>
              </div>
              <Link 
                href="/test-type/api" 
                className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors group"
              >
                <svg className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to API Test Types
              </Link>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden"
          >
            <APITestRunner />
          </motion.div>
        </div>
      </main>
    </>
  );
}
