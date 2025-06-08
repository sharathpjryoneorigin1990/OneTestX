'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FiZap, FiUser, FiCheckCircle, FiList, FiChevronDown, FiChevronUp } from 'react-icons/fi';

// Type definitions
interface BacklogItem {
  id: string;
  title: string;
  points: number;
  expertise: string;
  priority: string;
  status: string;
  recommended: boolean;
}

interface TeamMember {
  name: string;
  expertise: string;
  velocity: number;
  assigned: number;
}

// Simulated backlog items
const backlog: BacklogItem[] = [
  { id: 'B-101', title: 'Refactor authentication module', points: 8, expertise: 'backend', priority: 'high', status: 'ready', recommended: true },
  { id: 'B-102', title: 'UI redesign for dashboard', points: 5, expertise: 'frontend', priority: 'medium', status: 'ready', recommended: true },
  { id: 'B-103', title: 'Write integration tests', points: 3, expertise: 'qa', priority: 'medium', status: 'ready', recommended: true },
  { id: 'B-104', title: 'Optimize database queries', points: 8, expertise: 'backend', priority: 'high', status: 'ready', recommended: false },
  { id: 'B-105', title: 'Mobile responsiveness fixes', points: 5, expertise: 'frontend', priority: 'low', status: 'ready', recommended: false },
  { id: 'B-106', title: 'Add SSO support', points: 8, expertise: 'backend', priority: 'medium', status: 'ready', recommended: false },
  { id: 'B-107', title: 'Accessibility improvements', points: 3, expertise: 'frontend', priority: 'medium', status: 'ready', recommended: false },
];

// Simulated team capacity and velocity
const team: TeamMember[] = [
  { name: 'Alex Johnson', expertise: 'backend', velocity: 12, assigned: 0 },
  { name: 'Taylor Wilson', expertise: 'frontend', velocity: 10, assigned: 0 },
  { name: 'Jamie Smith', expertise: 'qa', velocity: 8, assigned: 0 },
];

type DraftPlanItem = BacklogItem & { assignee: string };

const SprintPlanningSuggestions = () => {
  const [draft, setDraft] = useState<DraftPlanItem[]>([]);
  const [showPlan, setShowPlan] = useState(false);

  // Simulate AI draft generation
  const generateDraft = () => {
    // Copy team and backlog
    const teamCopy: (TeamMember & { items: BacklogItem[] })[] = team.map(member => ({ ...member, assigned: 0, items: [] }));
    const backlogCopy = backlog.filter(item => item.status === 'ready');

    // Assign recommended items first
    (backlogCopy.filter((item): item is BacklogItem => item.recommended) as BacklogItem[]).forEach(item => {
      // Find team member with matching expertise and available velocity
      const member = teamCopy.find(tm => tm.expertise === item.expertise && tm.assigned + item.points <= tm.velocity);
      if (member) {
        member.items.push(item);
        member.assigned += item.points;
      }
    });

    // Assign remaining items if capacity allows
    (backlogCopy.filter((item): item is BacklogItem => !item.recommended) as BacklogItem[]).forEach(item => {
      const member = teamCopy.find(tm => tm.expertise === item.expertise && tm.assigned + item.points <= tm.velocity);
      if (member) {
        member.items.push(item);
        member.assigned += item.points;
      }
    });

    // Flatten assignments for display
    const plan = teamCopy.flatMap(member =>
      member.items.map(item => ({
        ...item,
        assignee: member.name,
        expertise: member.expertise,
      }))
    );
    setDraft(plan);
    setShowPlan(true);
  };

  return (
    <Card className="h-full bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl hover:shadow-lg hover:scale-[1.02] transform transition-all duration-200 ease-out">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <FiZap className="mr-2 text-yellow-500" />
          Automatic Sprint Planning Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">
          Let AI recommend the best backlog items for your next sprint, matching team capacity and expertise.
        </p>
        <Button variant="primary" onClick={generateDraft} className="mb-4 flex items-center gap-2">
          <FiList className="w-4 h-4" /> Generate Draft Sprint Plan
        </Button>
        {showPlan && (
          <div>
            <div className="flex items-center mb-2">
              <FiCheckCircle className="text-green-500 mr-2" />
              <span className="font-medium">Draft Sprint Plan</span>
              <button className="ml-auto text-xs text-blue-600 hover:underline flex items-center" onClick={() => setShowPlan(false)}>
                <FiChevronUp className="w-3 h-3 mr-1" /> Hide
              </button>
            </div>
            <table className="min-w-full border-collapse text-xs mb-2">
              <thead>
                <tr>
                  <th className="p-2 border-b text-left">ID</th>
                  <th className="p-2 border-b text-left">Title</th>
                  <th className="p-2 border-b text-left">Points</th>
                  <th className="p-2 border-b text-left">Expertise</th>
                  <th className="p-2 border-b text-left">Assignee</th>
                  <th className="p-2 border-b text-left">Priority</th>
                  <th className="p-2 border-b text-left">Recommended</th>
                </tr>
              </thead>
              <tbody>
                {draft.map(item => (
                  <tr key={item.id}>
                    <td className="p-2 border-b">{item.id}</td>
                    <td className="p-2 border-b">{item.title}</td>
                    <td className="p-2 border-b">{item.points}</td>
                    <td className="p-2 border-b">{item.expertise}</td>
                    <td className="p-2 border-b flex items-center"><FiUser className="w-3 h-3 mr-1" />{item.assignee}</td>
                    <td className="p-2 border-b">{item.priority}</td>
                    <td className="p-2 border-b">
                      {item.recommended ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-gray-400">No</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!showPlan && draft.length > 0 && (
          <button className="text-xs text-blue-600 hover:underline flex items-center mt-2" onClick={() => setShowPlan(true)}>
            <FiChevronDown className="w-3 h-3 mr-1" /> Show Draft Plan
          </button>
        )}
      </CardContent>
    </Card>
  );
};

export default SprintPlanningSuggestions;
