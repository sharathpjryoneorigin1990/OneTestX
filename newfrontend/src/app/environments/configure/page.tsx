"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { 
  EnvironmentConfig, 
  saveEnvironments, 
  getActiveEnvironment, 
  saveEnvironmentToBackend 
} from '@/lib/environment';

interface EnvironmentFormData {
  environment: 'qa' | 'production' | 'custom';
  testType: 'smoke' | 'regression' | 'full';
  baseUrl: string;
  apiKey: string;
  customName: string;
  isCustom: boolean;
}

export default function EnvironmentConfiguration() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInitialSetup = searchParams.get('initial') === 'true';
  
  const [formData, setFormData] = useState<EnvironmentFormData>({
    environment: 'qa',
    testType: 'smoke',
    baseUrl: '',
    apiKey: '',
    customName: '',
    isCustom: false
  });
  
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  // Set client-side flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Helper function to check if we should redirect to dashboard
  const shouldRedirectToDashboard = useCallback(() => {
    if (isInitialSetup) return false;
    
    // Check cookies first for faster client-side checks
    const hasEnvCookie = document.cookie.split(';').some(
      (item) => item.trim().startsWith('env_configured=') || 
               item.trim().startsWith('initial_setup_seen=')
    );
    
    if (!hasEnvCookie) {
      // If no cookies, check localStorage
      const activeEnv = getActiveEnvironment();
      return !!activeEnv;
    }
    
    return hasEnvCookie;
  }, [isInitialSetup]);
  
  // Always show the configuration form without redirecting
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    console.log('Showing environment configuration page');
    setIsChecking(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkEnvironment = () => {
      console.log('Checking for existing environment configuration...');
      const activeEnv = getActiveEnvironment();
      
      if (activeEnv) {
        console.log('Found active environment:', activeEnv);
        
        // Update form data with existing environment
        setFormData({
          environment: activeEnv.type as any,
          testType: activeEnv.testType || 'smoke',
          baseUrl: activeEnv.url,
          apiKey: activeEnv.apiKey || '',
          customName: activeEnv.type === 'custom' ? activeEnv.name || '' : '',
          isCustom: activeEnv.type === 'custom'
        });
        
        // No longer redirecting to dashboard - always show the settings page
      } else {
        console.log('No active environment found');
      }
    };
    
    // Set client-side flag
    setIsClient(true);
    
    // Check environment
    checkEnvironment();
    
    // Listen for storage events in case another tab updates the config
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'activeEnvironment' || e.key === 'environments') {
        console.log('Storage event detected, checking environment...');
        checkEnvironment();
      }
    };
    
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [isInitialSetup, router]);

  const handleChange = (field: keyof EnvironmentFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form
      if (!formData.baseUrl) {
        throw new Error('Please provide a base URL');
      }
      
      if (!formData.baseUrl.startsWith('http')) {
        throw new Error('Please provide a valid URL (starting with http/https)');
      }
      
      console.log('Submitting environment configuration...');

      // Determine environment name
      let envName: string;
      if (formData.environment === 'custom' && formData.customName) {
        envName = formData.customName;
      } else {
        envName = formData.environment === 'production' 
          ? 'Production' 
          : formData.environment.toUpperCase();
      }

      // Prepare environment config
      const envConfig: EnvironmentConfig = {
        name: envName,
        url: formData.baseUrl.endsWith('/') 
          ? formData.baseUrl.slice(0, -1) 
          : formData.baseUrl, // Remove trailing slash if present
        type: formData.environment,
        testType: formData.testType,
        apiKey: formData.apiKey || undefined,
        isActive: true,
        description: `${envName} environment for ${formData.testType} testing`,
        headers: formData.apiKey ? { 'Authorization': `Bearer ${formData.apiKey}` } : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Saving environment config:', envConfig);
      
      // Save to local storage first for immediate UI update
      saveEnvironments([envConfig]);
      
      try {
        // Then save to backend
        await saveEnvironmentToBackend(envConfig);
        console.log('Environment saved to backend');
        
        // Set cookies to indicate setup is complete
        const cookies = [
          `initial_setup_seen=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`,
          `env_configured=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`,
          `has_configured_environments=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
        ];
        
        // Set all cookies
        cookies.forEach(cookie => {
          document.cookie = cookie;
        });
        
        // Force a full page reload to ensure all state is properly initialized
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Error saving to backend:', error);
        // Even if backend save fails, we can continue with local storage
        toast.success('Environment configured successfully! (Using local storage)', { duration: 3000 });
        
        // Still set the cookies and redirect
        const errorCookies = [
          `initial_setup_seen=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`,
          `env_configured=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`,
          `has_configured_environments=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
        ];
        
        // Set all cookies
        errorCookies.forEach(cookie => {
          document.cookie = cookie;
        });
        
        // Short delay to show the success message
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      }
      
    } catch (error: any) {
      console.error('Error saving environment:', error);
      toast.error(error.message || 'Failed to save environment configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClient || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking your environment...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <NewNavbar />
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-dark-900 to-dark-950">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-3">
              {isInitialSetup ? 'Welcome! Configure Your Testing Environment' : 'Update Environment Configuration'}
            </h1>
            <p className="text-gray-400 text-lg">
              {isInitialSetup 
                ? 'Set up your testing environment to get started' 
                : 'Update your environment settings as needed'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="glass-card p-6 rounded-xl border border-dark-700/50">
              <div className="space-y-6">
                {/* Environment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Environment Type
                  </label>
                  <Select
                    value={formData.environment}
                    onValueChange={(value: 'qa' | 'production' | 'custom') => 
                      handleChange('environment', value)
                    }
                  >
                    <SelectTrigger className="w-full bg-dark-700 border-dark-600 text-white">
                      <SelectValue placeholder="Select environment type" />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-800 border-dark-700">
                      <SelectItem value="qa" className="hover:bg-dark-700">QA</SelectItem>
                      <SelectItem value="production" className="hover:bg-dark-700">Production</SelectItem>
                      <SelectItem value="custom" className="hover:bg-dark-700">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Name (only shown for custom environment) */}
                {formData.environment === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Environment Name
                    </label>
                    <Input
                      type="text"
                      value={formData.customName}
                      onChange={(e) => handleChange('customName', e.target.value)}
                      className="bg-dark-700 border-dark-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Staging, Development"
                      required
                    />
                  </div>
                )}

                {/* Base URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Base URL
                  </label>
                  <Input
                    type="url"
                    value={formData.baseUrl}
                    onChange={(e) => handleChange('baseUrl', e.target.value)}
                    className="bg-dark-700 border-dark-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://api.example.com"
                    required
                  />
                </div>

                {/* API Key (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    API Key (Optional)
                  </label>
                  <Input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => handleChange('apiKey', e.target.value)}
                    className="bg-dark-700 border-dark-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="••••••••••••"
                  />
                </div>

                {/* Test Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Test Type
                  </label>
                  <Select
                    value={formData.testType}
                    onValueChange={(value: 'smoke' | 'regression' | 'full') => 
                      handleChange('testType', value)
                    }
                  >
                    <SelectTrigger className="w-full bg-dark-700 border-dark-600 text-white">
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-800 border-dark-700">
                      <SelectItem value="smoke" className="hover:bg-dark-700">Smoke Tests</SelectItem>
                      <SelectItem value="regression" className="hover:bg-dark-700">Regression Tests</SelectItem>
                      <SelectItem value="full" className="hover:bg-dark-700">Full Test Suite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-8 flex justify-between items-center">
                {!isInitialSetup && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 border-gray-600 text-gray-300 hover:bg-dark-700"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                )}
                <div className="ml-auto">
                  <Button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-all duration-300"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : isInitialSetup ? 'Save & Continue' : 'Update Configuration'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
