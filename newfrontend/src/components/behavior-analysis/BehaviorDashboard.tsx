import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiActivity, 
  FiClock, 
  FiMousePointer, 
  FiNavigation, 
  FiSearch, 
  FiFilter, 
  FiX, 
  FiPlay, 
  FiStopCircle, 
  FiExternalLink,
  FiBarChart2,
  FiMap,
  FiCompass,
  FiAlertCircle,
  FiAward,
  FiChevronRight 
} from 'react-icons/fi';
import { useEnhancedBehaviorTracking } from '@/hooks/useEnhancedBehaviorTracking';
import type { BehaviorAnalysisResult, BehaviorEvent } from '@/types/behavior';

// Define our extended session type with custom properties
type ExtendedSession = {
  id: string;
  sessionId: string;
  url: string;
  events: BehaviorEvent[];
  startTime: number;
  endTime: number | null;
  status: 'active' | 'completed';
  eventCount?: number;
  metadata?: Record<string, any>;
  [key: string]: any; // Allow additional properties
};

// Define the structure of a tracked URL session
interface TrackedUrl {
  id: string;
  url: string;
  events: BehaviorEvent[];
  startTime: Date;
  endTime: Date | null;
  sessionId: string;
  status?: 'active' | 'completed';
  eventCount?: number;
  metadata?: Record<string, any>;
}

// Max events per batch to prevent payload too large errors
const MAX_EVENTS_PER_BATCH = 50;

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
};

// Mock data for testing
const mockAnalysisData: BehaviorAnalysisResult = {
  eventTypes: ['click', 'scroll', 'navigation'],
  eventCounts: { click: 42, scroll: 15, navigation: 3 },
  sessionDuration: 300,
  timeOnPage: {
    '/': 45,
    '/products': 60,
    '/cart': 15
  },
  clickHeatmap: {
    elementClicks: { '.button': 12, '.link': 8, '.card': 5 },
    positionClicks: [
      { x: 100, y: 200, count: 5 },
      { x: 300, y: 400, count: 3 },
    ],
  },
  navigationFlow: [
    { from: '/', to: '/products', count: 10 },
    { from: '/products', to: '/cart', count: 5 },
  ],
  engagement: {
    score: 78,
    activeTime: 1200,
    scrollDepth: 85,
    pagesPerSession: 3.5,
    bounceRate: 0.25,
    ctr: 0.15,
  },
  anomalies: [
    {
      type: 'high_bounce_rate',
      description: 'High bounce rate on product page',
      severity: 'medium',
      timestamp: Date.now() - 3600000,
    },
  ],
  recommendations: [
    {
      title: 'Improve CTA visibility',
      description: 'Make the call-to-action buttons more prominent',
      priority: 'high',
    },
  ],
  sessionStart: Date.now() - 3600000,
  sessionEnd: Date.now(),
  pagesVisited: ['/', '/products', '/cart'],
};

interface Session {
  id: string;
  url: string;
  events: BehaviorEvent[];
  startTime: number;
  endTime: number | null;
  sessionId: string;
  status: 'active' | 'completed';
  eventCount?: number;
}

interface TrackedSession extends Omit<Session, 'events'> {
  // Additional properties specific to TrackedSession if needed
}

interface TrackedUrl {
  url: string;
  events: BehaviorEvent[];
  startTime: Date;
  endTime: Date | null;
  sessionId: string;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: <FiActivity className="mr-2" /> },
  { id: 'events', label: 'Events', icon: <FiBarChart2 className="mr-2" /> },
  { id: 'heatmap', label: 'Heatmap', icon: <FiMap className="mr-2" /> },
  { id: 'navigation', label: 'Navigation', icon: <FiCompass className="mr-2" /> },
  { id: 'anomalies', label: 'Anomalies', icon: <FiAlertCircle className="mr-2" /> },
  { id: 'recommendations', label: 'Recommendations', icon: <FiAward className="mr-2" /> },
];

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

const BehaviorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<BehaviorAnalysisResult | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message?: string }>({ status: 'idle' });
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [showIframe, setShowIframe] = useState<boolean>(false);
  const [trackedSessions, setTrackedSessions] = useState<TrackedUrl[]>([]);
  const [activeSession, setActiveSession] = useState<TrackedUrl | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const { 
    trackEvent, 
    trackPageView, 
    startNewSession, 
    endSession, 
    getCurrentSession,
    sendBehaviorData
  } = useEnhancedBehaviorTracking();
  
  // Helper to safely get current session with proper typing
  const getCurrentSessionSafe = useCallback((): ExtendedSession | null => {
    const session = getCurrentSession();
    if (!session) return null;
    
    // Ensure session has required properties
    return {
      ...session,
      id: session.id || `session_${Date.now()}`,
      sessionId: session.id || `session_${Date.now()}`,
      url: session.url || '',
      events: Array.isArray(session.events) ? session.events : [],
      startTime: session.startTime || Date.now(),
      endTime: session.endTime || null,
      status: session.status || (session.endTime ? 'completed' : 'active'),
      eventCount: Array.isArray(session.events) ? session.events.length : 0,
      metadata: session.metadata || {}
    };
  }, [getCurrentSession]);
  
  // Track if we're currently in a tracking session
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Format time helper function
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify the origin matches your expected domain in production
      // if (event.origin !== 'https://your-expected-domain.com') return;
      
      if (event.data && event.data.type === 'TRACK_EVENT') {
        console.log('Received event from iframe:', event.data.eventType, event.data.payload);
        trackEvent(event.data.eventType, event.data.payload);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [trackEvent]);
  
  // Initialize with any existing session
  useEffect(() => {
    const session = getCurrentSessionSafe();
    if (session) {
      console.log('Initializing with existing session:', {
        id: session.id,
        eventCount: session.events?.length,
        status: session.status
      });
      
      setCurrentSessionId(session.sessionId);
      setActiveSession({
        id: session.id,
        url: session.url,
        events: Array.isArray(session.events) ? session.events : [],
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : null,
        sessionId: session.sessionId,
        status: session.status || (session.endTime ? 'completed' : 'active'),
        eventCount: Array.isArray(session.events) ? session.events.length : 0
      });
      setIsTracking(session.status === 'active');
    } else {
      console.log('No existing session found');
    }
  }, [getCurrentSessionSafe]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = targetUrl.trim();
    
    if (!trimmedUrl) {
      setError('Please enter a URL');
      return;
    }
    
    // Try to parse the URL
    let url: URL;
    let finalUrl = trimmedUrl;
    
    try {
      // Check if URL already has a protocol
      if (!/^https?:\/\//i.test(trimmedUrl)) {
        // Try with https first (more secure default)
        try {
          finalUrl = `https://${trimmedUrl}`;
          url = new URL(finalUrl);
        } catch (e) {
          // If https fails, try with http
          try {
            finalUrl = `http://${trimmedUrl}`;
            url = new URL(finalUrl);
          } catch (e) {
            throw new Error('Invalid URL format');
          }
        }
      } else {
        // URL already has a protocol
        url = new URL(trimmedUrl);
        finalUrl = trimmedUrl;
      }
      
      // Additional validation
      if (!url.hostname) {
        throw new Error('Invalid hostname');
      }
      
      // Clear any previous errors
      setError(null);
      
      // Start a new tracking session
      const sessionId = startNewSession(finalUrl, {
        // Add any additional metadata here
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        timestamp: Date.now()
      });
      
      console.log('Started new tracking session:', sessionId, { url: finalUrl });
      
      const newSession: TrackedUrl = {
        id: sessionId,
        url: finalUrl,
        events: [],
        startTime: new Date(),
        endTime: null,
        sessionId,
        status: 'active' as const,
        eventCount: 0
      };
      
      setTrackedSessions(prev => [...prev, newSession]);
      setActiveSession(newSession);
      setShowIframe(true);
      setIsTesting(true);
      setIsTracking(true);
      setError(null);
      
      // Track the initial page view
      trackPageView(finalUrl);
      
    } catch (err) {
      console.error('URL validation error:', err);
      setError('Please enter a valid URL (e.g., example.com or https://example.com)');
    }
  };
  
  // Handle stopping the tracking
  const handleStopTracking = useCallback(async () => {
    if (!currentSessionId) {
      console.log('No active session to stop');
      return;
    }

    try {
      console.log('Ending session:', currentSessionId);
      
      // Get the current session data before ending it
      const session = getCurrentSessionSafe();
      if (!session) {
        console.error('No session data found for:', currentSessionId);
        return;
      }

      // Update the session with end time and status
      const endTime = new Date();
      
      // End the session in the tracking system
      endSession(currentSessionId);
      
      // Only send behavior data if there are events
      let sendSuccess = true;
      if (session.events && session.events.length > 0) {
        console.log(`Sending ${session.events.length} events for session:`, currentSessionId);
        sendSuccess = await sendBehaviorData(session.events, currentSessionId);
        if (!sendSuccess) {
          console.error('Failed to send behavior data for session:', currentSessionId);
        }
      } else {
        console.log('No events to send for session:', currentSessionId);
      }
      
      // Create the updated session object with proper typing
      const updatedSession: TrackedUrl = {
        id: session.id,
        url: session.url,
        events: Array.isArray(session.events) ? session.events : [],
        startTime: new Date(session.startTime),
        endTime: endTime,
        sessionId: session.sessionId,
        status: 'completed',
        eventCount: session.events?.length || 0,
        metadata: session.metadata || {}
      };
      
      // Update the tracked sessions list
      setTrackedSessions(prev => 
        prev.map(s => 
          s.sessionId === currentSessionId ? updatedSession : s
        )
      );
      
      // Clear the active session and reset UI state
      setActiveSession(null);
      setShowIframe(false);
      setIsTesting(false);
      setCurrentSessionId(null);
      
      console.log('Successfully ended session:', currentSessionId, {
        eventCount: updatedSession.eventCount,
        duration: (endTime.getTime() - new Date(session.startTime).getTime()) / 1000
      });
      
      // If there was an error sending data, show a warning but don't block the UI
      if (!sendSuccess) {
        setError('Session ended, but there was an issue saving the data. Some data may be lost.');
      }
      
      // Reset the URL input
      setTargetUrl('');
      
    } catch (err) {
      console.error('Error stopping tracking:', err);
      setError(`Failed to stop tracking: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [currentSessionId, endSession, getCurrentSessionSafe, sendBehaviorData]);

  // Get recent sessions from local state
  const getRecentSessions = useCallback((): TrackedUrl[] => {
    return trackedSessions.map(session => ({
      ...session,
      status: session.endTime ? 'completed' : 'active',
      eventCount: session.events?.length || 0
    }));
  }, [trackedSessions]);

  // Analyze behavior data with retry logic
  const analyzeBehavior = async () => {
    if (!currentSessionId || !activeSession) {
      setError('No active session to analyze');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setAnalysisStatus({ status: 'loading', message: 'Analyzing session data...' });
    
    let retryCount = 0;
    let success = false;
    let lastError: Error | null = null;
    
    try {
      while (retryCount <= RETRY_CONFIG.maxRetries && !success) {
        try {
          // Add delay for retries (no delay on first attempt)
          if (retryCount > 0) {
            const delay = Math.min(
              RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, retryCount - 1),
              RETRY_CONFIG.maxDelay
            );
            console.log(`Retry ${retryCount}/${RETRY_CONFIG.maxRetries} in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          console.log('Sending analyze request for session:', currentSessionId);
          console.log('Number of events being sent:', activeSession.events?.length || 0);
          
          const response = await fetch('http://localhost:3005/api/analyze-behavior', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: currentSessionId,
              events: activeSession.events || []
            }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Server responded with error:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const result = await response.json();
          console.log('Received analysis result:', result);
          
          if (!result || Object.keys(result).length === 0) {
            console.error('Empty analysis result received from server');
            throw new Error('Received empty analysis result');
          }
          
          // Log the structure of the result for debugging
          console.log('Analysis result structure:', {
            hasEventCounts: !!result.eventCounts,
            hasPagesVisited: !!result.pagesVisited,
            hasEngagement: !!result.engagement,
            hasClickHeatmap: !!result.clickHeatmap,
            hasAnomalies: !!result.anomalies,
            hasRecommendations: !!result.recommendations
          });
          
          setAnalysis(result);
          console.log('Analysis state updated with new data');
          setAnalysisStatus({ 
            status: 'success', 
            message: `Analysis completed successfully with ${result.eventCounts ? Object.values(result.eventCounts).reduce((a, b) => a + b, 0) : 0} events processed` 
          });
          success = true;
          return; // Exit the function on success
          
        } catch (err) {
          lastError = err as Error;
          console.error(`Attempt ${retryCount + 1} failed:`, err);
          retryCount++;
        }
      }
      
      // If we get here, all retries failed
      throw lastError || new Error('Failed to analyze session after multiple attempts');
      
    } catch (err) {
      const errorMessage = `Failed to analyze session: ${(err as Error).message}`;
      console.error('Analysis failed:', errorMessage);
      setError(errorMessage);
      setAnalysisStatus({ status: 'error', message: errorMessage });
    } finally {
      setIsAnalyzing(false);
      // Clear status message after 5 seconds
      if (analysisStatus.status !== 'idle') {
        setTimeout(() => {
          setAnalysisStatus(prev => ({ ...prev, message: undefined }));
        }, 5000);
      }
    }
  };

  const renderTabContent = () => {
    if (!analysis) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Session Duration</h3>
                <p className="text-2xl font-semibold">
                  {formatTime(analysis?.sessionDuration || 0)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Pages Visited</h3>
                <p className="text-2xl font-semibold">
                  {analysis?.pagesVisited?.length || 0}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Events</h3>
                <p className="text-2xl font-semibold">
                  {analysis?.eventCounts ? Object.values(analysis.eventCounts).reduce((a, b) => a + b, 0) : 0}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Engagement Score</h3>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(analysis?.engagement?.score || 0) * 100}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {Math.round((analysis?.engagement?.score || 0) * 100)}% engagement
              </p>
            </div>
          </div>
        );

      case 'events':
        // Add null checks and default values
        const eventCounts = analysis?.eventCounts || {};
        const eventEntries = Object.entries(eventCounts);
        const maxCount = eventEntries.length > 0 ? Math.max(...Object.values(eventCounts)) : 1; // Default to 1 to avoid division by zero
        
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Event Distribution</h3>
            {eventEntries.length > 0 ? (
              <div className="space-y-2">
                {eventEntries.map(([eventType, count]) => (
                  <div key={eventType} className="flex items-center">
                    <span className="w-32 text-sm font-medium">{eventType}</span>
                    <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{
                          width: `${(count / maxCount) * 100}%`
                        }}
                      />
                    </div>
                    <span className="ml-2 text-sm w-12 text-right">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">
                No event data available
              </div>
            )}
          </div>
        );

      case 'heatmap':
        // Add null checks and default values
        const positionClicks = analysis?.clickHeatmap?.positionClicks || [];
        
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Click Heatmap</h3>
            <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
              {positionClicks.length > 0 ? (
                positionClicks.map((position, index) => (
                  <div key={index}>
                    <div
                      className="absolute bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${position?.x || 0}%`,
                        top: `${position?.y || 0}%`,
                        width: `${Math.min(30, Math.max(10, (position?.count || 0) * 5))}px`,
                        height: `${Math.min(30, Math.max(10, (position?.count || 0) * 5))}px`,
                        opacity: Math.min(0.8, 0.2 + (position?.count || 0) * 0.1),
                      }}
                    />
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No click data available
                </div>
              )}
            </div>
          </div>
        );

      case 'navigation':
        // Add null checks and default values
        const pagesVisited = analysis?.pagesVisited || [];
        const timeOnPage = analysis?.timeOnPage || {};
        
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Navigation Flow</h3>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center space-x-4 overflow-x-auto py-4">
                {pagesVisited.length > 0 ? (
                  pagesVisited.map((page, index) => (
                    <React.Fragment key={index}>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium">
                          {index + 1}
                        </div>
                        <div className="mt-2 text-sm text-center max-w-xs truncate">
                          {page ? (typeof page === 'string' ? page.replace(/^https?:\/\/[^/]+/, '') : '') : 'Home'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(timeOnPage[page as string] || 0)}
                        </div>
                      </div>
                      {index < pagesVisited.length - 1 && (
                        <div className="flex-shrink-0 flex items-center">
                          <FiChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <div className="text-gray-500 text-center w-full py-4">
                    No navigation data available
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'anomalies':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Detected Anomalies</h3>
            {analysis.anomalies.length > 0 ? (
              <div className="space-y-3">
                {analysis.anomalies.map((anomaly, index) => (
                  <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FiAlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          {anomaly.type}: {anomaly.description}
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">
                          Severity: {anomaly.severity}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No anomalies detected in this session.</p>
            )}
          </div>
        );

      case 'recommendations':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Recommendations</h3>
            {analysis.recommendations.length > 0 ? (
              <ul className="space-y-3">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900">{rec.title}</h4>
                      <p className="text-gray-700">{rec.description}</p>
                      {rec.priority && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 bg-blue-100 text-blue-800">
                          {rec.priority} priority
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No specific recommendations at this time.</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* URL Input Section */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Test a Website</h2>
          {activeSession && (
            <button
              onClick={handleStopTracking}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Stop Tracking
            </button>
          )}
        </div>
        <form onSubmit={handleUrlSubmit} className="flex gap-2">
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="Enter website URL (e.g., example.com)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!targetUrl.trim() || isTesting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? 'Testing...' : 'Test Website'}
          </button>
        </form>
        {error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
        {isTesting && (
          <div className="mt-2 text-sm text-gray-500">
            Testing: {targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`}
            {activeSession && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Tracking active
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Iframe Container */}
      {showIframe && activeSession && (
        <div className="mb-8 border rounded-lg overflow-hidden shadow-lg">
          <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
            <div className="text-sm text-gray-600 truncate">
              <FiExternalLink className="inline mr-1" />
              {activeSession.url}
            </div>
            <button 
              onClick={() => setShowIframe(false)}
              className="text-gray-500 hover:text-gray-700"
              title="Minimize"
            >
              &times;
            </button>
          </div>
          <iframe
            ref={iframeRef}
            src={activeSession.url}
            className="w-full h-[600px] border-0"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            title="Website Tester"
          />
        </div>
      )}
      
      {/* Tracked Sessions */}
      {trackedSessions.length > 0 && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tracked Sessions</h3>
          <div className="space-y-3">
            {trackedSessions.map((session, idx) => (
              <div 
                key={session.sessionId} 
                className={`p-4 border rounded-lg transition-colors ${activeSession?.sessionId === session.sessionId ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}
                onClick={() => setActiveSession(session)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 truncate pr-2">{session.url}</span>
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    {new Date(session.startTime).toLocaleTimeString()}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-700">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {session.events.length} {session.events.length === 1 ? 'event' : 'events'}
                  </span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className={session.endTime ? 'text-green-600' : 'text-amber-600'}>
                    {session.endTime ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-2xl font-bold text-gray-800">User Behavior Analysis</h2>
          <p className="mt-1.5 text-sm text-gray-600">
            Track and analyze user interactions to improve user experience.
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center space-x-4">
              <button
                onClick={analyzeBehavior}
                disabled={isAnalyzing}
                className={`px-4 py-2.5 rounded-lg text-white font-medium ${isAnalyzing ? 'bg-blue-500' : 'bg-blue-600 hover:bg-blue-700 shadow-sm'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center transition-colors duration-150`}
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FiActivity className="mr-2" />
                    Analyze Current Session
                  </>
                )}
              </button>
              {analysisStatus.status === 'success' && (
                <div className="flex items-center text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                  <svg className="h-4 w-4 text-green-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Analysis Complete
                </div>
              )}
              {analysisStatus.status === 'error' && (
                <div className="flex items-center text-sm font-medium text-red-700 bg-red-50 px-3 py-1.5 rounded-lg">
                  <svg className="h-4 w-4 text-red-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Analysis Failed
                </div>
              )}
            </div>
            {analysisStatus.message && (
              <div className={`text-sm p-3 rounded-lg border ${analysisStatus.status === 'success' ? 'bg-green-50 border-green-200 text-green-800' : analysisStatus.status === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                <div className="flex items-start">
                  {analysisStatus.status === 'success' ? (
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : analysisStatus.status === 'error' ? (
                    <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span>{analysisStatus.message}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {analysis ? (
          <>
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 font-semibold'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 text-sm flex items-center transition-colors duration-150`}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        ) : analysisStatus.status === 'loading' ? (
          <div className="p-12 flex flex-col items-center justify-center text-center bg-gray-50 rounded-b-lg">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-blue-100 opacity-75 animate-ping"></div>
              <div className="relative flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
                <FiActivity className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Analyzing Session Data</h3>
            <p className="text-gray-600 max-w-md leading-relaxed">
              {analysisStatus.message || 'Processing your session data. This may take a moment...'}
            </p>
            <div className="mt-6 w-full max-w-xs bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full animate-pulse"></div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-gray-50 rounded-b-lg">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
              <FiBarChart2 className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Analysis Data</h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
              Click the button below to start analyzing user behavior data for the current session.
            </p>
            <div className="mt-6">
              <button
                onClick={analyzeBehavior}
                className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
              >
                <FiActivity className="-ml-1 mr-2 h-5 w-5" />
                Analyze Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Test component with interactive elements for demo purposes
const TestInteractions = () => (
  <div className="max-w-4xl mx-auto p-6 space-y-6">
    <h1 className="text-2xl font-bold">Test User Interactions</h1>
    
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      <h2 className="text-xl font-semibold">Test Elements</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-3">Buttons</h3>
          <div className="flex flex-wrap gap-4">
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              onClick={() => console.log('Primary button clicked')}
            >
              Primary Button
            </button>
            <button 
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              onClick={() => console.log('Secondary button clicked')}
            >
              Secondary Button
            </button>
            <button 
              className="px-4 py-2 text-red-600 hover:text-red-800 transition-colors"
              onClick={() => console.log('Text button clicked')}
            >
              Text Button
            </button>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-3">Form Elements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="test-input" className="block text-sm font-medium text-gray-700 mb-1">
                Text Input
              </label>
              <input
                id="test-input"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Type something..."
              />
            </div>
            
            <div>
              <label htmlFor="test-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Dropdown
              </label>
              <select 
                id="test-select"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input 
                id="test-checkbox" 
                type="checkbox" 
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="test-checkbox" className="ml-2 block text-sm text-gray-700">
                Check this box
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Radio Buttons</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="test-radio" 
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500" 
                    defaultChecked 
                  />
                  <span className="ml-2 text-sm text-gray-700">Option 1</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="test-radio" 
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="ml-2 text-sm text-gray-700">Option 2</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-3">Links</h3>
          <div className="space-x-4">
            <a 
              href="#" 
              className="text-blue-600 hover:underline"
              onClick={(e) => {
                e.preventDefault();
                console.log('Internal link clicked');
              }}
            >
              Internal Link
            </a>
            <a 
              href="https://example.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline"
              onClick={() => console.log('External link clicked')}
            >
              External Link (opens in new tab)
            </a>
          </div>
        </div>
      </div>
    </div>
    
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Test Scrolling</h2>
      <p className="mb-4">
        Scroll down to test scroll tracking. The behavior analysis will track how far you scroll on this page.
      </p>
      <div className="h-96 bg-gray-100 rounded flex items-center justify-center">
        <p className="text-gray-500">Scrollable area</p>
      </div>
    </div>
    
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Test Navigation</h2>
      <div className="space-y-4">
        <p>Click these links to test page navigation tracking:</p>
        <div className="flex flex-wrap gap-4">
          <a 
            href="/test-files/behavior/page1" 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            onClick={(e) => {
              e.preventDefault();
              console.log('Page 1 link clicked');
            }}
          >
            Page 1
          </a>
          <a 
            href="/test-files/behavior/page2" 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            onClick={(e) => {
              e.preventDefault();
              console.log('Page 2 link clicked');
            }}
          >
            Page 2
          </a>
          <a 
            href="/test-files/behavior/page3" 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            onClick={(e) => {
              e.preventDefault();
              console.log('Page 3 link clicked');
            }}
          >
            Page 3
          </a>
        </div>
      </div>
    </div>
  </div>
);

export default function BehaviorDashboardWrapper() {
  return (
    <div className="space-y-6">
      <BehaviorDashboard />
      <TestInteractions />
    </div>
  );
}

export { BehaviorDashboard };
