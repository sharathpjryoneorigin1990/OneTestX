import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  email: string;
  name: string;
} | null;

export const useAuth = () => {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        // In a real app, you would verify the token with your backend
        // For now, we'll just check if the token exists
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      // In a real app, you would call your backend API to login
      // This is a simplified example
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Store the token and user data
      localStorage.setItem('auth-token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    // Clear auth data
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
    localStorage.removeItem('hasConfiguredEnvironments');
    setUser(null);
    
    // Redirect to login page
    router.push('/login');
    
    return { success: true };
  }, [router]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
};

export default useAuth;
