import { NextResponse } from 'next/server';
import { findIssues } from '@/lib/server/jiraService'; // Using the new server-side service

export async function GET(request: Request) {
  console.log('Jira Issues API - Received request');
  const { searchParams } = new URL(request.url);
  const jql = searchParams.get('jql');
  const maxResults = searchParams.get('maxResults');
  const fields = searchParams.get('fields');
  const project = searchParams.get('project');

  console.log('Jira Issues API - Request parameters:', { jql, project, maxResults, fields });

  try {
    // If no JQL but project is provided, construct a basic JQL query
    let finalJql = jql || '';
    if (!jql && project) {
      finalJql = `project = "${project}" ORDER BY updated DESC`;
    } else if (!jql && !project) {
      const error = 'Either JQL query or project parameter is required.';
      console.error('Jira Issues API - Error:', error);
      return NextResponse.json({ message: error }, { status: 400 });
    }

    const numMaxResults = maxResults ? Math.min(parseInt(maxResults, 10), 100) : 50;
    
    // Parse fields if provided, otherwise use default fields
    const arrFields = fields 
      ? fields.split(',').map(field => field.trim())
      : ['summary', 'status', 'assignee', 'issuetype', 'priority', 'updated'];
    
    console.log('Jira Issues API - Fetching issues with JQL:', finalJql);
    console.log('Jira Issues API - Fields:', arrFields);
    console.log('Jira Issues API - Max results:', numMaxResults);

    // Call the service to fetch issues from Jira
    const issues = await findIssues(finalJql, arrFields, numMaxResults);
    console.log(`Jira Issues API - Found ${issues.issues?.length || 0} issues`);
    
    return NextResponse.json(issues);
  } catch (error: any) {
    console.error('[API JIRA ISSUES GET] Error:', error);
    // Ensure error.message is a string, provide a fallback if not.
    const errorMessage = typeof error.message === 'string' ? error.message : 'An unknown error occurred while fetching Jira issues.';
    return NextResponse.json({ message: 'Failed to fetch Jira issues.', error: errorMessage }, { status: 500 });
  }
}
