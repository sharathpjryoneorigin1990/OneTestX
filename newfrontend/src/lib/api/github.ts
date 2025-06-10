/**
 * GitHub API service functions
 */

interface GitHubCredentials {
  username: string;
  token: string;
  repo: string;
}

interface SyncResponse {
  success: boolean;
  message: string;
  syncedFiles?: string[];
  errors?: string[];
}

/**
 * Connects to a GitHub repository and syncs test files to the local backend
 * @param credentials GitHub credentials and repository information
 * @returns Response with sync results
 */
export async function syncGitHubRepository(credentials: GitHubCredentials): Promise<SyncResponse> {
  try {
    const response = await fetch('/api/github/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to sync with GitHub');
    }

    return await response.json();
  } catch (error: unknown) {
    console.error('GitHub sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while syncing with GitHub';
    return {
      success: false,
      message: errorMessage,
      errors: [String(error)],
    };
  }
}
