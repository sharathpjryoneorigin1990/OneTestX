'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { FiUsers, FiClock, FiDollarSign, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

type ResourceType = 'developer' | 'designer' | 'qa' | 'devops' | 'manager' | 'other';

type ResourceAllocationItem = {
  id: string;
  name: string;
  role: ResourceType;
  project: string;
  allocation: number; // percentage of time allocated
  utilization: number; // actual percentage used
  startDate: Date;
  endDate: Date;
  status: 'active' | 'planned' | 'completed';
};

type ProjectResourceSummary = {
  project: string;
  allocation: number;
  color: string;
};

const ResourceAllocation = () => {
  // Sample resource allocation data
  const resources: ResourceAllocationItem[] = [
    {
      id: '1',
      name: 'Alex Johnson',
      role: 'developer',
      project: 'Dashboard Redesign',
      allocation: 80,
      utilization: 75,
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-07-15'),
      status: 'active'
    },
    {
      id: '2',
      name: 'Taylor Wilson',
      role: 'designer',
      project: 'Dashboard Redesign',
      allocation: 50,
      utilization: 60,
      startDate: new Date('2025-05-15'),
      endDate: new Date('2025-06-30'),
      status: 'active'
    },
    {
      id: '3',
      name: 'Jamie Smith',
      role: 'qa',
      project: 'Dashboard Redesign',
      allocation: 30,
      utilization: 25,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-07-15'),
      status: 'active'
    },
    {
      id: '4',
      name: 'Alex Johnson',
      role: 'developer',
      project: 'API Integration',
      allocation: 20,
      utilization: 30,
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-07-15'),
      status: 'active'
    },
    {
      id: '5',
      name: 'Sam Wilson',
      role: 'devops',
      project: 'Infrastructure Upgrade',
      allocation: 100,
      utilization: 90,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-06-30'),
      status: 'active'
    },
    {
      id: '6',
      name: 'Robin Lee',
      role: 'developer',
      project: 'Mobile App',
      allocation: 100,
      utilization: 100,
      startDate: new Date('2025-06-15'),
      endDate: new Date('2025-08-30'),
      status: 'planned'
    },
  ];

  // Calculate project allocation summary for pie chart
  const projectSummary: ProjectResourceSummary[] = Object.entries(
    resources.reduce((acc, resource) => {
      if (!acc[resource.project]) {
        acc[resource.project] = 0;
      }
      // Add weighted allocation (allocation percentage * 1 person)
      acc[resource.project] += resource.allocation / 100;
      return acc;
    }, {} as Record<string, number>)
  ).map(([project, allocation], index) => ({
    project,
    allocation,
    color: [
      '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
      '#8884D8', '#82CA9D', '#A4DE6C', '#D0ED57'
    ][index % 8]
  }));

  // Calculate resource utilization metrics
  const utilizationMetrics = {
    overallocated: resources.filter(r => r.utilization > r.allocation).length,
    underutilized: resources.filter(r => r.utilization < r.allocation * 0.8).length,
    optimal: resources.filter(r => r.utilization <= r.allocation && r.utilization >= r.allocation * 0.8).length,
  };

  // Role distribution
  const roleDistribution = resources.reduce((acc, resource) => {
    if (!acc[resource.role]) {
      acc[resource.role] = 0;
    }
    acc[resource.role] += resource.allocation / 100;
    return acc;
  }, {} as Record<ResourceType, number>);

  // Format role name for display
  const formatRoleName = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Get status indicator
  const getStatusIndicator = (resource: ResourceAllocationItem) => {
    if (resource.utilization > resource.allocation) {
      return <FiAlertCircle className="w-4 h-4 text-red-500" title="Overallocated" />;
    } else if (resource.utilization < resource.allocation * 0.8) {
      return <FiAlertCircle className="w-4 h-4 text-yellow-500" title="Underutilized" />;
    } else {
      return <FiCheckCircle className="w-4 h-4 text-green-500" title="Optimal" />;
    }
  };

  return (
    <Card className="h-full bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl hover:shadow-lg hover:scale-[1.02] transform transition-all duration-200 ease-out">
      <CardHeader>
        <CardTitle className="text-lg">Resource Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Allocation Chart */}
          <div>
            <h4 className="text-sm font-medium mb-3">Project Allocation</h4>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectSummary}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="allocation"
                    nameKey="project"
                  >
                    {projectSummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)} FTE`, 'Allocation']}
                    labelFormatter={(label) => `Project: ${label}`}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Resource Metrics */}
          <div>
            <h4 className="text-sm font-medium mb-3">Resource Utilization</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-sm">Overallocated</span>
                </div>
                <span className="font-medium">{utilizationMetrics.overallocated}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <span className="text-sm">Underutilized</span>
                </div>
                <span className="font-medium">{utilizationMetrics.underutilized}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm">Optimal</span>
                </div>
                <span className="font-medium">{utilizationMetrics.optimal}</span>
              </div>
            </div>

            <h4 className="text-sm font-medium mt-6 mb-3">Role Distribution</h4>
            <div className="space-y-2">
              {Object.entries(roleDistribution).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm">{formatRoleName(role)}</span>
                  <span className="font-medium">{count.toFixed(1)} FTE</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resource List */}
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Team Members</h4>
          <div className="space-y-3">
            {resources.filter(r => r.status === 'active').map((resource) => (
              <div key={resource.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <div className="flex items-center">
                    <span className="font-medium text-sm">{resource.name}</span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      {formatRoleName(resource.role)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {resource.project}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-24">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Utilization</span>
                      <span>{resource.utilization}%</span>
                    </div>
                    <Progress 
                      value={resource.utilization} 
                      max={100} 
                      className="h-1.5"
                      style={{ 
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        color: resource.utilization > resource.allocation 
                          ? 'rgb(239, 68, 68)' 
                          : resource.utilization < resource.allocation * 0.8
                            ? 'rgb(234, 179, 8)'
                            : 'rgb(34, 197, 94)'
                      }}
                    />
                  </div>
                  <div className="flex items-center">
                    {getStatusIndicator(resource)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              View all resources
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceAllocation;
