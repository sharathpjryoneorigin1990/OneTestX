'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { FiBarChart2, FiTrendingUp, FiClock, FiCheckCircle, FiAlertCircle, FiCalendar, FiUsers, FiX, FiActivity, FiCircle, FiSettings, FiExternalLink } from 'react-icons/fi';  
import BurndownChart from './BurndownChart';
import TaskStatusWidget from './TaskStatusWidget';
import TeamWorkload from './TeamWorkload';
import GanttChart from './GanttChart';
import IssuePriorityWidget from './IssuePriorityWidget';
import RecentActivity from './RecentActivity';
import UpcomingDeadlines from './UpcomingDeadlines';
import RiskAssessment from './RiskAssessment';
import ResourceAllocation from './ResourceAllocation';
import PredictiveSprintSuccess from './PredictiveSprintSuccess';
import SmartRiskDetection from './SmartRiskDetection';
import SprintPlanningSuggestions from './SprintPlanningSuggestions';
// import NaturalLanguageQuery from './NaturalLanguageQuery'; // Replaced by FloatingChatLauncher
import SentimentAnalysis from './SentimentAnalysis';
import StandupSummary from './StandupSummary';
import FloatingChatLauncher from './FloatingChatLauncher';
import ProjectSettings from './ProjectSettings';

type Sprint = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  completed: number;
  total: number;
  status: 'upcoming' | 'in-progress' | 'completed';
};

type TeamMember = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  tasksCompleted: number;
};

const ProjectDashboard = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  // Mock data for the dashboard
  const projectStats = {
    testCoverage: 85,
    testPassRate: 92,
    avgTestDuration: '2m 15s',
    totalTests: 1245,
    passedTests: 1145,
    failedTests: 87,
    skippedTests: 13,
  };

  const activeSprint: Sprint = {
    id: 'sprint-1',
    name: 'Sprint 15',
    startDate: '2023-06-01',
    endDate: '2023-06-14',
    completed: 32,
    total: 45,
    status: 'in-progress',
  };

  const teamMembers: TeamMember[] = [
    { id: '1', name: 'Alex Johnson', role: 'QA Lead', avatar: '/avatars/alex.jpg', tasksCompleted: 24 },
    { id: '2', name: 'Jamie Smith', role: 'SDET', avatar: '/avatars/jamie.jpg', tasksCompleted: 18 },
    { id: '3', name: 'Taylor Wilson', role: 'QA Engineer', avatar: '/avatars/taylor.jpg', tasksCompleted: 15 },
  ];

  const recentActivities = [
    { id: 1, type: 'test_run', title: 'Regression Test Suite', status: 'completed', time: '2 hours ago' },
    { id: 2, type: 'bug_fix', title: 'Fixed login test flakiness', status: 'completed', time: '5 hours ago' },
    { id: 3, type: 'new_feature', title: 'Added payment tests', status: 'in_progress', time: '1 day ago' },
  ];

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-dark-900 to-dark-950 text-white"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Project Management Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Track and manage your testing projects</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center gap-2 bg-blue-900/20 border-blue-800/50 hover:bg-blue-800/30 text-white transition-all duration-300"
            onClick={() => setIsSettingsOpen(true)}
          >
            <FiSettings className="w-4 h-4" />
            Settings
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center gap-2 bg-blue-900/20 border-blue-800/50 hover:bg-blue-800/30 text-white transition-all duration-300"
          >
            <FiTrendingUp className="w-4 h-4" />
            Export Report
          </Button>
          <Link href="/jira-dashboard" className="inline-flex">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center gap-2 bg-green-900/20 border-green-800/50 hover:bg-green-800/30 text-white transition-all duration-300"
            >
              <FiExternalLink className="w-4 h-4" />
              Jira Dashboard
            </Button>
          </Link>
        </div>
      </div>
      {/* Section 1: Predictive & Planning Insights */}
      <div>
        <h2 className="text-2xl font-bold pt-6 pb-3 mb-4 border-t border-dark-600 text-gray-100">Predictive & Planning Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="flex flex-col"><PredictiveSprintSuccess /></motion.div>
        <motion.div variants={itemVariants} className="flex flex-col"><SprintPlanningSuggestions /></motion.div>
        </div>
      </div>

      {/* Section 2: Team & Communication Insights */}
      <div>
        <h2 className="text-2xl font-bold pt-6 pb-3 mb-4 border-t border-dark-600 text-gray-100">Team & Communication Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="flex flex-col"><SentimentAnalysis /></motion.div>
        <motion.div variants={itemVariants} className="flex flex-col"><StandupSummary /></motion.div>
        </div>
      </div>

      {/* Section 3: Task Progress & Burndown */}
      <div>
        <h2 className="text-2xl font-bold pt-6 pb-3 mb-4 border-t border-dark-600 text-gray-100">Task Progress & Burndown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="flex flex-col"><TaskStatusWidget /></motion.div>
        <motion.div variants={itemVariants} className="flex flex-col"><BurndownChart /></motion.div>
        </div>
      </div>

      {/* Section 4: Project Timeline (Gantt Chart) */}
      <div>
        <h2 className="text-2xl font-bold pt-6 pb-3 mb-4 border-t border-dark-600 text-gray-100">Project Timeline</h2>
        <div className="grid grid-cols-1 gap-6">
        <motion.div variants={itemVariants} className="flex flex-col"><GanttChart /></motion.div>
        </div>
      </div>
      
      {/* Section 5: Active Sprint Details */}
      <div>
        {/* Note: The Active Sprint card already has a CardTitle, so a separate H2 might be redundant here unless we restyle it. For now, we'll keep its internal title. */}
        {/* <h2 className="text-2xl font-bold pt-6 pb-3 mb-4 border-t border-dark-600 text-gray-100">Active Sprint Details</h2> */}
        <div className="grid grid-cols-1 gap-6">
        <motion.div variants={itemVariants} className="flex flex-col">
          <Card className="h-full bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl hover:shadow-lg hover:scale-[1.02] transform transition-all duration-200 ease-out">
            <CardHeader>
              <CardTitle className="text-lg">Active Sprint</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{activeSprint.name}</span>
                    <span className="text-gray-500">
                      {activeSprint.completed}/{activeSprint.total} tasks
                    </span>
                  </div>
                  <Progress 
                    value={(activeSprint.completed / activeSprint.total) * 100} 
                    max={100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Started: {new Date(activeSprint.startDate).toLocaleDateString()}</span>
                    <span>Due: {new Date(activeSprint.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Completed Tasks</span>
                    <span className="font-medium">{activeSprint.completed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Remaining Tasks</span>
                    <span className="font-medium">{activeSprint.total - activeSprint.completed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Completion</span>
                    <span className="font-medium">
                      {Math.round((activeSprint.completed / activeSprint.total) * 100)}%
                    </span>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  View Sprint Board
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        </div>
      </div>

      {/* Section 6: Team, Deadlines & Resources */}
      <div>
        <h2 className="text-2xl font-bold pt-6 pb-3 mb-4 border-t border-dark-600 text-gray-100">Team, Deadlines & Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="flex flex-col"><TeamWorkload /></motion.div>
        <motion.div variants={itemVariants} className="flex flex-col"><UpcomingDeadlines /></motion.div>
        <motion.div variants={itemVariants} className="flex flex-col"><ResourceAllocation /></motion.div>
        </div>
      </div>

      {/* Section 7: Risks & Issues */}
      <div>
        <h2 className="text-2xl font-bold pt-6 pb-3 mb-4 border-t border-dark-600 text-gray-100">Risks & Issues</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="flex flex-col"><IssuePriorityWidget /></motion.div>
        <motion.div variants={itemVariants} className="flex flex-col"><RiskAssessment /></motion.div>
        <motion.div variants={itemVariants} className="flex flex-col"><SmartRiskDetection /></motion.div>
        </div>
      </div>

      {/* Section 8: Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold pt-6 pb-3 mb-4 border-t border-dark-600 text-gray-100">Recent Activity</h2>
        <div className="grid grid-cols-1 gap-6">
        <motion.div variants={itemVariants} className="flex flex-col"><RecentActivity /></motion.div>
        </div>
      </div>
      </div>
      <FloatingChatLauncher />
      <ProjectSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </motion.div>
  );
};

export default ProjectDashboard;
