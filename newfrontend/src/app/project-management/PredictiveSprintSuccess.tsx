'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { 
  FiTrendingUp, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiBriefcase, 
  FiClock,
  FiBarChart2,
  FiActivity,
  FiInfo,
  FiX
} from 'react-icons/fi';
import { useState } from 'react';

type SprintPrediction = {
  sprintId: string;
  sprintName: string;
  successProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  completionTrend: 'improving' | 'stable' | 'declining';
  predictedCompletionDate?: Date;
  keyFactors: {
    factor: string;
    impact: number; // -1 to 1, negative means reducing success probability
    description: string;
  }[];
  historicalVelocity: {
    sprint: string;
    planned: number;
    completed: number;
  }[];
};

// Helper function to get risk color
const getRiskColor = (probability: number) => {
  if (probability >= 80) return 'bg-green-500';
  if (probability >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Helper function to get risk text color
const getRiskTextColor = (probability: number) => {
  if (probability >= 80) return 'text-green-600 dark:text-green-400';
  if (probability >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

// Helper function to get risk text
const getRiskText = (probability: number) => {
  if (probability >= 80) return 'On Track';
  if (probability >= 60) return 'At Risk';
  return 'Critical';
};

// Helper function to get risk icon
const getRiskIcon = (probability: number) => {
  if (probability >= 80) return <FiCheckCircle className="w-4 h-4 text-green-500" />;
  if (probability >= 60) return <FiAlertCircle className="w-4 h-4 text-yellow-500" />;
  return <FiAlertCircle className="w-4 h-4 text-red-500" />;
};

const PredictiveSprintSuccess = () => {
  // Toggle to show/hide the explanation modal
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Mock AI prediction data
  const prediction: SprintPrediction = {
    sprintId: 'sprint-15',
    sprintName: 'Sprint 15',
    successProbability: 72,
    riskLevel: 'medium',
    completionTrend: 'improving',
    predictedCompletionDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    keyFactors: [
      { 
        factor: 'Team Velocity', 
        impact: 0.3, 
        description: 'Team is consistently completing 92% of planned stories'
      },
      { 
        factor: 'Task Complexity', 
        impact: -0.2, 
        description: '3 high-complexity tasks added mid-sprint'
      },
      { 
        factor: 'Dependencies', 
        impact: -0.15, 
        description: 'External API integration dependency identified'
      },
      { 
        factor: 'Historical Performance', 
        impact: 0.25, 
        description: 'Previous 3 sprints show improving completion rate'
      },
    ],
    historicalVelocity: [
      { sprint: 'Sprint 12', planned: 45, completed: 36 },
      { sprint: 'Sprint 13', planned: 42, completed: 35 },
      { sprint: 'Sprint 14', planned: 40, completed: 37 },
    ]
  };

  // Calculate average success rate from historical data
  const historicalSuccessRate = prediction.historicalVelocity.reduce((acc, sprint) => {
    return acc + (sprint.completed / sprint.planned * 100);
  }, 0) / prediction.historicalVelocity.length;

  // Sort factors by absolute impact for visualization
  const sortedFactors = [...prediction.keyFactors].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  return (
    <Card className="relative h-full bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl hover:shadow-lg hover:scale-[1.02] transform transition-all duration-200 ease-out">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">
          <div className="flex items-center">
            <FiBarChart2 className="mr-2" />
            <span>AI Sprint Prediction</span>
          </div>
        </CardTitle>
        <div className="flex items-center">
          <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-1 rounded-full">
            AI Powered
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Main Prediction Section */}
          <div>
            <div className="mb-6 text-center">
              <div className="flex items-center justify-center">
                <div className="text-4xl font-bold mr-2">{prediction.successProbability}%</div>
                <button 
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FiInfo className="w-5 h-5" />
                </button>
              </div>
              <div className={`text-sm font-medium mt-2 ${getRiskTextColor(prediction.successProbability)}`}>
                {getRiskText(prediction.successProbability)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Sprint Completion Probability
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">Sprint Success Probability</span>
                <span>{prediction.successProbability}%</span>
              </div>
              <div className="h-3 relative w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div 
                  className={`h-full ${getRiskColor(prediction.successProbability)}`}
                  style={{ width: `${prediction.successProbability}%` }}
                ></div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center">
                  <FiClock className="w-4 h-4 mr-1" />
                  <span className="font-medium">Predicted Completion</span>
                </div>
                <span>
                  {prediction.predictedCompletionDate?.toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <FiActivity className="w-4 h-4 mr-1" />
                  <span className="font-medium">Trend</span>
                </div>
                <div className="flex items-center">
                  {prediction.completionTrend === 'improving' && (
                    <>
                      <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-600 dark:text-green-400">Improving</span>
                    </>
                  )}
                  {prediction.completionTrend === 'stable' && (
                    <span className="text-blue-600 dark:text-blue-400">Stable</span>
                  )}
                  {prediction.completionTrend === 'declining' && (
                    <span className="text-red-600 dark:text-red-400">Declining</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Key Factors Section */}
          <div>
            <h4 className="text-sm font-medium mb-3">Key Influencing Factors</h4>
            <div className="space-y-3">
              {sortedFactors.map((factor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-sm font-medium">{factor.factor}</span>
                      <span className={`ml-2 text-xs ${factor.impact > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {factor.impact > 0 ? '+' : ''}{Math.round(factor.impact * 100)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {factor.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Historical Comparison */}
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Historical Sprint Performance</h4>
          <div className="space-y-3">
            {prediction.historicalVelocity.map((sprint, index) => (
              <div key={index} className="flex flex-col">
                <div className="flex justify-between text-xs mb-1">
                  <span>{sprint.sprint}</span>
                  <span>{Math.round(sprint.completed / sprint.planned * 100)}%</span>
                </div>
                <Progress 
                  value={sprint.completed} 
                  max={sprint.planned}
                  className="h-1.5"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-right text-gray-500 dark:text-gray-400">
            Average: {Math.round(historicalSuccessRate)}% completion rate
          </div>
        </div>

        {/* Explanation Modal */}
        {showExplanation && (
          <div className="absolute inset-0 bg-white dark:bg-gray-900 z-10 p-4 overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">How This Prediction Works</h3>
              <button onClick={() => setShowExplanation(false)} className="text-gray-500">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <p>
                This AI-powered prediction analyzes historical sprint data to forecast the likelihood of completing all planned work in the current sprint.
              </p>
              <h4 className="font-medium">Factors Considered:</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>Historical team velocity over previous sprints</li>
                <li>Current sprint complexity compared to previous sprints</li>
                <li>Number and complexity of blockers encountered</li>
                <li>Story point spillover patterns from previous sprints</li>
                <li>Mid-sprint scope changes and their impact</li>
                <li>Team capacity fluctuations</li>
              </ul>
              <p>
                The model is trained on your team's specific performance history, improving its accuracy over time as it learns from your team's patterns.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg mt-4">
                <p className="text-blue-800 dark:text-blue-300 font-medium">How to use this insight:</p>
                <ul className="text-blue-700 dark:text-blue-400 mt-2 list-disc pl-5 space-y-1">
                  <li>Predictions below 60% suggest considering scope reduction</li>
                  <li>Review "Key Influencing Factors" to address specific issues</li>
                  <li>Monitor trend line to see if interventions are working</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default PredictiveSprintSuccess;
