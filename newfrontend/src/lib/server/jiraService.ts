import fs from 'fs';
import path from 'path';
import JiraApi from 'jira-client';

// Function to read Jira settings from file
const readJiraSettings = (): { host: string; username: string; apiToken: string } => {
  // First try environment variables
  const envSettings = {
    host: process.env.JIRA_HOST || '',
    username: process.env.JIRA_USERNAME || '',
    apiToken: process.env.JIRA_API_TOKEN || ''
  };

  // If all required environment variables are set, use them
  if (envSettings.host && envSettings.username && envSettings.apiToken) {
    console.log('Using Jira settings from environment variables');
    return envSettings;
  }

  // Try to read from file if environment variables are not set
  try {
    const settingsPath = path.resolve(process.cwd(), 'jira-settings.json');
    console.log('Looking for Jira settings at:', settingsPath);
    
    if (!fs.existsSync(settingsPath)) {
      console.warn('Jira settings file not found at:', settingsPath);
      return envSettings; // Return empty settings if file doesn't exist
    }

    try {
      console.log('Reading Jira settings from file...');
      const fileContent = fs.readFileSync(settingsPath, 'utf8').trim();
      
      // Remove any BOM characters if present
      const cleanContent = fileContent.replace(/^\uFEFF/, '');
      
      if (!cleanContent) {
        console.warn('Jira settings file is empty');
        return envSettings;
      }
      
      const settings = JSON.parse(cleanContent);
      
      // Validate required fields
      if (!settings.host || !settings.username || !settings.apiToken) {
        console.warn('Jira settings file is missing required fields');
        return envSettings;
      }
      
      console.log('Successfully loaded Jira settings from file');
      return {
        host: settings.host.trim(),
        username: settings.username.trim(),
        apiToken: settings.apiToken.trim()
      };
      
    } catch (parseError) {
      console.error('Error parsing Jira settings file:', parseError);
      return envSettings;
    }
  } catch (error) {
    console.error('Error accessing Jira settings file:', error);
    return envSettings;
  }
  
  // Fall back to environment variables if settings file doesn't exist
  return {
    host: process.env.JIRA_HOST || '',
    username: process.env.JIRA_USERNAME || '',
    apiToken: process.env.JIRA_API_TOKEN || ''
  };
};

// Initialize Jira client
let jiraClient: JiraApi | null = null;

const initJiraClient = (): JiraApi | null => {
  console.log('Initializing Jira client...');
  const settings = readJiraSettings();
  
  // Log settings (without sensitive data)
  console.log('Jira settings:', {
    hasHost: !!settings.host,
    hasUsername: !!settings.username,
    hasApiToken: !!settings.apiToken,
    host: settings.host ? '***.atlassian.net' : 'missing',
    username: settings.username ? '***@example.com' : 'missing'
  });
  
  // Validate required settings
  if (!settings.host || !settings.username || !settings.apiToken) {
    console.warn('Jira settings are not fully configured');
    console.warn('Missing:', {
      host: !settings.host,
      username: !settings.username,
      apiToken: !settings.apiToken
    });
    return null;
  }
  
  try {
    // Clean up host (remove protocol and trailing slash if present)
    let cleanHost = settings.host.trim()
      .replace(/^https?:\/\//, '')  // Remove http:// or https://
      .replace(/\/$/, '');          // Remove trailing slash
    
    console.log('Creating JiraApi instance with host:', cleanHost);
    
    // Initialize the Jira client with minimal required options
    const client = new JiraApi({
      protocol: 'https',
      host: cleanHost,
      username: settings.username.trim(),
      password: settings.apiToken.trim(),
      apiVersion: '3',
      strictSSL: true
    });
    
    // Store the original doRequest method
    const originalDoRequest = (client as any).doRequest;
    
    if (typeof originalDoRequest === 'function') {
      // Create a timeout wrapper for the doRequest method
      (client as any).doRequest = function(options: any, callback?: Function) {
        try {
          // Set timeout (10 seconds)
          options.timeout = 10000;
          return originalDoRequest.call(this, options, callback);
        } catch (error) {
          console.error('Jira API request failed:', error);
          return Promise.reject(error);
        }
      };
    }
    
    console.log('Jira client initialized successfully');
    return client;
  } catch (error) {
    console.error('Failed to initialize Jira client:', error);
    return null;
  }
};

// Initialize the client
jiraClient = initJiraClient();

/**
 * Reinitializes the Jira client with fresh settings
 * @returns {boolean} True if reinitialization was successful
 */
export const reinitializeJiraClient = (): boolean => {
  try {
    jiraClient = initJiraClient();
    return jiraClient !== null;
  } catch (error) {
    console.error('Failed to reinitialize Jira client:', error);
    return false;
  }
};

/**
 * Gets the initialized Jira client instance.
 * Throws an error if initialization fails.
 */
const getJiraClient = (): JiraApi => {
  if (!jiraClient) {
    jiraClient = initJiraClient();
    if (!jiraClient) {
      throw new Error('Failed to initialize Jira client. Please check your settings.');
    }
  }
  return jiraClient;
};

export { getJiraClient };

// Define the Jira client type with the methods we use
type JiraClient = {
  getProject: (projectKey: string) => Promise<any>;
  searchJira: (jql: string, options: { fields: string[]; maxResults: number }) => Promise<any>;
  findIssue: (issueKey: string, expand?: string, fields?: string[]) => Promise<any>;
  getCurrentUser: () => Promise<any>;
};

// Export API functions
export const getProject = async (projectKey: string) => {
  try {
    console.log(`[Jira Service] Fetching project: ${projectKey}`);
    const client = getJiraClient() as unknown as JiraClient;
    
    if (!client) {
      throw new Error('Jira client is not initialized');
    }
    
    const project = await client.getProject(projectKey);
    console.log(`[Jira Service] Successfully fetched project: ${projectKey}`);
    return project;
  } catch (error: unknown) {
    console.error(`[Jira Service] Error fetching project ${projectKey}:`, error);
    
    // Handle specific Jira API errors
    if (error && 
        typeof error === 'object' && 
        'error' in error && 
        error.error && 
        typeof error.error === 'object' && 
        'errorMessages' in error.error && 
        Array.isArray((error.error as any).errorMessages) && 
        (error.error as any).errorMessages.length > 0) {
      throw new Error(`Jira API error: ${(error.error as any).errorMessages.join(', ')}`);
    }
    
    // Handle HTTP errors
    if (error && 
        typeof error === 'object' && 
        'statusCode' in error && 
        typeof (error as any).statusCode === 'number') {
      const statusCode = (error as any).statusCode;
      const message = (error && typeof error === 'object' && 'message' in error) 
        ? String((error as any).message) 
        : 'Unknown error';
      throw new Error(`Jira request failed with status ${statusCode}: ${message}`);
    }
    
    // Re-throw with a more descriptive message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch project ${projectKey}: ${errorMessage}`);
  }
};

export const searchIssues = async (jql: string, fields: string[] = [], maxResults = 50) => {
  const client = getJiraClient() as unknown as JiraClient;
  return client.searchJira(jql, {
    fields: fields.length ? fields : ['summary', 'status', 'issuetype', 'priority'],
    maxResults,
  });
};

export const reloadSettings = (): boolean => {
  try {
    console.log('Reloading Jira settings...');
    
    // Clear any cached module that might be holding onto old settings
    const settingsPath = path.resolve(process.cwd(), 'jira-settings.json');
    if (fs.existsSync(settingsPath)) {
      try {
        // Clear the module cache for the settings file if it was required
        const resolvedPath = require.resolve(settingsPath);
        if (require.cache[resolvedPath]) {
          delete require.cache[resolvedPath];
          console.log('Cleared require cache for settings file');
        }
      } catch (e) {
        console.warn('Could not clear require cache for settings file:', e);
      }
    }
    
    // Force re-read the settings
    const settings = readJiraSettings();
    
    // Log the source of the settings for debugging
    const source = settings.host && settings.username && settings.apiToken 
      ? 'settings file' 
      : (process.env.JIRA_HOST ? 'environment variables' : 'no valid settings found');
      
    console.log(`Reloaded Jira settings from: ${source}`);
    
    // Validate settings
    if (!settings.host || !settings.username || !settings.apiToken) {
      console.error('Missing required Jira settings after reload');
      return false;
    }
    
    // Reinitialize the client with the new settings
    console.log('Reinitializing Jira client with new settings...');
    const client = reinitializeJiraClient();
    
    if (!client) {
      console.error('Failed to reinitialize Jira client');
      return false;
    }
    
    console.log('Successfully reloaded Jira settings and reinitialized client');
    return true;
  } catch (error) {
    console.error('Error reloading Jira settings:', error);
    return false;
  }
};

/**
 * Creates a new Jira issue
 */
export const createIssue = async (issue: any) => {
  const client = getJiraClient();
  return client.addNewIssue(issue);
};

/**
 * Gets a Jira issue by key
 */
export const getIssue = async (issueKey: string) => {
  const client = getJiraClient();
  return client.findIssue(issueKey);
};

/**
 * Updates an existing Jira issue
 */
export const updateIssue = async (issueKey: string, issueUpdate: any) => {
  const client = getJiraClient();
  return client.updateIssue(issueKey, issueUpdate);
};

/**
 * Searches for Jira issues using JQL
 */
export const findIssues = async (jql: string, fields: string[] = [], maxResults = 50) => {
  const client = getJiraClient();
  return client.searchJira(jql, {
    fields: fields.length ? fields : ['summary', 'status', 'issuetype', 'priority'],
    maxResults,
  });
};
