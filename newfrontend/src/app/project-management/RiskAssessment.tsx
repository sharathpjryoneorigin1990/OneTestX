'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

type RiskLevel = 'high' | 'medium' | 'low' | 'mitigated';

type RiskItem = {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  probability: 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'mitigated' | 'accepted';
  dueDate?: Date;
  owner?: string;
  mitigationPlan?: string;
};

const RiskAssessment = () => {
  // Sample risk data
  const risks: RiskItem[] = [
    {
      id: '1',
      title: 'Third-party API Downtime',
      description: 'Dependency on external payment gateway with no SLA guarantees',
      impact: 'high',
      probability: 'medium',
      status: 'open',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      owner: 'Alex Johnson',
      mitigationPlan: 'Implement circuit breaker pattern and fallback payment method'
    },
    {
      id: '2',
      title: 'Data Migration Failure',
      description: 'Potential data loss during legacy system migration',
      impact: 'high',
      probability: 'low',
      status: 'in-progress',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      owner: 'Taylor Wilson',
      mitigationPlan: 'Perform incremental migration with rollback plan'
    },
    {
      id: '3',
      title: 'Performance Bottlenecks',
      description: 'Slow response times under peak load conditions',
      impact: 'medium',
      probability: 'high',
      status: 'open',
      owner: 'Sam Wilson',
      mitigationPlan: 'Load testing and performance optimization'
    },
    {
      id: '4',
      title: 'Security Vulnerabilities',
      description: 'Potential SQL injection in legacy code',
      impact: 'high',
      probability: 'low',
      status: 'mitigated',
      owner: 'Jamie Smith',
      mitigationPlan: 'Implemented parameterized queries and security scanning'
    },
    {
      id: '5',
      title: 'Resource Constraints',
      description: 'Limited development resources for critical features',
      impact: 'medium',
      probability: 'medium',
      status: 'accepted',
      owner: 'Project Manager',
      mitigationPlan: 'Prioritized backlog and resource allocation'
    },
  ];

  // Calculate risk level based on impact and probability
  const getRiskLevel = (risk: RiskItem): RiskLevel => {
    if (risk.status === 'mitigated' || risk.status === 'accepted') return 'mitigated';
    
    const impactScore = { high: 3, medium: 2, low: 1 }[risk.impact];
    const probabilityScore = { high: 3, medium: 2, low: 1 }[risk.probability];
    const riskScore = impactScore * probabilityScore;
    
    if (riskScore >= 6) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  };

  // Get risk level color and icon
  const getRiskLevelStyles = (level: RiskLevel) => {
    switch (level) {
      case 'high':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          text: 'text-red-800 dark:text-red-300',
          icon: <FiAlertTriangle className="w-4 h-4 text-red-500" />,
          label: 'High Risk'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          text: 'text-yellow-800 dark:text-yellow-300',
          icon: <FiAlertTriangle className="w-4 h-4 text-yellow-500" />,
          label: 'Medium Risk'
        };
      case 'low':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-800 dark:text-blue-300',
          icon: <FiAlertTriangle className="w-4 h-4 text-blue-500" />,
          label: 'Low Risk'
        };
      case 'mitigated':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-800 dark:text-green-300',
          icon: <FiCheckCircle className="w-4 h-4 text-green-500" />,
          label: 'Mitigated'
        };
    }
  };

  // Get status styles
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'mitigated':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'accepted':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Get trend icon based on risk level changes
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <FiTrendingUp className="w-4 h-4 text-red-500" />;
      case 'down':
        return <FiTrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <FiClock className="w-4 h-4 text-yellow-500" />;
    }
  };

  // Calculate risk distribution for the summary
  const riskDistribution = risks.reduce((acc, risk) => {
    const level = getRiskLevel(risk);
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<RiskLevel, number>);

  return (
    <Card className="h-full bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl hover:shadow-lg hover:scale-[1.02] transform transition-all duration-200 ease-out">
      <CardHeader>
        <CardTitle className="text-lg">Risk Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Risk Summary */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {Object.entries({
            high: 'High',
            medium: 'Medium',
            low: 'Low',
            mitigated: 'Mitigated'
          }).map(([key, label]) => {
            const styles = getRiskLevelStyles(key as RiskLevel);
            return (
              <div key={key} className={`${styles.bg} ${styles.text} rounded-lg p-3 text-center`}>
                <div className="flex items-center justify-center mb-1">
                  {styles.icon}
                </div>
                <div className="text-sm font-medium">{riskDistribution[key as RiskLevel] || 0}</div>
                <div className="text-xs">{label}</div>
              </div>
            );
          })}
        </div>

        {/* Risk List */}
        <div className="space-y-4">
          {risks.map((risk) => {
            const riskLevel = getRiskLevel(risk);
            const styles = getRiskLevelStyles(riskLevel);
            const statusStyles = getStatusStyles(risk.status);
            
            return (
              <div key={risk.id} className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h4 className="font-medium text-sm">{risk.title}</h4>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${styles.bg} ${styles.text}`}>
                        {styles.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{risk.description}</p>
                    {risk.owner && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Owner: {risk.owner}</span>
                        {risk.dueDate && (
                          <span className="ml-3">
                            Due: {risk.dueDate.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded-full ${statusStyles}`}>
                    {risk.status.replace('-', ' ')}
                  </div>
                </div>
                {risk.mitigationPlan && (
                  <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                    <div className="font-medium text-gray-700 dark:text-gray-300">Mitigation:</div>
                    <div className="text-gray-600 dark:text-gray-400">{risk.mitigationPlan}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 flex justify-end">
          <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            View all risks
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskAssessment;
