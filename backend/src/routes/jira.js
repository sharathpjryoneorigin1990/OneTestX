import express from 'express';
import JiraService from '../services/jiraService.js';

const router = express.Router();

// Test Jira connection
router.post('/test-connection', async (req, res) => {
  try {
    const { domain, email, apiToken } = req.body;
    
    if (!domain || !email || !apiToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: domain, email, or apiToken'
      });
    }

    const jira = new JiraService(domain, email, apiToken);
    const result = await jira.testConnection();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Successfully connected to Jira',
        user: result.user
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error testing Jira connection:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while testing Jira connection'
    });
  }
});

// Get projects from Jira
router.get('/projects', async (req, res) => {
  try {
    const { domain, email, apiToken } = req.query;
    
    if (!domain || !email || !apiToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameters: domain, email, or apiToken'
      });
    }

    const jira = new JiraService(domain, email, apiToken);
    const result = await jira.getProjects();
    
    if (result.success) {
      res.json({
        success: true,
        projects: result.projects
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error fetching Jira projects:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching projects'
    });
  }
});

// Get issues for a project
router.get('/projects/:projectKey/issues', async (req, res) => {
  try {
    const { projectKey } = req.params;
    const { domain, email, apiToken, startAt = 0, maxResults = 50 } = req.query;
    
    if (!domain || !email || !apiToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameters: domain, email, or apiToken'
      });
    }

    const jira = new JiraService(domain, email, apiToken);
    const result = await jira.getIssues(
      projectKey,
      parseInt(startAt, 10),
      parseInt(maxResults, 10)
    );
    
    if (result.success) {
      res.json({
        success: true,
        ...result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error fetching Jira issues:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching issues'
    });
  }
});

// Get sprints for a board
router.get('/boards/:boardId/sprints', async (req, res) => {
  try {
    const { boardId } = req.params;
    const { domain, email, apiToken } = req.query;
    
    if (!domain || !email || !apiToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameters: domain, email, or apiToken'
      });
    }

    const jira = new JiraService(domain, email, apiToken);
    const result = await jira.getSprints(boardId);
    
    if (result.success) {
      res.json({
        success: true,
        sprints: result.sprints
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error fetching sprints:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching sprints'
    });
  }
});

// Get sprint report
router.get('/boards/:boardId/sprints/:sprintId/report', async (req, res) => {
  try {
    const { boardId, sprintId } = req.params;
    const { domain, email, apiToken } = req.query;
    
    if (!domain || !email || !apiToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameters: domain, email, or apiToken'
      });
    }

    const jira = new JiraService(domain, email, apiToken);
    const result = await jira.getSprintReport(boardId, sprintId);
    
    if (result.success) {
      res.json({
        success: true,
        report: result.report
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error fetching sprint report:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching sprint report'
    });
  }
});

export default router;
