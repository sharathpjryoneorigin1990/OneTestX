import { NextResponse } from 'next/server';
import { getIssue, updateIssue } from '@/lib/server/jiraService';

type JiraIssue = {
  fields: {
    [key: string]: any;
  };
  [key: string]: any;
};

interface RouteParams {
  params: { issueKey: string };
}

/**
 * Handles GET requests to fetch a single Jira issue by its key.
 * e.g., GET /api/jira/issue/PROJ-123
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { issueKey } = params;

  if (!issueKey) {
    return NextResponse.json({ message: 'Issue key is required in the URL path.' }, { status: 400 });
  }

  try {
    const issue = await getIssue(issueKey);
    return NextResponse.json(issue);
  } catch (error: any) {
    console.error(`[API JIRA GET ISSUE ${issueKey}] Error:`, error);
    const errorMessage = typeof error.message === 'string' ? error.message : 'An unknown error occurred.';
    // Check for 404 Not Found specifically
    if (errorMessage.includes('404')) {
        return NextResponse.json({ message: `Issue '${issueKey}' not found.`, error: errorMessage }, { status: 404 });
    }
    return NextResponse.json({ message: `Failed to fetch Jira issue ${issueKey}.`, error: errorMessage }, { status: 500 });
  }
}

/**
 * Handles PUT requests to update an existing Jira issue.
 * e.g., PUT /api/jira/issue/PROJ-123
 */
export async function PUT(request: Request, { params }: RouteParams) {
  const { issueKey } = params;

  if (!issueKey) {
    return NextResponse.json({ message: 'Issue key is required in the URL path.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    // The body should contain the update payload, e.g., { issueUpdateData: { fields: { summary: 'New summary' } } }
    const issueUpdateData = body.issueUpdateData as JiraIssue;

    if (!issueUpdateData || !issueUpdateData.fields) {
      return NextResponse.json(
        { message: 'Invalid update data. The request body must contain an "issueUpdateData" object with a "fields" property.' }, 
        { status: 400 }
      );
    }

    const result = await updateIssue(issueKey, issueUpdateData);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`[API JIRA UPDATE ISSUE ${issueKey}] Error:`, error);
    const errorMessage = typeof error.message === 'string' ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Failed to update Jira issue ${issueKey}.`, error: errorMessage }, { status: 500 });
  }
}
