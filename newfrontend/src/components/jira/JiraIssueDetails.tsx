'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface JiraIssueDetailsProps {
  issueKey: string;
  onClose?: () => void;
  onUpdate?: () => void;
  children?: React.ReactNode;
}

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    description: string;
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
    created: string;
    [key: string]: any; // For other fields
  };
}

const JiraIssueDetails: React.FC<JiraIssueDetailsProps> = ({ issueKey, onClose, onUpdate, children }) => {
  const [issue, setIssue] = useState<JiraIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editForm, setEditForm] = useState({
    summary: '',
    description: '',
  });

  useEffect(() => {
    const fetchIssue = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/jira/issue/${issueKey}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch issue ${issueKey}`);
        }
        
        const data = await response.json();
        setIssue(data);
        setEditForm({
          summary: data.fields.summary || '',
          description: data.fields.description || '',
        });
      } catch (err: any) {
        console.error('Error fetching issue details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    const handleClose = () => {
      if (onClose) onClose();
      setIsEditing(false);
    };

    const handleUpdate = () => {
      if (onUpdate) onUpdate();
      fetchIssue();
    };

    fetchIssue();
  }, [issueKey, onClose, onUpdate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/jira/issue/${issueKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issueUpdateData: {
            fields: {
              summary: editForm.summary,
              description: editForm.description,
            },
          },
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update issue');
      }
      
      // Update local state with new values
      if (issue) {
        setIssue({
          ...issue,
          fields: {
            ...issue.fields,
            summary: editForm.summary,
            description: editForm.description,
          },
        });
      }
      
      toast.success('Issue updated successfully');
      setIsEditing(false);
      if (onUpdate) onUpdate(); // Notify parent to refresh issues list
    } catch (err: any) {
      console.error('Error updating issue:', err);
      toast.error(err.message || 'Failed to update issue');
    } finally {
      setIsSaving(false);
    }
  };

  // If children are provided, render them directly without the modal
  if (children) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-dark-800 p-6 rounded-lg shadow-xl">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-dark-800 p-6 rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Error</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-red-500">{error}</div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return null;
  }

  // If children are provided, render them directly without the modal
  if (children) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {issue.fields.issuetype && (
              <img src={issue.fields.issuetype.iconUrl} alt={issue.fields.issuetype.name} className="w-6 h-6" />
            )}
            <h2 className="text-xl font-bold">{issue.key}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Summary</label>
              <input
                type="text"
                name="summary"
                value={editForm.summary}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-600 rounded hover:bg-dark-700"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-70"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-2xl font-medium mb-2">{issue.fields.summary}</h3>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs">
                  {issue.fields.status?.name || 'No Status'}
                </span>
                {issue.fields.priority && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-xs">
                    <img src={issue.fields.priority.iconUrl} alt="" className="w-3 h-3" />
                    {issue.fields.priority.name}
                  </span>
                )}
                <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                  {issue.fields.issuetype?.name || 'Unknown Type'}
                </span>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-sm font-medium uppercase text-gray-400 mb-2">Description</h4>
              <div className="bg-dark-700 p-3 rounded whitespace-pre-wrap">
                {issue.fields.description || 'No description provided.'}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="text-sm font-medium uppercase text-gray-400 mb-1">Assignee</h4>
                <div className="flex items-center gap-2">
                  {issue.fields.assignee ? (
                    <>
                      <img 
                        src={issue.fields.assignee.avatarUrls['48x48']} 
                        alt={issue.fields.assignee.displayName} 
                        className="w-6 h-6 rounded-full" 
                      />
                      <span>{issue.fields.assignee.displayName}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">Unassigned</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium uppercase text-gray-400 mb-1">Created</h4>
                <div>{new Date(issue.fields.created).toLocaleString()}</div>
              </div>
              <div>
                <h4 className="text-sm font-medium uppercase text-gray-400 mb-1">Updated</h4>
                <div>{new Date(issue.fields.updated).toLocaleString()}</div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Issue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JiraIssueDetails;
