// This is a re-export file that points to the new client-side service
// The actual implementation has been moved to src/lib/client/jiraService.ts

export * from '@/lib/client/jiraService';

// If you need to import types from the Jira client, you can do:
// import type { JiraClient } from 'jira-client';
// export type { JiraClient };

// Note: For server-side usage, import directly from '@/lib/server/jiraService'
