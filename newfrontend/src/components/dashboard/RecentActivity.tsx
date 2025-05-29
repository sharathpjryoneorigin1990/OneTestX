import { CheckCircle, XCircle, Clock, AlertTriangle, GitCommit, GitPullRequest, Zap } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'deploy' | 'pr';
  title: string;
  description: string;
  time: string;
  user?: string;
}

interface RecentActivityProps {
  items?: ActivityItem[];
  loading?: boolean;
}

export function RecentActivity({ items = [], loading = false }: RecentActivityProps) {
  const defaultItems: ActivityItem[] = [
    {
      id: '1',
      type: 'success',
      title: 'All tests passed',
      description: 'Test suite completed successfully',
      time: '2 minutes ago',
      user: 'alexj'
    },
    {
      id: '2',
      type: 'deploy',
      title: 'Deployed to production',
      description: 'Version 2.3.1',
      time: '1 hour ago'
    },
    {
      id: '3',
      type: 'error',
      title: '3 tests failed',
      description: 'In feature/login branch',
      time: '3 hours ago',
      user: 'jamies'
    },
    {
      id: '4',
      type: 'pr',
      title: 'PR #42 merged',
      description: 'Update test coverage',
      time: '5 hours ago',
      user: 'taylorw'
    },
    {
      id: '5',
      type: 'warning',
      title: 'Performance warning',
      description: 'Checkout test exceeded threshold',
      time: '1 day ago',
      user: 'caseyk'
    }
  ];

  const displayItems = items.length > 0 ? items : defaultItems;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'deploy':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'pr':
        return <GitPullRequest className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-4 w-4 rounded-full bg-dark-700 mt-1"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-dark-700 rounded"></div>
              <div className="h-3 w-1/2 bg-dark-800 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayItems.map((item) => (
        <div key={item.id} className="group flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-dark-800/50 transition-colors">
          <div className="mt-1">
            {getIcon(item.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
              {item.title}
            </h4>
            <p className="text-xs text-gray-400 truncate">{item.description}</p>
            <div className="flex items-center mt-1 gap-2">
              <span className="text-xs text-gray-500">{item.time}</span>
              {item.user && (
                <>
                  <span className="text-gray-600">•</span>
                  <span className="text-xs text-gray-400">@{item.user}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
