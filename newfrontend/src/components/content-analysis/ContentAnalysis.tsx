'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  keywords: string[];
  entities: {
    type: string;
    text: string;
    relevance: number;
  }[];
  summary: string;
  metrics: {
    wordCount: number;
    sentenceCount: number;
    readingTime: number;
    characterCount: number;
    averageWordLength: number;
  };
  readability: {
    score: number;
    level: string;
    description?: string; // Made optional to match the API response
  };
  version: string;
  analyzedAt: string;
}

export default function ContentAnalysis() {
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisTime, setAnalysisTime] = useState<number | null>(null);

  const analyzeContent = async () => {
    if (!content.trim()) {
      setError('Please enter some content to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setAnalysisTime(null);

    const startTime = Date.now();

    try {
      const response = await fetch('/api/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }
      
      const data = await response.json();
      
      // Map the API response to our expected format
      const analysisResult: AnalysisResult = {
        sentiment: data.sentiment || 'neutral',
        sentimentScore: data.sentimentScore || 0,
        keywords: data.keywords || [],
        entities: data.entities || [],
        summary: data.summary || '',
        metrics: data.metrics || {
          wordCount: 0,
          sentenceCount: 0,
          readingTime: 0,
          characterCount: 0,
          averageWordLength: 0,
        },
        readability: {
          score: data.readability?.score || 0,
          level: data.readability?.level || 'Standard',
          description: data.readability?.description || ''
        },
        version: data.version || '1.0.0',
        analyzedAt: data.analyzedAt || new Date().toISOString()
      };
      
      const endTime = Date.now();
      setAnalysisTime(endTime - startTime);
      setResult(analysisResult);
    } catch (err) {
      console.error('Error analyzing content:', err);
      setError('Failed to analyze content. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      default: return '😐';
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-800/50 rounded-xl border border-gray-700/50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Content Analysis</h2>
        {analysisTime && (
          <span className="text-sm text-gray-400">
            Analyzed in {(analysisTime / 1000).toFixed(2)}s
          </span>
        )}
      </div>
      
      <div className="mb-6">
        <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
          Enter text to analyze
        </label>
        <textarea
          id="content"
          rows={8}
          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          placeholder="Paste your content here for analysis..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={analyzeContent}
          disabled={isAnalyzing || !content.trim()}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isAnalyzing || !content.trim() 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-cyan-600 hover:bg-cyan-700'
          }`}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Content'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300">
          {error}
        </div>
      )}

      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="animate-pulse text-cyan-400 text-2xl">🔍</div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-gray-300 font-medium">Analyzing your content</p>
            <p className="text-sm text-gray-500 mt-1">This may take a few moments...</p>
          </div>
        </div>
      )}

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Sentiment</h3>
              <div className="flex items-center">
                <span className="text-3xl mr-3">
                  {getSentimentEmoji(result.sentiment)}
                </span>
                <div>
                  <div className={`text-xl font-semibold capitalize ${getSentimentColor(result.sentiment)}`}>
                    {result.sentiment}
                  </div>
                  <div className="text-xs text-gray-400">
                    Score: {result.sentimentScore.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Readability</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">{result.readability.level}</span>
                  <span className="text-cyan-400 font-medium">{result.readability.score}/100</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full" 
                    style={{ width: `${result.readability.score}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Content Metrics</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-2xl font-bold text-white">{formatNumber(result.metrics.wordCount)}</div>
                  <div className="text-xs text-gray-400">Words</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{formatNumber(result.metrics.characterCount)}</div>
                  <div className="text-xs text-gray-400">Characters</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{result.metrics.sentenceCount}</div>
                  <div className="text-xs text-gray-400">Sentences</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">~{result.metrics.readingTime}m</div>
                  <div className="text-xs text-gray-400">Reading Time</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700/50">
            <h3 className="text-lg font-semibold text-gray-200 mb-3">Key Insights</h3>
            <p className="text-gray-300 mb-4">{result.summary}</p>
            
            <div className="mt-4">
              <h4 className="font-medium text-gray-200 mb-2">Top Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((keyword, i) => (
                  <span key={i} className="px-3 py-1 bg-cyan-900/30 text-cyan-300 rounded-full text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {result.entities.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-200 mb-2">Identified Entities</h4>
                <div className="space-y-2">
                  {result.entities.map((entity, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-cyan-300">{entity.text}</span>
                      <span className="text-gray-400">{entity.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {result && (
            <div className="mt-8 pt-4 border-t border-gray-700/50 text-xs text-gray-500 flex justify-between items-center">
              <div>
                Analyzed on {new Date(result.analyzedAt).toLocaleString()}
              </div>
              <div className="text-right">
                <div>v{result.version}</div>
                <div className="text-gray-600">{result.readability.description}</div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
