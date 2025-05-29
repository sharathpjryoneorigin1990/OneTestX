import React from 'react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'pink' | 'indigo';
  className?: string;
}

const colorMap = {
  blue: 'from-blue-500/20 to-blue-600/20 text-blue-400',
  green: 'from-green-500/20 to-green-600/20 text-green-400',
  red: 'from-red-500/20 to-red-600/20 text-red-400',
  yellow: 'from-yellow-500/20 to-yellow-600/20 text-yellow-400',
  purple: 'from-purple-500/20 to-purple-600/20 text-purple-400',
  pink: 'from-pink-500/20 to-pink-600/20 text-pink-400',
  indigo: 'from-indigo-500/20 to-indigo-600/20 text-indigo-400',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color,
  className = '',
}) => {
  const colors = colorMap[color] || colorMap.blue;
  const isPositive = trend && !trend.startsWith('0') && !trend.includes('0%') && !trend.includes('N/A');
  
  return (
    <div className={`bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm transition-all hover:border-${color}-500/30 hover:shadow-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {trend && (
            <div className={`mt-2 flex items-center text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <FiArrowUp className="mr-1" /> : <FiArrowDown className="mr-1" />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colors} bg-opacity-20`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
