'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FiCalendar, FiClock, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { format, isToday, isTomorrow, isAfter, isBefore, addDays } from 'date-fns';

type Deadline = {
  id: string;
  title: string;
  dueDate: Date;
  project: string;
  priority: 'high' | 'medium' | 'low';
  status: 'upcoming' | 'today' | 'overdue' | 'completed';
  assignee?: string;
};

const UpcomingDeadlines = () => {
  // Sample deadlines data
  const deadlines: Deadline[] = [
    {
      id: '1',
      title: 'Complete user authentication testing',
      dueDate: new Date(), // Today
      project: 'Auth Service',
      priority: 'high',
      status: 'today',
      assignee: 'Alex Johnson'
    },
    {
      id: '2',
      title: 'Submit performance test report',
      dueDate: addDays(new Date(), 1), // Tomorrow
      project: 'Performance',
      priority: 'medium',
      status: 'upcoming',
      assignee: 'Taylor Wilson'
    },
    {
      id: '3',
      title: 'Review and merge pull request #42',
      dueDate: addDays(new Date(), 3),
      project: 'API Gateway',
      priority: 'high',
      status: 'upcoming',
      assignee: 'Sam Wilson'
    },
    {
      id: '4',
      title: 'Update test documentation',
      dueDate: addDays(new Date(), -1), // Yesterday
      project: 'Documentation',
      priority: 'low',
      status: 'overdue',
      assignee: 'Jamie Smith'
    },
    {
      id: '5',
      title: 'Complete end-to-end test cases',
      dueDate: addDays(new Date(), 7),
      project: 'E2E Testing',
      priority: 'medium',
      status: 'upcoming',
      assignee: 'Casey Lee'
    },
  ];

  // Function to get status based on due date
  const getStatus = (dueDate: Date): Deadline['status'] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    if (isToday(due)) return 'today';
    if (isBefore(due, today)) return 'overdue';
    return 'upcoming';
  };

  // Function to get status text and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'today':
        return { text: 'Due Today', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' };
      case 'overdue':
        return { text: 'Overdue', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
      case 'completed':
        return { text: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
      default:
        return { text: 'Upcoming', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
    }
  };

  // Function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Function to format date
  const formatDueDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  // Sort deadlines by due date (earliest first)
  const sortedDeadlines = [...deadlines].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  return (
    <Card className="h-full bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl hover:shadow-lg hover:scale-[1.02] transform transition-all duration-200 ease-out">
      <CardHeader>
        <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedDeadlines.map((deadline) => {
            const statusInfo = getStatusInfo(deadline.status);
            const status = getStatus(deadline.dueDate);
            const isOverdue = status === 'overdue';
            
            return (
              <div key={deadline.id} className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 py-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">{deadline.title}</h4>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <FiCalendar className="w-3 h-3 mr-1" />
                      <span>{formatDueDate(deadline.dueDate)}</span>
                      <span className="mx-2">•</span>
                      <span>{deadline.project}</span>
                      {deadline.assignee && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{deadline.assignee}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color} mr-2`}>
                      {statusInfo.text}
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(deadline.priority)}`} />
                  </div>
                </div>
                {isOverdue && (
                  <div className="mt-1 flex items-center text-xs text-red-500 dark:text-red-400">
                    <FiAlertTriangle className="w-3 h-3 mr-1" />
                    This deadline has passed
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            View all deadlines
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingDeadlines;
