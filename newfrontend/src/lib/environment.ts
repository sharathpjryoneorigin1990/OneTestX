export interface EnvironmentConfig {
  name: string;
  url: string;
  type: 'qa' | 'production' | 'custom';
  description?: string;
  headers?: Record<string, string>;
  variables?: Record<string, string>;
  testType: 'smoke' | 'regression' | 'full';
  apiKey?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Helper function to save environment to backend
const saveEnvironmentToBackend = async (config: EnvironmentConfig): Promise<void> => {
  try {
    const response = await fetch('/api/environments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        environments: [config]
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save environment to server');
    }

    // Also save to .env file if this is a production environment
    if (config.type === 'production' || config.type === 'qa') {
      await fetch('/api/environments/write-env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          envVars: {
            NEXT_PUBLIC_API_URL: config.url,
            API_KEY: config.apiKey || '',
            ENVIRONMENT: config.type.toUpperCase(),
          }
        }),
      });
    }
  } catch (error) {
    console.error('Error saving environment to backend:', error);
    throw error;
  }
};

export { saveEnvironmentToBackend };

/**
 * Generates environment configuration for tests
 */
const generateTestEnvironment = (env: EnvironmentConfig) => {
  const config: Record<string, any> = {
    name: env.name,
    type: env.type,
    baseUrl: env.url,
    ...(env.description && { description: env.description }),
  };

  if (env.headers && Object.keys(env.headers).length > 0) {
    config.headers = { ...env.headers };
  }

  if (env.variables && Object.keys(env.variables).length > 0) {
    config.variables = { ...env.variables };
  }

  return config;
};

/**
 * Saves environments to localStorage and prepares them for test use
 */
/**
 * Save environment configuration
 */
export const saveEnvironments = (environments: EnvironmentConfig[]): void => {
  if (typeof window === 'undefined') return;
  
  console.log('Saving environments to localStorage:', environments);
  
  const timestamp = new Date().toISOString();
  const updatedEnvironments = environments.map(env => ({
    ...env,
    updatedAt: timestamp,
    createdAt: env.createdAt || timestamp,
    isActive: true // Ensure at least one environment is active
  }));
  
  try {
    localStorage.setItem('environments', JSON.stringify(updatedEnvironments));
    localStorage.setItem('hasConfiguredEnvironments', 'true');
    
    // Always set the first environment as active if none is active
    const activeEnv = updatedEnvironments[0];
    if (activeEnv) {
      localStorage.setItem('activeEnvironment', JSON.stringify(activeEnv));
      console.log('Active environment set:', activeEnv);
    }
    
    // Force a reload of the page to ensure the middleware picks up the changes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  } catch (error) {
    console.error('Error saving environments to localStorage:', error);
  }
};

/**
 * Get the currently active environment
 */
export const getActiveEnvironment = (): EnvironmentConfig | null => {
  if (typeof window === 'undefined') return null;
  const env = localStorage.getItem('activeEnvironment');
  return env ? JSON.parse(env) : null;
};

/**
 * Get all configured environments
 */
export const getEnvironments = (): EnvironmentConfig[] => {
  if (typeof window === 'undefined') return [];
  const envs = localStorage.getItem('environments');
  return envs ? JSON.parse(envs) : [];
};

/**
 * Check if environments have been configured
 */
export const hasConfiguredEnvironments = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('hasConfiguredEnvironments') === 'true' || 
         localStorage.getItem('has_configured_environments') === 'true';
};

export const getEnvironment = (name: string): EnvironmentConfig | undefined => {
  const envs = getEnvironments();
  return envs.find(env => env.name === name);
};
