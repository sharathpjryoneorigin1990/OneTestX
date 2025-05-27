"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { Button } from '@/components/ui/Button';
import { Code, Terminal, GitBranch, Zap, BookOpen, Settings } from 'lucide-react';
import Link from 'next/link';

const apiSections = [
  {
    name: 'Test API',
    description: 'Core API for creating and running tests',
    items: [
      {
        name: 'test()',
        description: 'Create a new test case',
        example: `test('should navigate to home page', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle('OneTest X');
});`
      },
      {
        name: 'expect()',
        description: 'Make assertions in your tests',
        example: `await expect(page).toHaveTitle('OneTest X');
await expect(page.locator('h1')).toHaveText('Welcome');`
      },
      {
        name: 'page',
        description: 'Page object for browser interactions',
        example: `await page.goto(url);
await page.fill('input[name="username"]', 'test');
await page.click('button[type="submit"]');`
      },
    ]
  },
  {
    name: 'Configuration',
    description: 'Configure your testing environment',
    items: [
      {
        name: 'defineConfig()',
        description: 'Define your test configuration',
        example: `import { defineConfig } from '@onetestx/core';

export default defineConfig({
  testDir: './tests',
  reporters: ['html'],
  projects: [
    {
      name: 'chrome',
      use: { browserName: 'chromium' }
    }
  ]
});`
      },
      {
        name: 'projects',
        description: 'Define browser configurations',
        example: `projects: [
  {
    name: 'chrome',
    use: { browserName: 'chromium' }
  },
  {
    name: 'firefox',
    use: { browserName: 'firefox' }
  }
]`
      },
      {
        name: 'reporters',
        description: 'Configure test reporting',
        example: `reporters: [
  'html',
  ['junit', { outputFile: 'test-results.xml' }]
]`
      },
    ]
  },
  {
    name: 'Hooks',
    description: 'Test lifecycle hooks',
    items: [
      {
        name: 'beforeAll()',
        description: 'Run before all tests',
        example: `beforeAll(async () => {
  await page.goto('http://localhost:3000');
});`
      },
      {
        name: 'afterAll()',
        description: 'Run after all tests',
        example: `afterAll(async () => {
  await page.close();
});`
      },
      {
        name: 'beforeEach()',
        description: 'Run before each test',
        example: `beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000');
});`
      },
    ]
  },
];

export default function ApiPage() {
  return (
    <MainLayout>
      <NewNavbar />
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-dark-900 to-dark-800 pt-24 pb-16">
          <div className="absolute inset-0 bg-grid-white/[0.03]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 text-center"
            >
              <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-dark-800 text-cyan-400 mb-6 border border-cyan-500/20">
                <span className="mr-2">📚</span> API Reference
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                API Documentation
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-400">
                Comprehensive reference for OneTest X APIs and configuration options.
              </p>
            </motion.div>
          </div>
        </div>

        {/* API Sections */}
        <div className="py-16 md:py-24 bg-dark-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-12">
              {apiSections.map((section, sectionIndex) => (
                <motion.div
                  key={section.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
                  className="bg-dark-800/50 rounded-xl p-8 border border-dark-700"
                >
                  <h2 className="text-2xl font-bold text-white mb-4">{section.name}</h2>
                  <p className="text-gray-400 mb-6">{section.description}</p>
                  
                  <div className="space-y-6">
                    {section.items.map((item, itemIndex) => (
                      <div key={item.name} className="p-4 border-l-4 border-cyan-500/30">
                        <h3 className="text-lg font-medium text-white mb-2">{item.name}</h3>
                        <p className="text-gray-400 mb-4">{item.description}</p>
                        <pre className="bg-dark-800/50 p-4 rounded-lg border border-dark-700">
                          <code className="text-white">{item.example}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="relative overflow-hidden bg-gradient-to-br from-dark-800 to-dark-900">
          <div className="absolute inset-0 bg-grid-white/[0.03]" />
          <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Quick Links
              </h2>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link 
                  href="../guides/writing-tests"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 transition-all duration-200"
                >
                  Writing Tests
                </Link>
                <Link 
                  href="../guides/advanced-features"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-700 text-base font-medium rounded-lg text-white bg-dark-800/50 hover:bg-dark-700/80 hover:border-cyan-500/30 transition-all duration-200"
                >
                  Advanced Features
                </Link>
                <Link 
                  href="../configuration"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-700 text-base font-medium rounded-lg text-white bg-dark-800/50 hover:bg-dark-700/80 hover:border-cyan-500/30 transition-all duration-200"
                >
                  Configuration
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
