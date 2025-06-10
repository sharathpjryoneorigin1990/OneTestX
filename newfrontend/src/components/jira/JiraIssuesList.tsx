'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import JiraIssueDetails from './JiraIssueDetails';

// Helper function to safely extract text from JiraIssueSummary
const getSummaryText = (content: JiraIssueSummary): string => {
  try {
    if (!content) return 'No summary';
    
    // Handle string content
    if (typeof content === 'string') {
      return content || 'No summary';
    }
    
    // Handle object content
    if (typeof content === 'object') {
      // Check for text property first
      if ('text' in content && content.text) {
        return String(content.text) || 'No summary';
      }
      
      // Then check for content property
      if ('content' in content && content.content) {
        return getSummaryText(content.content as any);
      }
      
      // For any other object, try to stringify it
      try {
        const str = JSON.stringify(content);
        return str !== '{}' ? str : 'No summary';
      } catch (e) {
        return 'No summary';
      }
    }
    
    // Fallback for any other type
    return String(content) || 'No summary';
  } catch (error) {
    console.error('Error getting summary text:', error);
    return 'No summary';
  }
};

// Basic type definition for a Jira issue based on our API response
// You can expand this with more fields as needed.
interface RichTextContent {
  type: string;
  content?: Array<{
    text?: string;
    content?: any;
    [key: string]: any;
  }>;
  [key: string]: any;
}

// JiraIssueSummary represents the possible types for a Jira issue summary from the API
type JiraIssueSummary = 
  | string 
  | { text?: string; content?: any }
  | RichTextContent 
  | null 
  | undefined;

// Raw issue type from the API
interface RawJiraIssue {
  key: string;
  fields: {
    summary: JiraIssueSummary;
    issuetype: {
      name: string;
      iconUrl: string;
    };
    status: {
      name: string;
    };
    priority?: {
      name: string;
      iconUrl: string;
    };
    assignee?: {
      displayName: string;
      avatarUrls: { '48x48': string };
    };
    updated: string;
  };
  [key: string]: any; // For other fields
}

// Processed issue type with summary as string
interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    issuetype: {
      name: string;
      iconUrl: string;
    };
    status: {
      name: string;
    };
    priority?: {
      name: string;
      iconUrl: string;
    };
    assignee?: {
      displayName: string;
      avatarUrls: { '48x48': string };
    };
    updated: string;
  };
  [key: string]: any; // For other fields
}

interface JiraIssuesListProps {
  projectKey: string; // e.g., 'PROJ'
  maxResults?: number;
  viewMode?: 'board' | 'list' | 'timeline';
  searchQuery?: string;
}

const JiraIssuesList: React.FC<JiraIssuesListProps> = ({ projectKey, maxResults = 20, viewMode, searchQuery }) => {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssueKey, setSelectedIssueKey] = useState<string | null>(null);

  // Process raw issues from the API to ensure they match our JiraIssue type
  const processIssues = (rawIssues: any[]): JiraIssue[] => {
    if (!Array.isArray(rawIssues)) return [];
    
    return rawIssues.map(issue => ({
      ...issue,
      fields: {
        ...issue.fields,
        summary: getSummaryText(issue.fields?.summary)
      }
    }));
  };

  useEffect(() => {
    if (!projectKey) {
      setIsLoading(false);
      setError('A Jira project key must be provided.');
      return;
    }

    const fetchIssues = async () => {
      if (!projectKey) return;
      
      setIsLoading(true);
      setError(null);

      try {
        // Build JQL query
        let jql = `project = "${projectKey}"`;
        if (searchQuery) {
          jql += ` AND (summary ~ "${searchQuery}" OR description ~ "${searchQuery}" OR text ~ "${searchQuery}")`;
        }
        jql += ' ORDER BY updated DESC';

        // Build query parameters
        const params = new URLSearchParams({
          jql: jql,
          maxResults: maxResults.toString()
        });

        console.log('Fetching issues with JQL:', jql);
        const response = await fetch(`/api/jira/issues?${params}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch issues: ${response.statusText}`);
        }
        
        const data = await response.json();
        const processedIssues = processIssues(data.issues || []);
        setIssues(processedIssues);
      } catch (err) {
        console.error('Error fetching Jira issues:', err);
        setError(err instanceof Error ? err.message : 'Failed to load issues');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssues();
  }, [projectKey, maxResults, searchQuery]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading issues...</span>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">Error loading issues: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Render empty state
  if (issues.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No issues</h3>
        <p className="mt-1 text-sm text-gray-500">
          {searchQuery
            ? 'No issues match your search.'
            : `No issues found for project ${projectKey}.`}
        </p>
      </div>
    );
  }

  const handleIssueClick = (issueKey: string) => {
    setSelectedIssueKey(issueKey);
  };

  const handleCloseDetails = () => {
    setSelectedIssueKey(null);
  };

  const handleIssueUpdate = () => {
    // Refetch the issues list to reflect any changes
    fetchIssues();
  };

  const fetchIssues = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Construct the JQL query and encode it for the URL
      const jql = `project = "${projectKey}" ORDER BY updated DESC`;
      const encodedJql = encodeURIComponent(jql);
      const response = await fetch(`/api/jira/issues?jql=${encodedJql}&maxResults=${maxResults}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch issues from Jira API.');
      }

      const data = await response.json();
      setIssues(data.issues || []); // The issues are in the 'issues' property of the response
    } catch (err: any) {
      console.error('Error fetching Jira issues:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderBoardView = () => (
    <div className="space-y-4">
      {issues.map((issue) => (
        <div key={issue.key} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              {/* Issue Type Icon */}
              {issue.fields.issuetype?.iconUrl && (
                <img 
                  src={issue.fields.issuetype.iconUrl} 
                  alt={issue.fields.issuetype.name}
                  className="h-4 w-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              {/* Issue Key */}
              <span className="text-sm font-mono text-gray-600">{issue.key}</span>
              {/* Status */}
              {issue.fields.status && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {issue.fields.status.name}
                </span>
              )}
            </div>
            
            {/* Priority */}
            {issue.fields.priority?.iconUrl && (
              <img 
                src={issue.fields.priority.iconUrl} 
                alt={issue.fields.priority.name}
                className="h-4 w-4"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>
          
          {/* Summary */}
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            <JiraIssueDetails 
              issueKey={issue.key}
              onClose={() => {}}
              onUpdate={() => {}}
            >
              <button className="text-left hover:text-blue-600 hover:underline">
                {issue.fields.summary}
              </button>
            </JiraIssueDetails>
          </h3>
          
          {/* Assignee and Updated */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <div>
              {issue.fields.assignee ? (
                <div className="flex items-center">
                  {issue.fields.assignee.avatarUrls?.['48x48'] && (
                    <img 
                      src={issue.fields.assignee.avatarUrls['48x48']} 
                      alt={issue.fields.assignee.displayName}
                      className="h-5 w-5 rounded-full mr-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <span>{issue.fields.assignee.displayName}</span>
                </div>
              ) : (
                <span>Unassigned</span>
              )}
            </div>
            <span>Updated: {new Date(issue.fields.updated).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
              Key
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Summary
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Status
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Assignee
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Updated
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {issues.map((issue) => (
            <tr key={issue.key} className="hover:bg-gray-50">
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                {issue.key}
              </td>
              <td className="whitespace-normal px-3 py-4 text-sm text-gray-900">
                <JiraIssueDetails 
                  issueKey={issue.key}
                  onClose={() => {}}
                  onUpdate={() => {}}
                >
                  <button className="text-left hover:text-blue-600 hover:underline">
                    {issue.fields.summary}
                  </button>
                </JiraIssueDetails>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {issue.fields.status?.name}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {issue.fields.assignee?.displayName || 'Unassigned'}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {new Date(issue.fields.updated).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTimelineView = () => (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {issues.map((issue, issueIdx) => (
          <li key={issue.key}>
            <div className="relative pb-8">
              {issueIdx !== issues.length - 1 ? (
                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                    <span className="text-white text-xs font-medium">
                      {issue.fields.issuetype?.name?.charAt(0) || '?'}
                    </span>
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500">
                      <JiraIssueDetails 
                        issueKey={issue.key}
                        onClose={() => {}}
                        onUpdate={() => {}}
                      >
                        <button className="font-medium text-gray-900 hover:text-blue-600 hover:underline">
                          {issue.key}
                        </button>
                      </JiraIssueDetails>
                      <span> - {issue.fields.summary}</span>
                    </p>
                    <div className="mt-1 text-xs text-gray-500">
                      <span>Status: </span>
                      <span className="font-medium">{issue.fields.status?.name || 'Unknown'}</span>
                      {issue.fields.assignee && (
                        <>
                          <span className="mx-1">•</span>
                          <span>Assigned to {issue.fields.assignee.displayName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <time dateTime={new Date(issue.fields.updated).toISOString()}>
                      {new Date(issue.fields.updated).toLocaleDateString()}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  // Return the appropriate view based on viewMode
  switch (viewMode) {
    case 'list':
      return renderListView();
    case 'timeline':
      return renderTimelineView();
    case 'board':
    default:
      return renderBoardView();
  }
};

export default JiraIssuesList;
