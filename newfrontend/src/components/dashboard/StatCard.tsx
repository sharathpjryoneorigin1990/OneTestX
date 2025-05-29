import { ArrowUp, ArrowDown, Clock, CheckCircle, XCircle, Activity, GitBranch } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'pink';
  loading?: boolean;
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  change, 
  trend = 'neutral',
  color = 'blue',
  loading = false 
}: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-emerald-500',
    red: 'text-rose-500',
    yellow: 'text-amber-500',
    purple: 'text-purple-500',
    pink: 'text-pink-500',
  };

  const bgClasses = {
    blue: 'bg-blue-500/10',
    green: 'bg-emerald-500/10',
    red: 'bg-rose-500/10',
    yellow: 'bg-amber-500/10',
    purple: 'bg-purple-500/10',
    pink: 'bg-pink-500/10',
  };

  const trendIcons = {
    up: <ArrowUp className="h-3 w-3" />,
    down: <ArrowDown className="h-3 w-3" />,
    neutral: null,
  };

  return (
    <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-4 hover:border-dark-600 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-dark-700 rounded-md animate-pulse mt-1"></div>
          ) : (
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          )}
        </div>
        <div className={cn(
          'h-10 w-10 rounded-lg flex items-center justify-center',
          bgClasses[color]
        )}>
          {React.cloneElement(icon as React.ReactElement, {
            className: cn('h-5 w-5', colorClasses[color])
          })}
        </div>
      </div>
      
      {change && trend !== 'neutral' && !loading && (
        <div className={cn(
          'inline-flex items-center gap-1 mt-3 text-xs font-medium px-2 py-1 rounded-md',
          trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
        )}>
          {trendIcons[trend]}
          <span>{change} from last run</span>
        </div>
      )}
    </div>
  );
}
