"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { Button } from '@/components/ui/Button';
import { Terminal, Play, Code, Settings, GitBranch, Zap } from 'lucide-react';
import Link from 'next/link';

const cliCommands = [
  {
    name: 'run',
    description: 'Run tests',
    syntax: 'onetestx run [options] [test-file]',
    options: [
      { name: '--project', description: 'Specify which project(s) to run', value: 'project-name' },
      { name: '--grep', description: 'Run tests matching the pattern', value: 'pattern' },
      { name: '--ui', description: 'Launch the test runner UI', value: 'boolean' },
      { name: '--reporter', description: 'Specify reporters to use', value: 'reporter-name' },
      { name: '--config', description: 'Path to config file', value: 'path' },
    ],
    example: 'onetestx run --project chrome tests/**/*.spec.ts',
  },
  {
    name: 'init',
    description: 'Initialize a new OneTest X project',
    syntax: 'onetestx init',
    options: [
      { name: '--typescript', description: 'Use TypeScript', value: 'boolean' },
      { name: '--javascript', description: 'Use JavaScript', value: 'boolean' },
      { name: '--browser', description: 'Default browser', value: 'browser-name' },
      { name: '--reporter', description: 'Default reporter', value: 'reporter-name' },
    ],
    example: 'onetestx init --typescript --browser chromium',
  },
  {
    name: 'config',
    description: 'Manage configuration',
    syntax: 'onetestx config [subcommand]',
    subcommands: [
      { name: 'list', description: 'List current configuration' },
      { name: 'edit', description: 'Edit configuration file' },
      { name: 'validate', description: 'Validate configuration' },
    ],
    example: 'onetestx config list',
  },
  {
    name: 'version',
    description: 'Show version information',
    syntax: 'onetestx version',
    options: [],
    example: 'onetestx version',
  },
  {
    name: 'help',
    description: 'Show help information',
    syntax: 'onetestx help [command]',
    options: [],
    example: 'onetestx help run',
  },
];

export default function CliPage() {
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
                <span className="mr-2">💻</span> Command Line Interface
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                CLI Documentation
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-400">
                Command line interface for managing and running OneTest X tests.
              </p>
            </motion.div>
          </div>
        </div>

        {/* CLI Commands */}
        <div className="py-16 md:py-24 bg-dark-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-12">
              {cliCommands.map((command, commandIndex) => (
                <motion.div
                  key={command.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: commandIndex * 0.1 }}
                  className="bg-dark-800/50 rounded-xl p-8 border border-dark-700"
                >
                  <div className="flex items-center mb-6">
                    <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <Terminal className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-semibold text-white">{command.name}</h3>
                      <p className="mt-1 text-gray-400">{command.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-4 border-l-4 border-cyan-500/30">
                      <h4 className="text-lg font-medium text-white mb-2">Syntax</h4>
                      <pre className="bg-dark-800/50 p-4 rounded-lg border border-dark-700">
                        <code className="text-white">{command.syntax}</code>
                      </pre>
                    </div>

                    {command.options && command.options.length > 0 && (
                      <div className="p-4 border-l-4 border-cyan-500/30">
                        <h4 className="text-lg font-medium text-white mb-2">Options</h4>
                        <div className="space-y-4">
                          {command.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-start">
                              <div className="flex-shrink-0 w-32">
                                <code className="text-white bg-dark-800/50 px-2 rounded">{option.name}</code>
                              </div>
                              <div className="ml-4">
                                <p className="text-gray-400">{option.description}</p>
                                {option.value && (
                                  <p className="mt-1 text-sm text-gray-400">
                                    Value: <code className="text-white bg-dark-800/50 px-1 rounded">{option.value}</code>
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {command.subcommands && command.subcommands.length > 0 && (
                      <div className="p-4 border-l-4 border-cyan-500/30">
                        <h4 className="text-lg font-medium text-white mb-2">Subcommands</h4>
                        <div className="space-y-4">
                          {command.subcommands.map((subcommand, subcommandIndex) => (
                            <div key={subcommandIndex} className="flex items-start">
                              <div className="flex-shrink-0 w-32">
                                <code className="text-white bg-dark-800/50 px-2 rounded">{subcommand.name}</code>
                              </div>
                              <div className="ml-4">
                                <p className="text-gray-400">{subcommand.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-4 border-l-4 border-cyan-500/30">
                      <h4 className="text-lg font-medium text-white mb-2">Example</h4>
                      <pre className="bg-dark-800/50 p-4 rounded-lg border border-dark-700">
                        <code className="text-white">{command.example}</code>
                      </pre>
                    </div>
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
                  href="/docs/guides/writing-tests"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 transition-all duration-200"
                >
                  Writing Tests
                </Link>
                <Link 
                  href="/docs/configuration"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-700 text-base font-medium rounded-lg text-white bg-dark-800/50 hover:bg-dark-700/80 hover:border-cyan-500/30 transition-all duration-200"
                >
                  Configuration
                </Link>
                <Link 
                  href="/docs/getting-started"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-700 text-base font-medium rounded-lg text-white bg-dark-800/50 hover:bg-dark-700/80 hover:border-cyan-500/30 transition-all duration-200"
                >
                  Getting Started
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
