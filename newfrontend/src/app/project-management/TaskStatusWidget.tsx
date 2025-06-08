'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FiCheckCircle, FiCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = {
  'To Do': '#3b82f6',
  'In Progress': '#f59e0b',
  'In Review': '#8b5cf6',
  'Done': '#10b981',
  'Blocked': '#ef4444'
};

const statusData = [
  { name: 'To Do', value: 12, icon: <FiCircle className="w-3 h-3" /> },
  { name: 'In Progress', value: 8, icon: <FiClock className="w-3 h-3 text-amber-500" /> },
  { name: 'In Review', value: 4, icon: <FiAlertCircle className="w-3 h-3 text-purple-500" /> },
  { name: 'Done', value: 16, icon: <FiCheckCircle className="w-3 h-3 text-emerald-500" /> },
  { name: 'Blocked', value: 2, icon: <FiAlertCircle className="w-3 h-3 text-red-500" /> },
];

const CustomTooltip = ({ active, payload, totalTasks }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-sm">
        <div className="flex items-center gap-2">
          <div style={{ color: COLORS[data.name as keyof typeof COLORS] }}>
            {data.icon}
          </div>
          <span className="font-medium">{data.name}</span>
        </div>
        <p className="mt-1">{data.value} tasks ({((data.value / totalTasks) * 100).toFixed(0)}%)</p>
      </div>
    );
  }
  return null;
};

export default function TaskStatusWidget() {
  const totalTasks = statusData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="h-full bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl hover:shadow-lg hover:scale-[1.02] transform transition-all duration-200 ease-out">
      <CardHeader>
        <CardTitle className="text-lg">Task Status ({totalTasks} Total)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[300px] md:h-[250px]">
          <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.name as keyof typeof COLORS]} 
                      stroke="#1F2937" // Assuming card background is #1F2937 (dark-800)
                      strokeWidth={0.5}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip totalTasks={totalTasks} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-3 flex flex-col justify-center">
            {statusData.map((item) => {
              const percentage = ((item.value / totalTasks) * 100).toFixed(1);
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[item.name as keyof typeof COLORS] }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.value}</span>
                    <span className="text-xs text-gray-400 min-w-[3em] text-right">{percentage}%</span>
                  </div>
                </div>
              );
            })}
            <div className="pt-2 mt-2 border-t border-gray-200 dark:border-dark-750">
              <div className="flex justify-between text-sm font-medium">
                <span>Total Tasks</span>
                <span>{totalTasks}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}