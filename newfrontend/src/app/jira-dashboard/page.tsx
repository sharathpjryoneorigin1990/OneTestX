'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { NewNavbar } from '@/components/layout/NewNavbar';
import JiraIssuesList from '@/components/jira/JiraIssuesList';
import CreateJiraIssue from '@/components/jira/CreateJiraIssue';
import { Toaster, toast } from 'react-hot-toast';
import { 
  FiPlus, 
  FiFilter, 
  FiSearch, 
  FiRefreshCw, 
  FiChevronDown, 
  FiChevronUp 
} from 'react-icons/fi';
import { reloadJiraSettings, getProject } from '@/lib/client/jiraService';

interface ProjectDetails {
  id: string;
  key: string;
  name: string;
  avatarUrls: {
    '48x48': string;
  };
  projectTypeKey: string;
  simplified: boolean;
  style: string;
  isPrivate: boolean;
  properties: Record<string, unknown>;
  entityId: string;
  uuid: string;
  expand: string;
}

export default function JiraDashboardPage() {
  const [projectKey, setProjectKey] = useState<string>('');
  const [submittedKey, setSubmittedKey] = useState<string>('');
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'board' | 'list' | 'timeline'>('board');
  const [showProjectDropdown, setShowProjectDropdown] = useState<boolean>(false);
  const [recentProjects, setRecentProjects] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // Load recent projects from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('jiraRecentProjects');
    if (savedProjects) {
      setRecentProjects(JSON.parse(savedProjects));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectKey.trim()) return;
    
    const key = projectKey.trim();
    setSubmittedKey(key);
    setIsLoading(true);
    
    try {
      // Save to recent projects
      const updatedProjects = [
        key,
        ...recentProjects.filter(p => p !== key).slice(0, 4) // Keep only unique and limit to 5
      ];
      setRecentProjects(updatedProjects);
      localStorage.setItem('jiraRecentProjects', JSON.stringify(updatedProjects));
      
      // Fetch project details
      const response = await fetch(`/api/jira/project/${key}`);
      if (!response.ok) throw new Error('Failed to fetch project details');
      const data = await response.json();
      setProjectDetails(data);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project. Please check the project key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Starting refresh of Jira data...');
      
      // First reload Jira settings
      try {
        console.log('Reloading Jira settings...');
        const settingsReloaded = await reloadJiraSettings();
        if (!settingsReloaded) {
          throw new Error('Failed to reload Jira settings');
        }
        console.log('Jira settings reloaded successfully');
      } catch (settingsError) {
        console.error('Error reloading Jira settings:', settingsError);
        throw new Error(
          settingsError instanceof Error 
            ? settingsError.message 
            : 'Failed to reload Jira settings. Please check your Jira credentials and try again.'
        );
      }
      
      // Refresh project details if we have a project loaded
      if (projectDetails) {
        const projectData = await getProject(projectDetails.key);
        setProjectDetails(projectData);
      }
      
      // Trigger a refresh of the issues list
      setRefreshTrigger(prev => prev + 1);
      
      toast.success('Jira settings and data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing Jira data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to refresh Jira data');
    } finally {
      setIsLoading(false);
    }
  }, [projectDetails]);

  const handleProjectSelect = (key: string) => {
    setProjectKey(key);
    setShowProjectDropdown(false);
    // Trigger form submission
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(fakeEvent);
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-gray-800">
      <Toaster position="top-right" />
      <NewNavbar />
      
      {/* Jira Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-800">Jira Software</h1>
            <div className="relative">
              <button 
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm font-medium"
              >
                <span>Projects</span>
                {showProjectDropdown ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
              </button>
              
              {showProjectDropdown && (
                <div className="absolute z-10 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200">
                  <div className="p-2 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-500 px-2 py-1">RECENT PROJECTS</p>
                    {recentProjects.length > 0 ? (
                      recentProjects.map((key) => (
                        <button
                          key={key}
                          onClick={() => handleProjectSelect(key)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center"
                        >
                          <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                          {key}
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm text-gray-500">No recent projects</p>
                    )}
                  </div>
                  <div className="p-2">
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center text-blue-600">
                      <FiPlus size={16} className="mr-2" />
                      Create project
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Jira"
                className="pl-10 pr-4 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              className={`p-1.5 rounded-full hover:bg-gray-100 ${isLoading ? 'animate-spin' : ''}`}
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh Jira data and settings"
            >
              <FiRefreshCw className="text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-6">
        {!submittedKey ? (
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to Jira</h2>
            <p className="text-gray-600 mb-6">Enter a project key to get started or select from your recent projects</p>
            
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={projectKey}
                  onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                  placeholder="Enter project key (e.g., PROJ)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!projectKey.trim() || isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Loading...' : 'View Project'}
                </button>
              </div>
            </form>
            
            {recentProjects.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-500 mb-3">RECENT PROJECTS</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {recentProjects.map((key) => (
                    <button
                      key={key}
                      onClick={() => handleProjectSelect(key)}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Project Header */}
            {projectDetails && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center space-x-4">
                  {projectDetails.avatarUrls && (
                    <img 
                      src={projectDetails.avatarUrls['48x48']} 
                      alt={projectDetails.name}
                      className="w-12 h-12 rounded"
                    />
                  )}
                  <div>
                    <h1 className="text-2xl font-semibold">{projectDetails.name}</h1>
                    <p className="text-sm text-gray-500">Project Key: {projectDetails.key}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* View Tabs */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveView('board')}
                    className={`py-4 px-6 text-sm font-medium ${activeView === 'board' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Board
                  </button>
                  <button
                    onClick={() => setActiveView('list')}
                    className={`py-4 px-6 text-sm font-medium ${activeView === 'list' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setActiveView('timeline')}
                    className={`py-4 px-6 text-sm font-medium ${activeView === 'timeline' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Timeline
                  </button>
                </nav>
              </div>
              
              {/* Toolbar */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 flex items-center">
                    <FiPlus size={16} className="mr-1" />
                    Create
                  </button>
                  <button className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded hover:bg-gray-50 flex items-center">
                    <FiFilter size={16} className="mr-1" />
                    Filter
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium">all issues</span>
                </div>
              </div>
              
              {/* Issues List */}
              <div className="p-4">
                <JiraIssuesList 
                  key={refreshTrigger} 
                  projectKey={submittedKey} 
                  viewMode={activeView}
                  searchQuery={searchQuery}
                />
              </div>
            </div>
            
            {/* Create Issue Button (Floating) */}
            <div className="fixed bottom-8 right-8">
              <button className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <FiPlus size={24} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
