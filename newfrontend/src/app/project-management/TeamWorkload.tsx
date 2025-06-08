'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FiUser, FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type TeamMemberWorkload = {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  completed: number;
  inProgress: number;
  blocked: number;
  total: number;
  capacity: number; // 1-100%
};

const teamData: TeamMemberWorkload[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    role: 'QA Lead',
    completed: 12,
    inProgress: 5,
    blocked: 1,
    total: 18,
    capacity: 85,
  },
  {
    id: '2',
    name: 'Jamie Smith',
    role: 'SDET',
    completed: 8,
    inProgress: 7,
    blocked: 0,
    total: 15,
    capacity: 75,
  },
  {
    id: '3',
    name: 'Taylor Wilson',
    role: 'QA Engineer',
    completed: 5,
    inProgress: 8,
    blocked: 2,
    total: 15,
    capacity: 65,
  },
  {
    id: '4',
    name: 'Jordan Lee',
    role: 'Automation Engineer',
    completed: 10,
    inProgress: 4,
    blocked: 0,
    total: 14,
    capacity: 70,
  },
  {
    id: '5',
    name: 'Casey Kim',
    role: 'QA Engineer',
    completed: 6,
    inProgress: 6,
    blocked: 1,
    total: 13,
    capacity: 80,
  },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-sm">
        <div className="font-medium mb-2">{data.name}</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span>Completed:</span>
          </div>
          <span className="text-right">{data.completed}</span>
          
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
            <span>In Progress:</span>
          </div>
          <span className="text-right">{data.inProgress}</span>
          
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span>Blocked:</span>
          </div>
          <span className="text-right">{data.blocked}</span>
          
          <div className="flex items-center font-medium">
            <FiUser className="w-3 h-3 mr-2 text-blue-500" />
            <span>Capacity:</span>
          </div>
          <span className="text-right font-medium">{data.capacity}%</span>
        </div>
      </div>
    );
  }
  return null;
};

interface TeamWorkloadProps {
  className?: string;
}

const TeamWorkload = ({ className = '' }: TeamWorkloadProps) => {
  // Sort team members by total workload (descending)
  const sortedTeamData = [...teamData].sort((a, b) => b.total - a.total);

  return (
    <Card className={`h-full bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl hover:shadow-lg hover:scale-[1.02] transform transition-all duration-200 ease-out ${className}`.trim()}>
      <CardHeader>
        <CardTitle className="text-lg">Team Workload</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedTeamData}
              layout="vertical"
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              barCategoryGap={8}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="stroke-gray-100 dark:stroke-gray-700" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={100}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="completed" stackId="a" name="Completed" fill="#10b981">
                {sortedTeamData.map((entry, index) => (
                  <Cell key={`completed-${index}`} fill="#10b981" />
                ))}
              </Bar>
              <Bar dataKey="inProgress" stackId="a" name="In Progress" fill="#f59e0b">
                {sortedTeamData.map((entry, index) => (
                  <Cell key={`inprogress-${index}`} fill="#f59e0b" />
                ))}
              </Bar>
              <Bar dataKey="blocked" stackId="a" name="Blocked" fill="#ef4444">
                {sortedTeamData.map((entry, index) => (
                  <Cell key={`blocked-${index}`} fill="#ef4444" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {teamData.reduce((sum, member) => sum + member.completed, 0)}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">Tasks Done</div>
          </div>
          <div className="flex flex-col items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {teamData.reduce((sum, member) => sum + member.inProgress, 0)}
            </div>
            <div className="text-sm text-amber-600 dark:text-amber-400">In Progress</div>
          </div>
          <div className="flex flex-col items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {teamData.reduce((sum, member) => sum + member.blocked, 0)}
            </div>
            <div className="text-sm text-red-600 dark:text-red-400">Blocked</div>
          </div>
          <div className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(teamData.reduce((sum, member) => sum + member.capacity, 0) / teamData.length)}%
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Avg. Capacity</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamWorkload;
