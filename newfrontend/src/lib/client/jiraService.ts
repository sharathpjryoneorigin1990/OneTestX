// Client-side Jira service that makes API calls to our Next.js API routes

/**
 * Reloads Jira settings from the server
 */
export const reloadJiraSettings = async (): Promise<boolean> => {
  try {
    console.log('Initiating Jira settings reload...');
    const response = await fetch('/api/jira/reload-settings', { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Failed to reload Jira settings:', result.message || 'Unknown error');
      throw new Error(result.message || 'Failed to reload Jira settings');
    }
    
    console.log('Successfully reloaded Jira settings');
    return true;
  } catch (error) {
    console.error('Error in reloadJiraSettings:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to reload Jira settings. Please try again.'
    );
  }
};

/**
 * Searches for Jira issues
 */
export const searchIssues = async (jql: string, fields: string[] = [], maxResults = 50) => {
  try {
    const params = new URLSearchParams({
      jql,
      maxResults: maxResults.toString(),
    });
    
    if (fields.length) {
      params.append('fields', fields.join(','));
    }
    
    const response = await fetch(`/api/jira/issues?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to search Jira issues');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error searching Jira issues:', error);
    throw error;
  }
};

/**
 * Gets project details
 */
export const getProject = async (projectKey: string) => {
  try {
    const response = await fetch(`/api/jira/project/${projectKey}`);
    if (!response.ok) {
      throw new Error(`Failed to get project ${projectKey}`);
    }
    return response.json();
  } catch (error) {
    console.error(`Error getting project ${projectKey}:`, error);
    throw error;
  }
};
