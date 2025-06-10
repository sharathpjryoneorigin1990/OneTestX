import { useState, useRef, useCallback, useEffect } from 'react';
import type { BehaviorEvent, SessionData } from '@/types/behavior';

const MAX_EVENTS = 1000; // Prevent memory issues
const SEND_INTERVAL = 30000; // 30 seconds
const DEBOUNCE_DELAY = 1000; // 1 second debounce for rapid events

export interface Session {
  id: string;
  url: string;
  events: BehaviorEvent[];
  startTime: number;
  endTime: number | null;
  status?: 'active' | 'completed';
  eventCount?: number;
  metadata?: Record<string, any>;
  [key: string]: any; // Allow additional properties
}

interface UseEnhancedBehaviorTrackingReturn {
  // Core tracking functions
  trackEvent: (type: string, data?: Partial<BehaviorEvent>) => void;
  trackPageView: (page: string) => void;
  
  // Session management
  startNewSession: (url: string, metadata?: Record<string, any>) => string;
  endSession: (sessionId: string) => void;
  getSession: (sessionId: string) => Session | undefined;
  getCurrentSession: () => Session | undefined;
  
  // Data management
  sendBehaviorData: (customEvents?: BehaviorEvent[], customSessionId?: string) => Promise<boolean>;
  clearEvents: () => void;
  
  // State
  currentSessionId: string | null;
  totalEvents: number;
  
  // Additional methods
  getSessions: () => Record<string, Session>;
  getActiveSessions: () => Session[];
}

export function useEnhancedBehaviorTracking(): UseEnhancedBehaviorTrackingReturn {
  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const events = useRef<BehaviorEvent[]>([]);
  const lastSentTime = useRef(0);
  const pageLoadTime = useRef(performance.now());
  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSendingRef = useRef(false);

  // Generate a unique session ID
  const generateSessionId = useCallback((): string => {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Start a new tracking session
  const startNewSession = useCallback((url: string, metadata: Record<string, any> = {}): string => {
    const sessionId = generateSessionId();
    const session: Session = {
      id: sessionId,
      url,
      events: [],
      startTime: Date.now(),
      endTime: null,
      status: 'active',
      eventCount: 0,
      metadata
    };

    setSessions(prev => ({
      ...prev,
      [sessionId]: session
    }));
    
    setCurrentSessionId(sessionId);
    events.current = [];
    
    // Log session start
    console.log(`[Analytics] Started new session: ${sessionId}`, { url, metadata });
    
    return sessionId;
  }, [generateSessionId]);

  // End a tracking session
  const endSession = useCallback((sessionId: string): void => {
    setSessions(prev => {
      const session = prev[sessionId];
      if (!session) return prev;

      return {
        ...prev,
        [sessionId]: {
          ...session,
          endTime: Date.now(),
          status: 'completed'
        }
      };
    });

    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  }, [currentSessionId]);

  // Get a session by ID
  const getSession = useCallback((sessionId: string): Session | undefined => {
    return sessions[sessionId];
  }, [sessions]);

  // Get current session
  const getCurrentSession = useCallback((): Session | undefined => {
    return currentSessionId ? sessions[currentSessionId] : undefined;
  }, [currentSessionId, sessions]);
  
  // Get all sessions
  const getSessions = useCallback((): Record<string, Session> => {
    return sessions;
  }, [sessions]);
  
  // Get active sessions
  const getActiveSessions = useCallback((): Session[] => {
    return Object.values(sessions).filter(session => !session.endTime);
  }, [sessions]);

  // Track a generic event
  const trackEvent = useCallback((type: string, data: Partial<BehaviorEvent> = {}): void => {
    if (events.current.length >= MAX_EVENTS) {
      console.warn('Maximum event limit reached. Some events may be lost.');
      return;
    }

    const event: BehaviorEvent = {
      type,
      timestamp: Date.now(),
      url: window.location.href,
      ...data,
    };

    events.current.push(event);
    
    // Update session events without causing unnecessary re-renders
    if (currentSessionId) {
      setSessions(prev => {
        const currentSession = prev[currentSessionId];
        if (!currentSession) return prev;
        
        return {
          ...prev,
          [currentSessionId]: {
            ...currentSession,
            events: [...currentSession.events, event],
            eventCount: (currentSession.eventCount || 0) + 1
          }
        };
      });
    }

    // Clear any pending send
    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current);
    }

    // Schedule a batched send with debounce
    sendTimeoutRef.current = setTimeout(() => {
      const now = Date.now();
      if (now - lastSentTime.current > SEND_INTERVAL || events.current.length >= 10) {
        sendBehaviorData();
      }
    }, DEBOUNCE_DELAY);
  }, [currentSessionId]); // Removed sessions from dependencies to prevent loop

  // Track a page view
  const trackPageView = useCallback((page: string): void => {
    trackEvent('pageview', {
      url: page,
      metadata: {
        referrer: document.referrer,
        title: document.title
      }
    });
  }, [trackEvent]);

  // Helper function to split array into chunks
  const chunkArray = <T,>(array: T[], chunkSize: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  };

  // Send batched events to the server
  const sendBehaviorData = useCallback(async (
    customEvents?: BehaviorEvent[], 
    customSessionId?: string,
    isRetry = false
  ): Promise<boolean> => {
    // Prevent multiple concurrent sends unless it's a retry
    if (isSendingRef.current && !isRetry) return false;
    
    const eventsToSend = customEvents || [...events.current];
    const sessionId = customSessionId || currentSessionId;
    
    if (eventsToSend.length === 0) return true;
    
    // Ensure we have a valid session ID
    if (!sessionId) {
      console.warn('Cannot send behavior data: No active session');
      return false;
    }
    
    isSendingRef.current = true;
    
    // Clear the events after sending if not using custom events
    if (!customEvents) {
      events.current = [];
    }
    
    lastSentTime.current = Date.now();

    try {
      // Split events into smaller chunks to avoid payload too large errors
      const MAX_BATCH_SIZE = 50; // Adjust this based on your needs
      const eventChunks = chunkArray(eventsToSend, MAX_BATCH_SIZE);
      
      let success = true;
      
      // Process chunks sequentially
      for (const [index, chunk] of eventChunks.entries()) {
        const isLastChunk = index === eventChunks.length - 1;
        const chunkPayload = {
          events: chunk,
          sessionId,
          timestamp: new Date().toISOString(),
          batchSize: chunk.length,
          totalBatches: eventChunks.length,
          currentBatch: index + 1,
          url: window.location.href
        };
        
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/api/behavior-analysis`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(chunkPayload),
          });
          
          if (!response.ok) {
            console.error(`Failed to send batch ${index + 1}/${eventChunks.length}`);
            success = false;
            // If this is not the last chunk, stop processing further chunks
            if (!isLastChunk) break;
          } else {
            console.log(`Successfully sent batch ${index + 1}/${eventChunks.length}`);
          }
        } catch (error) {
          console.error(`Error sending batch ${index + 1}/${eventChunks.length}:`, error);
          success = false;
          // If this is not the last chunk, stop processing further chunks
          if (!isLastChunk) break;
        }
      }
      
      if (!success) {
        console.error('Failed to send one or more batches of behavior data');
        // Re-add events if sending failed and they're not custom events
        if (!customEvents) {
          events.current = [...eventsToSend, ...events.current];
        }
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error sending behavior data:', error);
      if (!customEvents) {
        events.current = [...eventsToSend, ...events.current];
      }
      return false;
    } finally {
      isSendingRef.current = false;
    }
  }, [currentSessionId]);

  // Clear all tracked events
  const clearEvents = useCallback((): void => {
    events.current = [];
  }, []);

  // Set up event listeners for automatic tracking
  useEffect(() => {
    // Track initial page view
    trackPageView(window.location.pathname);

    // Set up beforeunload to send remaining events
    const handleBeforeUnload = () => {
      if (events.current.length > 0) {
        // Use sendBeacon for reliability during page unload
        const data = JSON.stringify({
          events: events.current,
          sessionId: currentSessionId,
          isUnload: true,
          timestamp: new Date().toISOString(),
        });
        
        navigator.sendBeacon('/api/behavior-analysis', data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentSessionId, trackPageView]);

  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
      }
      
      // Send any remaining events before unmounting
      if (events.current.length > 0) {
        sendBehaviorData();
      }
    };
  }, [sendBehaviorData]);

  return {
    // Core tracking
    trackEvent,
    trackPageView,
    
    // Session management
    startNewSession,
    endSession,
    getSession,
    getCurrentSession,
    getSessions,
    getActiveSessions,
    
    // Data management
    sendBehaviorData,
    clearEvents,
    
    // State
    currentSessionId,
    totalEvents: events.current.length,
  };
}

export default useEnhancedBehaviorTracking;
