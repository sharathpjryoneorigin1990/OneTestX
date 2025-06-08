'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FiClipboard, FiCheckCircle, FiPlayCircle, FiAlertTriangle, FiShare2 } from 'react-icons/fi';
import { useState } from 'react';

// Simulated Jira issues
const issues = [
  { key: 'BUG-101', summary: 'API error on login', assignee: 'Alice', status: 'done', completedDate: '2025-06-05', type: 'bug' },
  { key: 'TASK-102', summary: 'Add SSO support', assignee: 'Bob', status: 'in progress', completedDate: '', type: 'task' },
  { key: 'BUG-103', summary: 'UI not responsive', assignee: 'Alice', status: 'in progress', completedDate: '', type: 'bug' },
  { key: 'TASK-104', summary: 'Optimize database queries', assignee: 'Taylor', status: 'blocked', completedDate: '', type: 'task', blockerReason: 'Waiting on vendor' },
  { key: 'BUG-105', summary: 'Critical bug in auth', assignee: 'Jamie', status: 'done', completedDate: '2025-06-05', type: 'bug' },
  { key: 'TASK-106', summary: 'Mobile responsiveness fixes', assignee: 'Sam', status: 'in progress', completedDate: '', type: 'task' },
  { key: 'BUG-107', summary: 'Payment gateway unstable', assignee: 'Taylor', status: 'blocked', completedDate: '', type: 'bug', blockerReason: 'API unstable' },
];

// Utility to get yesterday's date string
function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

const StandupSummary = () => {
  const [copied, setCopied] = useState(false);
  const yesterday = getYesterday();

  // Aggregate by AI
  const completed = issues.filter(i => i.status === 'done' && i.completedDate === yesterday);
  const inProgress = issues.filter(i => i.status === 'in progress');
  const blockers = issues.filter(i => i.status === 'blocked');

  // Generate summary text
  const summary = `📋 *Daily Stand-Up Summary*\n\n` +
    `✅ *Completed Yesterday*:\n` +
    (completed.length ? completed.map(i => `- ${i.summary} (${i.key}, ${i.assignee})`).join('\n') : 'None') +
    `\n\n🟡 *In Progress Today*:\n` +
    (inProgress.length ? inProgress.map(i => `- ${i.summary} (${i.key}, ${i.assignee})`).join('\n') : 'None') +
    `\n\n🚩 *Blockers*:\n` +
    (blockers.length ? blockers.map(i => `- ${i.summary} (${i.key}, ${i.assignee})${i.blockerReason ? ' — ' + i.blockerReason : ''}`).join('\n') : 'None');

  const handleCopy = () => {
    navigator.clipboard.writeText(summary.replace(/\*/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="h-full bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl hover:shadow-lg hover:scale-[1.02] transform transition-all duration-200 ease-out">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <FiClipboard className="mr-2 text-purple-500" />
          Automated Stand-Up Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 text-xs text-gray-500">AI-generated from Jira issues</div>
        <div className="mb-4">
          <div className="font-medium mb-1 flex items-center"><FiCheckCircle className="text-green-500 mr-2" />Completed Yesterday</div>
          <ul className="mb-2 ml-5 list-disc text-sm">
            {completed.length ? completed.map(i => <li key={i.key}>{i.summary} <span className="text-xs text-gray-400">({i.key}, {i.assignee})</span></li>) : <li>None</li>}
          </ul>
          <div className="font-medium mb-1 flex items-center"><FiPlayCircle className="text-yellow-500 mr-2" />In Progress Today</div>
          <ul className="mb-2 ml-5 list-disc text-sm">
            {inProgress.length ? inProgress.map(i => <li key={i.key}>{i.summary} <span className="text-xs text-gray-400">({i.key}, {i.assignee})</span></li>) : <li>None</li>}
          </ul>
          <div className="font-medium mb-1 flex items-center"><FiAlertTriangle className="text-red-500 mr-2" />Blockers</div>
          <ul className="ml-5 list-disc text-sm">
            {blockers.length ? blockers.map(i => <li key={i.key}>{i.summary} <span className="text-xs text-gray-400">({i.key}, {i.assignee})</span>{i.blockerReason && <span className="text-xs text-red-400"> — {i.blockerReason}</span>}</li>) : <li>None</li>}
          </ul>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <FiShare2 className="w-4 h-4 mr-1" /> {copied ? 'Copied!' : 'Copy Summary'}
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-400">Share this summary in Slack, Teams, or email.</div>
      </CardContent>
    </Card>
  );
};

export default StandupSummary;
