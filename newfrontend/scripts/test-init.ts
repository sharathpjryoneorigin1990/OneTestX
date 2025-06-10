import { readFileSync } from 'fs';
import path from 'path';

// Load environment variables from .env file if it exists
try {
  const envPath = path.resolve(process.cwd(), '.env');
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length > 0) {
      process.env[key.trim()] = value.join('=').trim();
    }
  });
  console.log('Loaded .env file');
} catch (error) {
  console.log('No .env file found, using environment variables');
}

// Now import jiraService after setting up environment variables
import { getJiraClient } from '../src/lib/server/jiraService';

// Define the expected user type
interface JiraUser {
  self: string;
  key: string;
  name: string;
  emailAddress: string;
  displayName: string;
  active: boolean;
  timeZone: string;
  locale: string;
}

// Define the expected issue type
interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    assignee?: { displayName: string };
  };
}

// Define the expected search results type
interface JiraSearchResults {
  issues: JiraIssue[];
  total: number;
}

async function testInit() {
  try {
    console.log('Testing Jira client initialization...');
    const client = getJiraClient();
    console.log('Jira client initialized successfully');
    
    // Use type assertion for the Jira client methods
    const jiraClient = client as unknown as {
      getCurrentUser: () => Promise<JiraUser>;
      searchJira: (jql: string, options: { maxResults: number; fields: string[] }) => Promise<JiraSearchResults>;
    };
    
    console.log('Testing connection to Jira...');
    const myself = await jiraClient.getCurrentUser();
    console.log('Successfully connected to Jira as:', myself.displayName);
    
    // Test searching for issues
    console.log('\nSearching for recent issues...');
    const searchResults = await jiraClient.searchJira('order by created DESC', {
      maxResults: 5,
      fields: ['summary', 'status', 'assignee']
    });
    
    console.log(`\nFound ${searchResults.issues.length} issues:`);
    searchResults.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.key}: ${issue.fields.summary}`);
      console.log(`   Status: ${issue.fields.status.name}`);
      console.log(`   Assignee: ${issue.fields.assignee?.displayName || 'Unassigned'}`);
    });
    
  } catch (error) {
    console.error('Test failed:');
    console.error(error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  }
}

testInit();
