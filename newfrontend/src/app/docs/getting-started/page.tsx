"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { Button } from '@/components/ui/Button';
import { ArrowRight, Play, Code, GitBranch, Terminal, Zap, Settings } from 'lucide-react';
import Link from 'next/link';

const gettingStartedSteps = [
  {
    title: 'Install OneTest X',
    description: 'Get started by installing OneTest X in your project.',
    icon: <Play className="h-6 w-6 text-cyan-400" />,
    content: (
      <div className="space-y-4">
        <p className="text-gray-400">
          Install OneTest X using npm or yarn:
        </p>
        <pre className="bg-dark-800/50 p-4 rounded-lg border border-dark-700">
          <code className="text-white">npm install @onetestx/core</code>
        </pre>
        <p className="text-gray-400">
          Or with yarn:
        </p>
        <pre className="bg-dark-800/50 p-4 rounded-lg border border-dark-700">
          <code className="text-white">yarn add @onetestx/core</code>
        </pre>
        <p className="text-gray-400">
          After installation, you can create your first test file:
        </p>
        <pre className="bg-dark-800/50 p-4 rounded-lg border border-dark-700">
          <code className="text-white">{`
// test.spec.ts
// Import the test runner
import { test, expect } from '@onetestx/core';

// Create a test case
// The test function takes a title and an async function
// The function receives a page object that you can use for interactions
test('should navigate to home page', async ({ page }) => {
  // Navigate to your application
  await page.goto('http://localhost:3000');
  
  // Use expect to make assertions
  await expect(page).toHaveTitle('OneTest X');
});
`}</code>
        </pre>
      </div>
    ),
  },
  {
    title: 'Write Your First Test',
    description: 'Create your first test file using our simple syntax.',
    icon: <Code className="h-6 w-6 text-purple-400" />,
    content: (
      <div className="space-y-4">
        <p className="text-gray-400">
          Create a new test file called <code className="text-white bg-dark-800/50 px-1 rounded">test.spec.ts</code>:
        </p>
        <pre className="bg-dark-800/50 p-4 rounded-lg border border-dark-700">
          <code className="text-white">{`
// test.spec.ts
import { test, expect } from '@onetestx/core';

test('should navigate to home page', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle('OneTest X');
});
`}</code>
        </pre>
      </div>
    ),
  },
  {
    title: 'Run Your Tests',
    description: 'Execute your tests using our CLI or configuration system.',
    icon: <Terminal className="h-6 w-6 text-green-400" />,
    content: (
      <div className="space-y-4">
        <p className="text-gray-400">
          Run your tests using the CLI:
        </p>
        <pre className="bg-dark-800/50 p-4 rounded-lg border border-dark-700">
          <code className="text-white">npx onetestx test</code>
        </pre>
        <p className="text-gray-400">
          Or add it to your package.json scripts:
        </p>
        <pre className="bg-dark-800/50 p-4 rounded-lg border border-dark-700">
          <code className="text-white">{`
// package.json
{
  "scripts": {
    "test": "onetestx test"
  }
}
`}</code>
        </pre>
      </div>
    ),
  },
  {
    title: 'Configure Your Project',
    description: 'Set up your project configuration for optimal testing.',
    icon: <Settings className="h-6 w-6 text-indigo-400" />,
    content: (
      <div className="space-y-4">
        <p className="text-gray-400">
          Create a configuration file <code className="text-white bg-dark-800/50 px-1 rounded">onetestx.config.ts</code>:
        </p>
        <pre className="bg-dark-800/50 p-4 rounded-lg border border-dark-700">
          <code className="text-white">{`
// onetestx.config.ts
// Configure your test environment
import { defineConfig } from '@onetestx/core';

// Export your configuration
export default defineConfig({
  // Directory containing your test files
  testDir: './tests',
  
  // Reporters to use for test results
  reporters: ['html'],
  
  // Define your test projects
  projects: [
    {
      name: 'chrome',
      use: { 
        // Browser to use for testing
        browserName: 'chromium' 
      }
    }
  ]
});
`}</code>
        </pre>
      </div>
    ),
  },
];

export default function GettingStartedPage() {
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
                <span className="mr-2">🚀</span> Getting Started
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Getting Started with OneTest X
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-400">
                Learn how to install and set up OneTest X in your project.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Getting Started Steps */}
        <div className="py-16 md:py-24 bg-dark-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-12">
              {gettingStartedSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-dark-800/50 rounded-xl p-8 border border-dark-700"
                >
                  <div className="flex items-center mb-6">
                    <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      {step.icon}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                      <p className="mt-1 text-gray-400">{step.description}</p>
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    {step.content}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Next Steps */}
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
                Ready to dive deeper?
              </h2>
              <div className="mt-8 flex justify-center gap-4">
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
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
