'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FiCalendar, FiClock } from 'react-icons/fi';

type GanttTask = {
  id: number;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies?: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'on-hold';
  assignee?: string;
};

const GanttChart = () => {
  // Sample data for the Gantt chart
  const tasks: GanttTask[] = [
    {
      id: 1,
      name: 'Project Kickoff',
      start: new Date(2023, 5, 1),
      end: new Date(2023, 5, 5),
      progress: 100,
      status: 'completed',
      assignee: 'Alex Johnson'
    },
    {
      id: 2,
      name: 'Requirements Gathering',
      start: new Date(2023, 5, 6),
      end: new Date(2023, 5, 12),
      progress: 100,
      status: 'completed',
      assignee: 'Jamie Smith'
    },
    {
      id: 3,
      name: 'UI/UX Design',
      start: new Date(2023, 5, 10),
      end: new Date(2023, 5, 20),
      progress: 80,
      status: 'in-progress',
      assignee: 'Taylor Wilson'
    },
    {
      id: 4,
      name: 'Frontend Development',
      start: new Date(2023, 5, 15),
      end: new Date(2023, 6, 5),
      progress: 40,
      status: 'in-progress',
      assignee: 'Alex Johnson',
      dependencies: '3'
    },
    {
      id: 5,
      name: 'Backend Development',
      start: new Date(2023, 5, 15),
      end: new Date(2023, 6, 10),
      progress: 30,
      status: 'in-progress',
      assignee: 'Jamie Smith'
    },
    {
      id: 6,
      name: 'Testing',
      start: new Date(2023, 6, 5),
      end: new Date(2023, 6, 20),
      progress: 10,
      status: 'not-started',
      assignee: 'Taylor Wilson',
      dependencies: '4,5'
    },
    {
      id: 7,
      name: 'Deployment',
      start: new Date(2023, 6, 21),
      end: new Date(2023, 6, 25),
      progress: 0,
      status: 'not-started',
      assignee: 'Alex Johnson',
      dependencies: '6'
    }
  ];

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'on-hold':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-300';
    }
  };

  // Format date to display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate duration in days
  const getDuration = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  };

  return (
    <Card className="w-full h-full bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl hover:shadow-lg hover:scale-[1.02] transform transition-all duration-200 ease-out">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FiCalendar className="h-5 w-5" />
          Project Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Timeline header */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <div className="w-64 px-4 py-2 font-medium">Task</div>
              <div className="w-32 px-4 py-2 font-medium">Assignee</div>
              <div className="w-24 px-4 py-2 font-medium text-center">Status</div>
              <div className="w-24 px-4 py-2 font-medium text-right">Start</div>
              <div className="w-24 px-4 py-2 font-medium text-right">End</div>
              <div className="w-64 px-4 py-2 font-medium">Timeline</div>
            </div>

            {/* Timeline rows */}
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className="w-64 px-4 py-3">{task.name}</div>
                <div className="w-32 px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {task.assignee}
                </div>
                <div className="w-24 px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)} ${task.status === 'completed' ? 'text-white' : 'text-gray-800'}`}>
                    {task.status.replace('-', ' ')}
                  </span>
                </div>
                <div className="w-24 px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                  {formatDate(task.start)}
                </div>
                <div className="w-24 px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                  {formatDate(task.end)}
                </div>
                <div className="w-64 px-4 py-3">
                  <div className="relative h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full ${getStatusColor(task.status)}`}
                      style={{ width: `${task.progress}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {task.progress}% Complete
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
            <span>Completed</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
            <span>In Progress</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
            <span>On Hold</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-gray-300 mr-2"></span>
            <span>Not Started</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GanttChart;
