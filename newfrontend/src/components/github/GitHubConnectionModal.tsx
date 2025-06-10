import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { syncGitHubRepository } from '@/lib/api/github';
import GitHubSyncResults from './GitHubSyncResults';

interface GitHubConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (data: { username: string; token: string; repo: string }) => void;
}

// Storage key for GitHub credentials
const GITHUB_CREDENTIALS_KEY = 'github_credentials';

export default function GitHubConnectionModal({ isOpen, onClose, onConnect }: GitHubConnectionModalProps) {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [syncedFiles, setSyncedFiles] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // Load saved credentials when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCredentials = localStorage.getItem(GITHUB_CREDENTIALS_KEY);
        if (savedCredentials) {
          const { username: savedUsername, token: savedToken, repo: savedRepo } = JSON.parse(savedCredentials);
          setUsername(savedUsername || '');
          setToken(savedToken || '');
          setRepo(savedRepo || '');
        }
      } catch (error) {
        console.error('Error loading saved GitHub credentials:', error);
      }
    }
  }, []);

  // Validate form inputs
  const validateForm = () => {
    if (!username.trim()) {
      alert('GitHub username is required');
      return false;
    }
    if (!token.trim()) {
      alert('GitHub personal access token is required');
      return false;
    }
    if (!repo.trim()) {
      alert('GitHub repository name is required');
      return false;
    }
    
    // Validate repository format (username/repo)
    if (!repo.includes('/')) {
      alert('Repository must be in the format "username/repository"');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before proceeding
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call the GitHub sync API
      const response = await syncGitHubRepository({ username, token, repo });
      
      if (response.success) {
        // Store synced files and show results modal
        if (response.syncedFiles && response.syncedFiles.length > 0) {
          setSyncedFiles(response.syncedFiles);
          setShowResults(true);
        }
        
        // Save credentials to localStorage
        try {
          localStorage.setItem(GITHUB_CREDENTIALS_KEY, JSON.stringify({ username, token, repo }));
          console.log('GitHub credentials saved to localStorage');
        } catch (error) {
          console.error('Error saving GitHub credentials to localStorage:', error);
        }
        
        // Pass the successful response to the parent component
        onConnect({ username, token, repo });
      } else {
        // Handle specific error cases
        console.error('GitHub sync failed:', response.message, response.errors);
        
        // Provide more helpful error messages based on common issues
        if (response.message.includes('not found')) {
          alert(`Repository not found. Please check that:\n1. The repository exists\n2. You have access to it\n3. The format is correct (username/repository)`);
        } else if (response.message.includes('Tests directory not found')) {
          alert(`Tests directory not found in the repository. Please ensure your repository has a 'tests' directory with 'smoke' and/or 'e2e' subdirectories.`);
        } else {
          alert(`Failed to sync: ${response.message}\n\n${response.errors ? response.errors.join('\n') : ''}`);
        }
      }
    } catch (error: unknown) {
      console.error('Error during GitHub sync:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`An error occurred while connecting to GitHub: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle closing the results modal
  const handleCloseResults = () => {
    setShowResults(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-gray-800 rounded-xl shadow-xl p-6 mx-4"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 className="text-2xl font-bold text-white mb-6">Connect to GitHub</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                  GitHub Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your-username"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-300 mb-1">
                  Personal Access Token
                </label>
                <input
                  type="password"
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  required
                />
                <p className="mt-1 text-xs text-gray-400">
                  Create a token with 'repo' scope in GitHub Settings → Developer settings → Personal access tokens
                </p>
              </div>
              
              <div>
                <label htmlFor="repo" className="block text-sm font-medium text-gray-300 mb-1">
                  Repository (owner/repo)
                </label>
                <input
                  type="text"
                  id="repo"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="username/repository"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.6.113.82-.26.82-.577 0-.286-.011-1.231-.016-2.234-3.338.724-4.042-1.505-4.042-1.505-.546-1.387-1.332-1.756-1.332-1.756-1.089-.745.083-.729.083-.729 1.205.085 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.419-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .32.21.694.825.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      Connect & Sync
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
      
      {/* Results modal */}
      <GitHubSyncResults 
        isVisible={showResults} 
        syncedFiles={syncedFiles} 
        onClose={handleCloseResults} 
      />
    </>
  );
}
