import { NextResponse } from 'next/server';
import { getJiraClient } from '@/lib/server/jiraService';

// Define the expected response type for the project
type JiraProject = {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  simplified: boolean;
  avatarUrls: {
    '48x48': string;
    '24x24': string;
    '16x16': string;
    '32x32': string;
  };
  projectCategory?: {
    id: string;
    name: string;
    description: string;
  };
};

export async function GET(
  request: Request,
  { params }: { params: { projectKey: string } }
) {
  const { projectKey } = params;
  
  if (!projectKey) {
    return NextResponse.json(
      { message: 'Project key is required' },
      { status: 400 }
    );
  }

  try {
    console.log(`[API] Fetching project details for key: ${projectKey}`);
    
    // Get the Jira client
    const client = getJiraClient();
    
    // Type assertion for the client
    const jiraClient = client as any;
    
    // Get project details
    const project: JiraProject = await jiraClient.getProject(projectKey);
    
    console.log(`[API] Successfully fetched project:`, {
      key: project.key,
      name: project.name,
      id: project.id
    });
    
    return NextResponse.json(project);
  } catch (error) {
    console.error(`[API] Error fetching project ${projectKey}:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = {
      message: 'Failed to fetch project',
      error: errorMessage,
      projectKey
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
