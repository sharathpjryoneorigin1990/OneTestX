"use client";

import { Card, CardContent } from '@/components/ui/Card';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { motion } from 'framer-motion';
import Link from 'next/link';
import React from 'react';

export default function EnvironmentPage() {
  const environments = [
    {
      id: 'qa',
      name: 'QA',
      description: 'Quality Assurance environment for testing new features',
      color: 'from-blue-500 to-indigo-600',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'staging',
      name: 'Staging',
      description: 'Pre-production environment for final verification',
      color: 'from-amber-500 to-orange-600',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
        </svg>
      ),
    },
    {
      id: 'production',
      name: 'Production',
      description: 'Live environment with real user traffic',
      color: 'from-green-500 to-emerald-600',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <NewNavbar />
      <div className="min-h-screen flex items-center justify-center px-4 py-32">
        <div className="w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold gradient-text mb-4">Select Environment</h1>
            <p className="text-xl text-gray-300">
              Choose the environment where you want to run your tests
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {environments.map((env, index) => (
              <Link href={`/test-type?env=${env.id}`} key={env.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="h-full"
                >
                  <Card variant="glass" className="h-full overflow-hidden group cursor-pointer">
                    <div className={`absolute inset-0 bg-gradient-to-br ${env.color} opacity-20 group-hover:opacity-30 transition-opacity duration-300`} />
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${env.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
                    
                    <CardContent className="flex flex-col items-center text-center p-8">
                      <div className={`p-3 rounded-full bg-gradient-to-br ${env.color} mb-6 transform group-hover:rotate-12 transition-transform duration-300`}>
                        {env.icon}
                      </div>
                      <h2 className="text-2xl font-bold mb-2">{env.name}</h2>
                      <p className="text-gray-300">{env.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
