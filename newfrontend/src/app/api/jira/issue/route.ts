import { NextResponse } from 'next/server';
import { createIssue } from '@/lib/server/jiraService'; // Using the new server-side service

type JiraIssue = {
  fields: {
    project: { key: string };
    summary: string;
    issuetype: { name: string };
    [key: string]: any;
  };
  [key: string]: any;
};

export async function POST(request: Request) {
  try {
    // Validate request body
    const body = await request.json();
    const issueData = body.issueData as JiraIssue;

    if (!issueData.fields || !issueData.fields.project || !issueData.fields.issuetype || !issueData.fields.summary) {
      return NextResponse.json(
        { error: 'Missing required fields (project, issuetype, summary are required)' },
        { status: 400 }
      );
    }

    // Create the issue in Jira
    const createdIssue = await createIssue(issueData);

    return NextResponse.json(createdIssue, { status: 201 });
  } catch (error: any) {
    console.error('[API JIRA CREATE ISSUE POST] Error:', error);
    const errorMessage = typeof error.message === 'string' ? error.message : 'An unknown error occurred while creating Jira issue.';
    return NextResponse.json({ message: 'Failed to create Jira issue.', error: errorMessage }, { status: 500 });
  }
}
