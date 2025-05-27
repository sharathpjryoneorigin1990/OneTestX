"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { Button } from '@/components/ui/Button';
import { Check, Code, Zap, BarChart, GitBranch, Cpu, Shield, Code2, Database, GitFork, Layers, Terminal, Bug, Clock, BarChart4, CpuIcon } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: <Code2 className="h-6 w-6 text-cyan-400" />,
    title: 'Multi-Language Support',
    description: 'Write tests in your favorite programming language with support for JavaScript, TypeScript, Python, and more.',
  },
  {
    icon: <GitFork className="h-6 w-6 text-purple-400" />,
    title: 'Git Integration',
    description: 'Seamless integration with GitHub, GitLab, and Bitbucket for continuous testing.',
  },
  {
    icon: <Layers className="h-6 w-6 text-indigo-400" />,
    title: 'Parallel Test Execution',
    description: 'Run tests in parallel across multiple environments to speed up your CI/CD pipeline.',
  },
  {
    icon: <Terminal className="h-6 w-6 text-green-400" />,
    title: 'Interactive Test Runner',
    description: 'Run and debug tests directly from your terminal with real-time feedback.',
  },
  {
    icon: <Bug className="h-6 w-6 text-red-400" />,
    title: 'Smart Test Detection',
    description: 'Automatically detect and run only the tests affected by your code changes.',
  },
  {
    icon: <Clock className="h-6 w-6 text-yellow-400" />,
    title: 'Time Travel Debugging',
    description: 'Step through test execution history to identify when and why tests started failing.',
  },
  {
    icon: <BarChart4 className="h-6 w-6 text-blue-400" />,
    title: 'Performance Insights',
    description: 'Get detailed performance metrics and identify slow tests in your test suite.',
  },
  {
    icon: <CpuIcon className="h-6 w-6 text-pink-400" />,
    title: 'AI-Powered Test Generation',
    description: 'Automatically generate test cases using AI based on your codebase and usage patterns.',
  },
];

export default function FeaturesPage() {
  return (
    <MainLayout>
      <NewNavbar />
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-dark-900 to-dark-800 pt-24 pb-16">
          <div className="absolute inset-0 bg-grid-white/[0.03]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-dark-800 text-cyan-400 mb-6 border border-cyan-500/20">
                <span className="mr-2">✨</span> Powerful Features
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Everything You Need to Test Better
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-400">
                OneTest X provides a comprehensive suite of tools to make testing faster, more reliable, and more enjoyable.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/signup" className="flex justify-center">
                  <Button 
                    size="lg" 
                    className="px-8 py-3 text-base font-medium bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 transition-all duration-200"
                  >
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/demo" className="flex justify-center">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="px-8 py-3 text-base font-medium border-gray-700 hover:bg-dark-700/50 hover:border-cyan-500/30 transition-all duration-200"
                  >
                    View Demo
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="py-16 md:py-24 bg-dark-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 sm:text-4xl">
                Comprehensive Testing Solutions
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                All the tools you need to build, run, and maintain high-quality tests.
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-dark-800/50 p-6 rounded-xl border border-dark-700 hover:border-cyan-500/30 hover:bg-dark-800/80 transition-all duration-300 group"
                >
                  <div className="h-12 w-12 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors duration-300">
                    {React.cloneElement(feature.icon, { className: `${feature.icon.props.className} transition-transform duration-300 group-hover:scale-110` })}
                  </div>
                  <h3 className="mt-5 text-lg font-medium text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-gray-400">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
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
                <span className="block">Ready to transform your testing workflow?</span>
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-primary-400">
                  Start your free trial today.
                </span>
              </h2>
              <p className="mt-4 text-lg text-gray-300">
                Join thousands of developers who are already building better software with OneTest X.
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
                href="/signup" 
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 transition-all duration-200 md:py-3.5 md:text-lg md:px-8"
              >
                Get Started Free
              </Link>
              <Link 
                href="/contact" 
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-700 text-base font-medium rounded-lg text-white bg-dark-800/50 hover:bg-dark-700/80 hover:border-cyan-500/30 transition-all duration-200 md:py-3.5 md:text-lg md:px-8"
              >
                Contact Sales
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
