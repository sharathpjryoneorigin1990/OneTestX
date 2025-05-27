"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { Button } from '@/components/ui/Button';
import { Search, BookOpen, Code, Zap, Terminal, BookMarked, FileQuestion, Settings, GitBranch, Cpu, BarChart } from 'lucide-react';
import Link from 'next/link';

const categories = [
  {
    name: 'Getting Started',
    icon: <Zap className="h-5 w-5 text-cyan-400" />,
    description: 'New to OneTest X? Start here to learn the basics.',
    link: '/documentation/getting-started',
  },
  {
    name: 'API Reference',
    icon: <Code className="h-5 w-5 text-purple-400" />,
    description: 'Comprehensive API documentation for OneTest X.',
    link: '/documentation/api',
  },
  {
    name: 'CLI',
    icon: <Terminal className="h-5 w-5 text-green-400" />,
    description: 'Command line interface documentation and usage.',
    link: '/documentation/cli',
  },
  {
    name: 'Guides',
    icon: <BookMarked className="h-5 w-5 text-yellow-400" />,
    description: 'Step-by-step tutorials and how-to guides.',
    link: '/documentation/guides',
  },
  {
    name: 'FAQ',
    icon: <FileQuestion className="h-5 w-5 text-red-400" />,
    description: 'Frequently asked questions and troubleshooting.',
    link: '/documentation/faq',
  },
  {
    name: 'Integrations',
    icon: <GitBranch className="h-5 w-5 text-blue-400" />,
    description: 'Connect OneTest X with your favorite tools.',
    link: '/documentation/integrations',
  },
  {
    name: 'Configuration',
    icon: <Settings className="h-5 w-5 text-indigo-400" />,
    description: 'Configure OneTest X to fit your needs.',
    link: '/docs/configuration',
  },
  {
    name: 'AI Features',
    icon: <Cpu className="h-5 w-5 text-pink-400" />,
    description: 'Leverage AI for smarter testing.',
    link: '/docs/ai-features',
  },
  {
    name: 'Analytics',
    icon: <BarChart className="h-5 w-5 text-cyan-400" />,
    description: 'Track and analyze your test results.',
    link: '/docs/analytics',
  },
];

const popularArticles = [
  {
    title: 'Getting Started with OneTest X',
    description: 'A step-by-step guide to setting up your first test suite.',
    link: '/docs/getting-started/first-test',
  },
  {
    title: 'Writing Your First Test',
    description: 'Learn how to write effective tests with our framework.',
    link: '/docs/guides/writing-tests',
  },
  {
    title: 'CI/CD Integration',
    description: 'Set up continuous integration with GitHub Actions, GitLab CI, and more.',
    link: '/docs/guides/ci-cd',
  },
  {
    title: 'Test Parallelization',
    description: 'Speed up your test suite by running tests in parallel.',
    link: '/docs/guides/parallel-testing',
  },
];

export default function DocumentationPage() {
  const [searchQuery, setSearchQuery] = useState('');

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
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Documentation
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-400">
                Everything you need to know about OneTest X and how to use it effectively.
              </p>
              
              {/* Search Bar */}
              <div className="mt-10 max-w-2xl mx-auto">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-dark-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Search documentation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="py-16 md:py-24 bg-dark-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Popular Articles */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-16"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Popular Articles</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {popularArticles.map((article, index) => (
                  <Link 
                    key={article.title} 
                    href={article.link}
                    className="group block p-6 bg-dark-800/50 rounded-xl border border-dark-700 hover:border-cyan-500/30 hover:bg-dark-800/80 transition-all duration-300"
                  >
                    <h3 className="text-lg font-medium text-white group-hover:text-cyan-400 transition-colors">
                      {article.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-400">
                      {article.description}
                    </p>
                    <div className="mt-4 inline-flex items-center text-sm font-medium text-cyan-400 group-hover:text-cyan-300 transition-colors">
                      Read more
                      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Documentation Categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">Documentation Categories</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category, index) => (
                  <Link
                    key={category.name}
                    href={category.link}
                    className="group relative p-6 bg-dark-800/50 rounded-xl border border-dark-700 hover:border-cyan-500/30 hover:bg-dark-800/80 transition-all duration-300"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                        {category.icon}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-white group-hover:text-cyan-400 transition-colors">
                          {category.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-400">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 text-gray-500 group-hover:text-cyan-400 transition-colors">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-dark-800 to-dark-900">
          <div className="absolute inset-0 bg-grid-white/[0.03]" />
          <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:w-2/3"
            >
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                <span className="block">Need help?</span>
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-primary-400">
                  Our support team is here for you.
                </span>
              </h2>
              <p className="mt-4 text-lg text-gray-300">
                Can't find what you're looking for? Check our community forum or contact our support team.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 flex flex-col sm:flex-row gap-4 lg:mt-0 lg:flex-shrink-0"
            >
              <Link 
                href="/contact" 
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 transition-all duration-200 md:py-3.5 md:text-lg md:px-8"
              >
                Contact Support
              </Link>
              <Link 
                href="https://github.com/your-org/your-repo/discussions" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-700 text-base font-medium rounded-lg text-white bg-dark-800/50 hover:bg-dark-700/80 hover:border-cyan-500/30 transition-all duration-200 md:py-3.5 md:text-lg md:px-8"
              >
                Community Forum
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
