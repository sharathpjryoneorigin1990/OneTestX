import JiraApi from 'jira-client';

class JiraService {
  constructor(domain, email, apiToken) {
    this.jira = new JiraApi({
      protocol: 'https',
      host: `${domain}.atlassian.net`,
      username: email,
      password: apiToken,
      apiVersion: '3',
      strictSSL: true
    });
  }

  async testConnection() {
    try {
      const myself = await this.jira.getMyself();
      return { success: true, user: myself };
    } catch (error) {
      console.error('Jira connection error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to connect to Jira' 
      };
    }
  }

  async getProjects() {
    try {
      const projects = await this.jira.listProjects();
      return { success: true, projects };
    } catch (error) {
      console.error('Error fetching Jira projects:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch projects' 
      };
    }
  }

  async getIssues(projectKey, startAt = 0, maxResults = 50) {
    try {
      const jql = `project = ${projectKey} ORDER BY created DESC`;
      const issues = await this.jira.searchJira(jql, { 
        startAt, 
        maxResults 
      });
      return { success: true, ...issues };
    } catch (error) {
      console.error('Error fetching Jira issues:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch issues' 
      };
    }
  }

  async getSprints(boardId) {
    try {
      const sprints = await this.jira.getAllSprints(boardId);
      return { success: true, sprints };
    } catch (error) {
      console.error('Error fetching sprints:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch sprints' 
      };
    }
  }

  async getSprintReport(boardId, sprintId) {
    try {
      const report = await this.jira.getSprintReport(boardId, sprintId);
      return { success: true, report };
    } catch (error) {
      console.error('Error fetching sprint report:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch sprint report' 
      };
    }
  }
}

export default JiraService;
