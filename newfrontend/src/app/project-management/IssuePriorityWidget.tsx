'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FiAlertTriangle, FiAlertOctagon, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type PriorityData = {
  name: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  description: string;
};

const IssuePriorityWidget = () => {
  // Sample data for issue priorities
  const priorityData: PriorityData[] = [
    {
      name: 'Critical',
      value: 8,
      color: '#EF4444', // red-500
      icon: <FiAlertTriangle className="w-4 h-4" />,
      description: 'Blocks development or testing work, production down, data loss, or security vulnerability.'
    },
    {
      name: 'High',
      value: 15,
      color: '#F59E0B', // amber-500
      icon: <FiAlertOctagon className="w-4 h-4" />,
      description: 'Major functionality is impacted or performance is severely degraded.'
    },
    {
      name: 'Medium',
      value: 23,
      color: '#3B82F6', // blue-500
      icon: <FiAlertCircle className="w-4 h-4" />,
      description: 'Minor functionality is impacted or performance is slightly degraded.'
    },
    {
      name: 'Low',
      value: 42,
      color: '#10B981', // emerald-500
      icon: <FiInfo className="w-4 h-4" />,
      description: 'Minor issue with little impact on functionality or performance.'
    }
  ];

  // Calculate total issues for percentage calculations
  const totalIssues = priorityData.reduce((sum, item) => sum + item.value, 0);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalIssues) * 100).toFixed(1);
      
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-${data.color}`}>
              {data.icon}
            </span>
            <p className="font-semibold">{data.name} Priority</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {data.value} issues ({percentage}%)
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {data.description}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl hover:shadow-lg hover:scale-[1.02] transform transition-all duration-200 ease-out">
      <CardHeader>
        <CardTitle className="text-lg">Issue Priority Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6 h-[300px] md:h-[250px]">
          {/* Bar Chart */}
          <div className="w-full md:w-1/2 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={priorityData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                barSize={24}
              >
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  radius={[0, 4, 4, 0]}
                  background={{ fill: '#f3f4f6', radius: 4 }}
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend and Details */}
          <div className="w-full md:w-1/2 space-y-4">
            <div className="space-y-3">
              {priorityData.map((item) => (
                <div key={item.name} className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-600 dark:text-gray-300">
                        {item.value} ({(item.value / totalIssues * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className="h-2 rounded-full" 
                        style={{
                          width: `${(item.value / totalIssues) * 100}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Total Issues</span>
                <span className="font-semibold">{totalIssues}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IssuePriorityWidget;
