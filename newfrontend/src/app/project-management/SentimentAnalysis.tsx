'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FiSmile, FiFrown, FiTrendingUp, FiTrendingDown, FiMessageSquare } from 'react-icons/fi';

// Simulated sentiment data
const sentimentData = {
  current: 65, // percent positive
  previous: 80, // percent positive
  comments: [
    { author: 'Alex', text: 'We’re blocked on API, but team is collaborating well.', sentiment: 'neutral' },
    { author: 'Taylor', text: 'Great job on the release!', sentiment: 'positive' },
    { author: 'Jamie', text: 'I’m frustrated by the slow review process.', sentiment: 'negative' },
    { author: 'Robin', text: 'Sprint planning was smooth.', sentiment: 'positive' },
    { author: 'Sam', text: 'Too many meetings this week.', sentiment: 'negative' },
    { author: 'Alex', text: 'Excited for the new UI changes!', sentiment: 'positive' },
  ]
};

const getTrend = (current: number, previous: number) => {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'flat';
};

const SentimentAnalysis = () => {
  const { current, previous, comments } = sentimentData;
  const trend = getTrend(current, previous);
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500';
  const trendIcon = trend === 'up' ? <FiTrendingUp className="w-4 h-4 inline mr-1" /> : trend === 'down' ? <FiTrendingDown className="w-4 h-4 inline mr-1" /> : null;

  return (
    <Card className="h-full bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl hover:shadow-lg hover:scale-[1.02] transform transition-all duration-200 ease-out">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <FiMessageSquare className="mr-2 text-blue-500" />
          Team Sentiment Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-2">
          <span className="text-2xl font-bold mr-2">{current}%</span>
          <span className="text-sm text-gray-500">positive this sprint</span>
          {trendIcon && <span className={trendColor + ' ml-3 flex items-center'}>{trendIcon}{Math.abs(current - previous)}%</span>}
        </div>
        <div className="text-xs text-gray-500 mb-3">
          {trend === 'down' ? (
            <span>Down from {previous}% last sprint</span>
          ) : trend === 'up' ? (
            <span>Up from {previous}% last sprint</span>
          ) : (
            <span>Same as last sprint</span>
          )}
        </div>
        <div className="mb-2">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Recent Comments (AI Sentiment):</span>
          <ul className="mt-1 space-y-1">
            {comments.slice(0, 4).map((c, i) => (
              <li key={i} className="flex items-center gap-2 text-xs px-2 py-1 rounded bg-gray-50 dark:bg-gray-800">
                {c.sentiment === 'positive' && <FiSmile className="text-green-500 w-4 h-4" />}
                {c.sentiment === 'negative' && <FiFrown className="text-red-500 w-4 h-4" />}
                {c.sentiment === 'neutral' && <FiSmile className="text-gray-400 w-4 h-4" />}
                <span className="font-medium text-gray-800 dark:text-gray-200">{c.author}:</span>
                <span className="text-gray-600 dark:text-gray-400">{c.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-xs text-gray-400 mt-2">Based on Jira comments & Confluence pages (AI sentiment analysis)</div>
      </CardContent>
    </Card>
  );
};

export default SentimentAnalysis;
