'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FiActivity } from 'react-icons/fi';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const generateBurndownData = () => {
  const days = 14;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  
  const data = [];
  let remainingWork = 100;
  let idealBurnRate = 100 / days;
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Simulate actual work done (with some randomness)
    const dailyBurn = idealBurnRate * (0.8 + Math.random() * 0.4);
    remainingWork = Math.max(0, remainingWork - dailyBurn);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: Math.round(remainingWork * 10) / 10,
      ideal: Math.max(0, 100 - (idealBurnRate * (i + 1)))
    });
  }
  
  return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-medium">{label}</p>
        <p className="text-sm flex items-center">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mr-2"></span>
          <span className="text-blue-500 font-medium">Actual:</span> {payload[0].value}%
        </p>
        <p className="text-sm flex items-center">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-gray-500 mr-2"></span>
          <span className="text-gray-500 dark:text-gray-400 font-medium">Ideal:</span> {payload[1].value}%
        </p>
      </div>
    );
  }
  return null;
};

const BurndownChart = () => {
  const data = generateBurndownData();

  return (
    <Card className="h-full w-full bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl hover:shadow-lg hover:scale-[1.02] transform transition-all duration-200 ease-out">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FiActivity className="h-5 w-5" />
          Sprint Burndown
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-4rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#9ca3af" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
            />
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-100 dark:stroke-gray-700" />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorActual)"
              name="Actual"
            />
            <Area
              type="monotone"
              dataKey="ideal"
              stroke="#9ca3af"
              strokeDasharray="5 5"
              fillOpacity={0}
              name="Ideal"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default BurndownChart;