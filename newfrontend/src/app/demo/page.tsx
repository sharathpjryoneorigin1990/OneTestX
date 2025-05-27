"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Play, Code, Zap, BarChart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { NewNavbar } from "@/components/layout/NewNavbar";

export default function DemoPage() {
  const features = [
    {
      icon: <Play className="h-6 w-6 text-primary-400" />,
      title: 'Interactive Demo',
      description: 'Experience our platform with a hands-on demo that shows core features in action.',
    },
    {
      icon: <Code className="h-6 w-6 text-cyan-400" />,
      title: 'Code Examples',
      description: 'Explore real code samples and see how easy it is to integrate with your workflow.',
    },
    {
      icon: <Zap className="h-6 w-6 text-purple-400" />,
      title: 'Quick Start',
      description: 'Get up and running in minutes with our guided setup and configuration.',
    },
    {
      icon: <BarChart className="h-6 w-6 text-indigo-400" />,
      title: 'Performance Metrics',
      description: 'See the impact on your development speed and code quality with real metrics.',
    },
  ];

  return (
    <MainLayout>
      <NewNavbar />
      <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-dark-900 to-dark-800">
        <div className="absolute inset-0 bg-grid-white/[0.05]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center relative z-10"
          >
            <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-dark-800 text-cyan-400 mb-6 border border-cyan-500/20">
              <span className="mr-2">✨</span> Now with AI-powered test generation
              <ArrowRight className="ml-2 h-4 w-4" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              See OneTest X in Action
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-400">
              Experience the power of automated testing with our interactive demo. See how OneTest X can transform your development workflow.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/signup" className="flex justify-center">
                <Button 
                  size="lg" 
                  className="px-8 py-3 text-base font-medium bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 transition-all duration-200"
                >
                  Start Free Trial
                </Button>
              </Link>
              <Link href="#demo-video" className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="px-8 py-3 text-base font-medium border-gray-700 hover:bg-dark-700/50 hover:border-cyan-500/30 transition-all duration-200"
                >
                  <Play className="mr-2 h-5 w-5 text-cyan-400" />
                  Watch Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Demo Video Section */}
      <div id="demo-video" className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 -mt-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-dark-800/50 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-dark-700"
        >
          <div className="aspect-w-16 aspect-h-9 w-full bg-dark-900/50 flex items-center justify-center p-1">
            <div className="text-center p-8">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-cyan-500/10 mb-6 border border-cyan-500/20">
                <Play className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Interactive Demo</h3>
              <p className="mt-2 text-gray-400">Experience the OneTest X platform in action</p>
              <Button 
                size="lg"
                className="mt-6 bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 transition-all duration-200"
              >
                Launch Demo
              </Button>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent pointer-events-none" />
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="py-16 md:py-24 bg-dark-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 sm:text-4xl">
              Everything you need to test better
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
              Our platform is designed to help you ship better code, faster.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              <span className="block">Ready to dive in?</span>
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
