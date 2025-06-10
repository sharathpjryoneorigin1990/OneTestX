// Type definitions for jira-client

declare module 'jira-client' {
  interface JiraApiOptions {
    protocol: 'http' | 'https';
    host: string;
    username: string;
    password: string;
    apiVersion?: string;
    strictSSL?: boolean;
  }

  interface IssueObject {
    fields: {
      [key: string]: any;
    };
    [key: string]: any;
  }

  interface SearchUserOptions {
    username?: string;
    query?: string;
    startAt?: number;
    maxResults?: number;
    includeInactive?: boolean;
  }

  // The jira-client package's searchJira method is more permissive with options
  type SearchOptions = {
    [key: string]: any;
  };

  interface SearchResults {
    issues: IssueObject[];
    total: number;
    startAt: number;
    maxResults: number;
  }

  class JiraClient {
    constructor(options: JiraApiOptions);
    
    // Common methods
    getIssue(issueKey: string): Promise<IssueObject>;
    updateIssue(issueKey: string, issueUpdate: IssueObject): Promise<IssueObject>;
    addNewIssue(issue: IssueObject): Promise<IssueObject>;
    searchJira(jql: string, optionsOrFields?: SearchOptions | string[], startAt?: number, maxResults?: number): Promise<SearchResults>;
    findIssue(issueKey: string, expand?: string, fields?: string[], properties?: string[], fieldsByKeys?: boolean): Promise<IssueObject>;
    
    // Project methods
    getProject(projectKey: string): Promise<any>;
    
    // User methods
    searchUsers(options: SearchUserOptions): Promise<any[]>;
  }

  export = JiraClient;
}
