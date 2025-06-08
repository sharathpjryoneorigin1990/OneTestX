'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FiAlertTriangle, FiClock, FiUser, FiChevronRight } from 'react-icons/fi';
import { ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

// Simulated flagged tasks (from NLP on comments/descriptions)
const flaggedTasks = [
  {
    id: 'T-101',
    title: 'Integrate payment gateway',
    description: 'Blocked: waiting on vendor response',
    project: 'Dashboard Redesign',
    assignee: 'Alex Johnson',
    riskReason: 'waiting on vendor',
    riskLevel: 'high',
    status: 'blocked',
    updated: '2025-06-05',
  },
  {
    id: 'T-102',
    title: 'API error handling',
    description: 'API unstable, multiple failures reported',
    project: 'Dashboard Redesign',
    assignee: 'Taylor Wilson',
    riskReason: 'API unstable',
    riskLevel: 'high',
    status: 'in-progress',
    updated: '2025-06-06',
  },
  {
    id: 'T-103',
    title: 'Migrate legacy data',
    description: 'Overdue by 3 days, data inconsistencies found',
    project: 'API Integration',
    assignee: 'Jamie Smith',
    riskReason: 'overdue',
    riskLevel: 'medium',
    status: 'overdue',
    updated: '2025-06-03',
  },
  {
    id: 'T-104',
    title: 'Fix critical bug in auth',
    description: 'Critical bug: login fails for some users',
    project: 'Auth Service',
    assignee: 'Sam Wilson',
    riskReason: 'critical bug',
    riskLevel: 'high',
    status: 'open',
    updated: '2025-06-06',
  },
  {
    id: 'T-105',
    title: 'Update documentation',
    description: 'Minor issue, typo in API docs',
    project: 'Dashboard Redesign',
    assignee: 'Robin Lee',
    riskReason: 'minor issue',
    riskLevel: 'low',
    status: 'open',
    updated: '2025-06-05',
  },
];

// Generate heatmap data (risk count by project and assignee)
const projects = Array.from(new Set(flaggedTasks.map(t => t.project)));
const assignees = Array.from(new Set(flaggedTasks.map(t => t.assignee)));

const heatmapData = projects.map(project => {
  const row: any = { project };
  assignees.forEach(assignee => {
    row[assignee] = flaggedTasks.filter(t => t.project === project && t.assignee === assignee && t.riskLevel !== 'low').length;
  });
  return row;
});

const riskLevelColor = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-400',
};

const SmartRiskDetection = () => {
  return (
    <Card className="h-full bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl hover:shadow-lg hover:scale-[1.02] transform transition-all duration-200 ease-out">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <FiAlertTriangle className="mr-2 text-red-500" />
          Smart Risk Detection
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Flagged Tasks List */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-2">Flagged High-Risk Tasks (AI/NLP)</h4>
          <div className="space-y-2">
            {flaggedTasks.filter(t => t.riskLevel !== 'low').map(task => (
              <div key={task.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded p-2">
                <div className="flex items-center">
                  <FiAlertTriangle className="w-4 h-4 text-red-400 mr-2" />
                  <div>
                    <div className="font-medium text-sm">{task.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {task.description}
                    </div>
                    <div className="flex items-center text-xs mt-1">
                      <span className={`px-2 py-0.5 rounded-full ${riskLevelColor[task.riskLevel as keyof typeof riskLevelColor]} text-white mr-2`}>
                        {task.riskLevel.charAt(0).toUpperCase() + task.riskLevel.slice(1)} Risk
                      </span>
                      <span className="mr-2"><FiUser className="inline w-3 h-3 mr-1" />{task.assignee}</span>
                      <span className="mr-2">{task.project}</span>
                      <span className="mr-2"><FiClock className="inline w-3 h-3 mr-1" />{task.updated}</span>
                      <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs">{task.riskReason}</span>
                    </div>
                  </div>
                </div>
                <FiChevronRight className="text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Risk Heatmap */}
        <div>
          <h4 className="text-sm font-medium mb-2">Risk Heatmap</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-2 border-b text-left">Project</th>
                  {assignees.map(assignee => (
                    <th key={assignee} className="p-2 border-b text-left">{assignee}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row, i) => (
                  <tr key={i}>
                    <td className="p-2 border-b font-medium bg-gray-50 dark:bg-gray-800">{row.project}</td>
                    {assignees.map(assignee => {
                      const count = row[assignee];
                      let bg = '';
                      if (count >= 2) bg = 'bg-red-500';
                      else if (count === 1) bg = 'bg-yellow-400';
                      else bg = 'bg-gray-100 dark:bg-gray-900';
                      return (
                        <td key={assignee} className={`p-2 border-b text-center ${bg} text-white font-bold`}>
                          {count > 0 ? count : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartRiskDetection;
