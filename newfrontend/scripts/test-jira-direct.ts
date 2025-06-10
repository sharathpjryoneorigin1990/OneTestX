import { getJiraClient } from '../src/lib/server/jiraService';

async function testJiraConnection() {
  try {
    console.log('Testing Jira connection...');
    
    // Get the Jira client
    const client = getJiraClient();
    
    console.log('Jira client initialized successfully');
    
    // Test getting the current user
    console.log('Fetching current user...');
    const myself = await client.getCurrentUser();
    
    console.log('Successfully connected to Jira as:', {
      displayName: myself.displayName,
      emailAddress: myself.emailAddress,
      accountId: myself.accountId
    });
    
    // Test searching for issues
    console.log('\nSearching for recent issues...');
    const searchResults = await client.searchJira('order by created DESC', {
      maxResults: 5,
      fields: ['summary', 'status', 'assignee']
    });
    
    console.log(`\nFound ${searchResults.issues.length} issues:`);
    searchResults.issues.forEach((issue: any, index: number) => {
      console.log(`\n${index + 1}. ${issue.key}: ${issue.fields.summary}`);
      console.log(`   Status: ${issue.fields.status.name}`);
      console.log(`   Assignee: ${issue.fields.assignee?.displayName || 'Unassigned'}`);
    });
    
  } catch (error) {
    console.error('Jira test failed:');
    console.error(error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  }
}

// Run the test
testJiraConnection();
