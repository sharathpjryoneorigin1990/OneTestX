import { NextResponse } from 'next/server';
import { getJiraClient } from '@/lib/server/jiraService';

// Define the expected user type from Jira
interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress: string;
  self?: string;
  key?: string;
  name?: string;
  active?: boolean;
  timeZone?: string;
  locale?: string;
}

// Extend the Jira client type to include the methods we use
type JiraClientWithMethods = {
  getCurrentUser: () => Promise<JiraUser>;
  // Add other methods as needed
};

export async function GET() {
  try {
    const client = getJiraClient();
    
    if (!client) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Jira client not initialized. Please check your settings.' 
        },
        { status: 400 }
      );
    }
    
    // Cast the client to our extended type
    const jiraClient = client as unknown as JiraClientWithMethods;
    
    // Test the connection by getting the current user
    const myself = await jiraClient.getCurrentUser();
    
    return NextResponse.json({ 
      success: true,
      message: 'Successfully connected to Jira',
      user: {
        accountId: myself.accountId,
        displayName: myself.displayName,
        emailAddress: myself.emailAddress
      }
    });
    
  } catch (error) {
    console.error('Jira connection test failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to connect to Jira',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
