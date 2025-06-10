import { useState, useCallback } from 'react';

export interface ContrastResult {
  element: string;
  text: string;
  foreground: string;
  background: string;
  contrast: {
    contrastRatio: number;
    aa: {
      normal: boolean;
      large: boolean;
    };
    aaa: {
      normal: boolean;
      large: boolean;
    };
    wcagLevel: 'AAA' | 'AA' | 'Fail';
    fontSize: string;
    fontWeight: string;
  };
  selector: string;
  html: string;
}

interface UseContrastCheckReturn {
  results: ContrastResult[] | null;
  isLoading: boolean;
  error: string | null;
  checkContrast: (url: string) => Promise<void>;
  reset: () => void;
}

export const useContrastCheck = (): UseContrastCheckReturn => {
  const [results, setResults] = useState<ContrastResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkContrast = useCallback(async (url: string) => {
    if (!url) {
      setError('URL is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/accessibility/contrast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      // First, get the response as text to handle potential JSON parsing errors
      const responseText = await response.text();
      let data;
      
      try {
        // Try to parse the response as JSON
        data = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        console.error('Response text:', responseText);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        const errorMessage = data?.error || 
                            data?.message || 
                            `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      if (!data) {
        throw new Error('No data received from server');
      }

      setResults(data.results || []);
    } catch (err) {
      console.error('Error checking contrast:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResults(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    results,
    isLoading,
    error,
    checkContrast,
    reset,
  };
};
