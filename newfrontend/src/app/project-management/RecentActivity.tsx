'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FiActivity, FiCheckCircle, FiAlertCircle, FiPlus, FiGitBranch, FiGitPullRequest, FiMessageSquare } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

type ActivityType = 'task' | 'bug' | 'feature' | 'comment' | 'pr' | 'deployment';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  user: {
    name: string;
    avatar?: string;
    role?: string;
  };
  timestamp: Date;
  project?: string;
  status?: 'completed' | 'in-progress' | 'pending' | 'rejected';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

const RecentActivity = () => {
  // Sample activity data
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'task',
      title: 'Completed user authentication flow',
      user: {
        name: 'Alex Johnson',
        role: 'Frontend Developer',
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      project: 'Dashboard Redesign',
      status: 'completed',
    },
    {
      id: '2',
      type: 'bug',
      title: 'Fixed login form validation',
      description: 'Resolved issue with email validation on the login form',
      user: {
        name: 'Taylor Wilson',
        role: 'Full Stack Developer',
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      project: 'User Portal',
      status: 'completed',
      priority: 'high',
    },
    {
      id: '3',
      type: 'feature',
      title: 'Added dark mode support',
      user: {
        name: 'Jamie Smith',
        role: 'UI/UX Designer',
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      project: 'Mobile App',
      status: 'in-progress',
    },
    {
      id: '4',
      type: 'pr',
      title: 'Merge pull request #42 from feature/api-integration',
      description: 'Added API integration for user profile management',
      user: {
        name: 'Sam Wilson',
        role: 'Backend Developer',
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      project: 'API Service',
    },
    {
      id: '5',
      type: 'deployment',
      title: 'Deployed v2.1.0 to production',
      user: {
        name: 'DevOps Team',
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      status: 'completed',
    },
  ];

  // Get icon for activity type
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'task':
        return <FiCheckCircle className="h-4 w-4 text-blue-500" />;
      case 'bug':
        return <FiAlertCircle className="h-4 w-4 text-red-500" />;
      case 'feature':
        return <FiPlus className="h-4 w-4 text-green-500" />;
      case 'pr':
        return <FiGitPullRequest className="h-4 w-4 text-purple-500" />;
      case 'deployment':
        return <FiGitBranch className="h-4 w-4 text-indigo-500" />;
      case 'comment':
        return <FiMessageSquare className="h-4 w-4 text-amber-500" />;
      default:
        return <FiActivity className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Card className="h-full bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl hover:shadow-lg hover:scale-[1.02] transform transition-all duration-200 ease-out">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          View All
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 group">
              <div className="flex-shrink-0 mt-1">
                <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {activity.user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{activity.user.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {activity.status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(activity.status)}`}>
                        {activity.status.replace('-', ' ')}
                      </span>
                    )}
                    {activity.priority && (
                      <span className={`text-xs ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                    )}
                    <span className="text-gray-400 dark:text-gray-600">
                      {getActivityIcon(activity.type)}
                    </span>
                  </div>
                </div>
                <p className="text-sm mt-0.5 font-medium">
                  {activity.title}
                </p>
                {activity.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {activity.description}
                  </p>
                )}
                {activity.project && (
                  <span className="inline-block mt-1.5 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                    {activity.project}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
