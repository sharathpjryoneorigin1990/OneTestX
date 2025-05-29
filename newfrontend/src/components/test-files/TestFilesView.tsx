'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/ToastContext';
import { ChevronDown, ChevronRight, Play, X } from 'lucide-react';

interface TestCase {
  name: string;
  group: string | null;
  line: number;
}

export interface TestFile {
  id: string;
  name: string;
  path: string;
  category: string;
  tags: string[];
  testCases: TestCase[];
  lastRun?: {
    status: 'passed' | 'failed' | 'running' | 'pending';
    duration?: number;
    timestamp?: string;
  };
}

interface TestFilesViewProps {
  files: TestFile[] | undefined;
  loading: boolean;
  onRunTest: (testId: string) => Promise<void>;
  runningTests: string[];
  testLogs: Record<string, string[]>;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearFilters: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const TestFileCard = ({ 
  test, 
  isExpanded, 
  onToggle, 
  onRunTest, 
  isRunning, 
  logs = [] 
}: {
  test: TestFile;
  isExpanded: boolean;
  onToggle: () => void;
  onRunTest: () => void;
  isRunning: boolean;
  logs: string[];
}) => (
  <Card className="mb-4 overflow-hidden transition-all duration-200 hover:shadow-lg bg-dark-800 border border-dark-700 hover:border-blue-500/30">
    <div 
      className="flex items-center justify-between p-4 cursor-pointer hover:bg-dark-700/50 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 flex items-center justify-center text-gray-400">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{test.name}</h3>
          <p className="text-sm text-gray-400 truncate">{test.path}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          {test.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="default" className="text-xs bg-blue-900/30 text-blue-300 hover:bg-blue-800/50">
              {tag}
            </Badge>
          ))}
          {test.tags?.length > 2 && (
            <Badge variant="default" className="text-xs bg-dark-700 text-gray-300">
              +{test.tags.length - 2}
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-2 border-gray-700 text-gray-300 hover:bg-blue-900/30 hover:border-blue-500/50 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            onRunTest();
          }}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <LoadingSpinner className="mr-2 h-4 w-4" />
              Running
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-1" />
              Run
            </>
          )}
        </Button>
      </div>
    </div>
    
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="p-4 pt-0 border-t border-dark-700">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">Path</h4>
                <p className="text-sm font-mono break-all text-gray-300">{test.path}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">Category</h4>
                <Badge variant="default" className="bg-blue-900/30 text-blue-300">{test.category || 'N/A'}</Badge>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-400">Test Cases</h4>
                <span className="text-xs text-gray-500">
                  {test.testCases?.length || 0} test cases
                </span>
              </div>
              <div className="bg-dark-700/50 rounded-md p-3 max-h-40 overflow-y-auto border border-dark-600">
                {test.testCases && test.testCases.length > 0 ? (
                  <ul className="space-y-1">
                    {test.testCases.map((testCase, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-200">
                        <span className="w-4 h-4 rounded-full bg-green-500/20 mr-2 flex-shrink-0 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        </span>
                        <span className="truncate">{testCase.name}</span>
                        {testCase.group && (
                          <Badge variant="default" className="ml-2 text-xs bg-dark-600 text-gray-300">
                            {testCase.group}
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">No test cases found</p>
                )}
              </div>
            </div>
            
            {logs.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Logs</h4>
                <div className="bg-black/80 text-green-400 font-mono text-xs p-3 rounded-md border border-dark-600 overflow-x-auto max-h-40 overflow-y-auto">
                  {logs.map((log, i) => (
                    <div key={i} className="whitespace-pre">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </Card>
);

export function TestFilesView({
  files,
  loading,
  onRunTest,
  runningTests,
  testLogs,
  selectedCategory,
  onCategoryChange,
  selectedTags,
  onTagToggle,
  onClearFilters,
  searchQuery,
  onSearchChange
}: TestFilesViewProps) {
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract categories and tags from files
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    files?.forEach(file => {
      if (file?.category) {
        cats.add(file.category);
      }
    });
    return Array.from(cats).sort();
  }, [files]);

  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    files?.forEach(file => {
      file?.tags?.forEach(tag => tag && tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [files]);

  // Filter files based on search query, category, and tags
  const filteredFiles = React.useMemo(() => {
    if (!files) return [];
    
    return files.filter(file => {
      if (!file) return false;
      
      const matchesSearch = searchQuery === '' || 
        (file.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (file.path?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || 
        file.category?.toLowerCase() === selectedCategory.toLowerCase();
      
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => 
          file.tags?.some(t => t?.toLowerCase() === tag?.toLowerCase())
        );
      
      return matchesSearch && matchesCategory && matchesTags;
    });
  }, [files, searchQuery, selectedCategory, selectedTags]);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search test files..."
                  className="pl-10 w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => onSearchChange('')}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedCategory || ''}
                onChange={(e) => onCategoryChange(e.target.value || null)}
                className="px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              
              <select
                value=""
                onChange={(e) => {
                  const tag = e.target.value;
                  if (tag && !selectedTags.includes(tag)) {
                    onTagToggle(tag);
                  }
                }}
                className="px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Filter by tag</option>
                {allTags
                  .filter(tag => !selectedTags.includes(tag))
                  .map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          
          {/* Selected Tags */}
          {(selectedTags.length > 0 || selectedCategory) && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {selectedCategory && (
                <Badge 
                  variant="default"
                  className="flex items-center gap-1 bg-secondary text-secondary-foreground"
                >
                  {selectedCategory}
                  <button 
                    onClick={() => onCategoryChange(null)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {selectedTags.map(tag => (
                <Badge 
                  key={tag} 
                  variant="default"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <button 
                    onClick={() => onTagToggle(tag)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              
              {(selectedTags.length > 0 || selectedCategory) && (
                <button 
                  onClick={onClearFilters}
                  className="text-sm text-primary hover:underline ml-2"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Test Files List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : !files || files.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No test files found</p>
          </CardContent>
        </Card>
      ) : filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No test files found matching your criteria</p>
            <Button 
              variant="ghost" 
              className="mt-4"
              onClick={onClearFilters}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFiles.map((file) => (
            <TestFileCard
              key={file.id}
              test={file}
              isExpanded={expandedTest === file.id}
              onToggle={() => setExpandedTest(expandedTest === file.id ? null : file.id)}
              onRunTest={() => onRunTest(file.id)}
              isRunning={runningTests.includes(file.id)}
              logs={testLogs[file.id] || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
