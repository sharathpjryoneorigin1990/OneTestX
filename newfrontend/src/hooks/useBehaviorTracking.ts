import { useState, useRef, useCallback, useEffect } from 'react';
import { BehaviorEvent } from '@/types/behavior';

const MAX_EVENTS = 1000;
const SEND_INTERVAL = 30000;

interface Session {
  id: string;
  events: BehaviorEvent[];
  startTime: number;
  endTime: number | null;
  url: string;
}

interface UseBehaviorTrackingReturn {
  trackEvent: (type: string, data?: Partial<BehaviorEvent>) => void;
  sendBehaviorData: (customEvents?: BehaviorEvent[], sessionId?: string) => Promise<boolean>;
  startNewSession: (url: string) => string;
  endSession: (sessionId: string) => void;
  getSessionEvents: (sessionId: string) => BehaviorEvent[];
  getAllSessions: () => Session[];
  currentSessionId: string | null;
}

export function useBehaviorTracking(): UseBehaviorTrackingReturn {
  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const events = useRef<BehaviorEvent[]>([]);
  const sessionStart = useRef<number>(Date.now());
  const lastSentTime = useRef<number>(0);
  const pageLoadTime = useRef<number>(performance.now());
  const lastPage = useRef<string>('');
  const pageVisits = useRef<Record<string, { start: number; end?: number }>>({});
  const currentSessionIdRef = useRef<string | null>(null);

  // Generate a unique session ID
  const generateSessionId = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Start a new tracking session
  const startNewSession = useCallback((url: string): string => {
    const sessionId = generateSessionId();
    const newSession: Session = {
      id: sessionId,
      events: [],
      startTime: Date.now(),
      endTime: null,
      url
    };
    
    setSessions(prev => ({
      ...prev,
      [sessionId]: newSession
    }));
    
    setCurrentSessionId(sessionId);
    currentSessionIdRef.current = sessionId;
    sessionStart.current = Date.now();
    
    return sessionId;
  }, [generateSessionId]);

  // End the current session
  const endSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const session = prev[sessionId];
      if (!session) return prev;
      
      return {
        ...prev,
        [sessionId]: {
          ...session,
          endTime: Date.now()
        }
      };
    });
    
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
      currentSessionIdRef.current = null;
    }
  }, [currentSessionId]);

  // Get events for a specific session
  const getSessionEvents = useCallback((sessionId: string): BehaviorEvent[] => {
    return sessions[sessionId]?.events || [];
  }, [sessions]);

  // Get all sessions
  const getAllSessions = useCallback((): Session[] => {
    return Object.values(sessions);
  }, [sessions]);

  // Track a page view
  const trackPageView = useCallback(() => {
    const now = Date.now();
    const currentUrl = window.location.href;
    
    // End previous page visit
    if (lastPage.current) {
      const prevPage = pageVisits.current[lastPage.current];
      if (prevPage && !prevPage.end) {
        pageVisits.current[lastPage.current] = {
          ...prevPage,
          end: now
        };
      }
    }
    
    // Start new page visit
    lastPage.current = currentUrl;
    pageVisits.current[currentUrl] = {
      start: now,
      end: now
    };
    
    // Track the page view event
    events.current.push({
      type: 'page_view',
      timestamp: now,
      url: currentUrl,
      metadata: {
        referrer: document.referrer,
        title: document.title
      }
    });
    
    // Ensure we don't exceed max events
    if (events.current.length > MAX_EVENTS) {
      events.current = events.current.slice(-MAX_EVENTS);
    }
  }, []);

  // Track an event
  const trackEvent = useCallback((type: string, data: Partial<BehaviorEvent> = {}) => {
    const event: BehaviorEvent = {
      type,
      timestamp: Date.now(),
      ...data,
      metadata: {
        ...data.metadata,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };
    
    events.current.push(event);
    
    // Update current session if it exists
    if (currentSessionId) {
      setSessions(prev => {
        const session = prev[currentSessionId];
        if (!session) return prev;
        
        return {
          ...prev,
          [currentSessionId]: {
            ...session,
            events: [...session.events, event]
          }
        };
      });
    }
    
    // Ensure we don't exceed max events
    if (events.current.length > MAX_EVENTS) {
      events.current = events.current.slice(-MAX_EVENTS);
    }
    
    return event;
  }, [currentSessionId]);

  // Send behavior data to server
  const sendBehaviorData = useCallback(async (customEvents?: BehaviorEvent[], sessionId?: string): Promise<boolean> => {
    const now = Date.now();
    
    // Don't send too frequently
    if (now - lastSentTime.current < 5000) {
      return false;
    }
    
    const eventsToSend = customEvents || [...events.current];
    if (eventsToSend.length === 0) {
      return false;
    }
    
    // Clear events if not using custom events
    if (!customEvents) {
      events.current = [];
    }
    
    lastSentTime.current = now;
    
    try {
      const response = await fetch('/api/behavior/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: eventsToSend,
          sessionId: sessionId || currentSessionIdRef.current,
          timestamp: new Date().toISOString(),
          pageVisits: pageVisits.current,
          sessionStart: sessionStart.current,
          currentUrl: window.location.href,
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }),
      });

      if (!response.ok) {
        console.error('Failed to send behavior data');
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
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    // Initialize session
    const sessionId = startNewSession(window.location.href);
    trackPageView();
    
    // Set up periodic sending
    const intervalId = setInterval(() => {
      sendBehaviorData().catch(console.error);
    }, SEND_INTERVAL);
    
    // Set up visibility change handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        trackEvent('page_visible');
      } else {
        trackEvent('page_hidden');
        // Send data when user leaves the page
        sendBehaviorData().catch(console.error);
      }
    };
    
    // Set up event listeners
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      trackEvent('click', {
        element: target.tagName,
        selector: getSelector(target),
        position: { x: event.clientX, y: event.clientY }
      });
    };
    
    const handleScroll = () => {
      const scrollDepth = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      trackEvent('scroll', {
        scrollDepth,
        position: { x: window.scrollX, y: window.scrollY }
      });
    };
    
    const handleFormInteraction = (event: Event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      trackEvent('form_interaction', {
        element: target.tagName,
        type: event.type,
        name: target.name || target.id || 'unnamed',
        value: target.value,
        selector: getSelector(target)
      });
    };
    
    // Add event listeners
    window.addEventListener('click', handleClick, { capture: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('input', handleFormInteraction);
    document.addEventListener('change', handleFormInteraction);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('click', handleClick, { capture: true });
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('input', handleFormInteraction);
      document.removeEventListener('change', handleFormInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // End session on unmount
      if (sessionId) {
        endSession(sessionId);
      }
    };
  }, [endSession, sendBehaviorData, startNewSession, trackEvent, trackPageView]);
  
  // Helper function to generate CSS selector for an element
  const getSelector = (element: HTMLElement): string => {
    const parts: string[] = [];
    
    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let selector = element.nodeName.toLowerCase();
      
      if (element.id) {
        selector += `#${element.id}`;
        parts.unshift(selector);
        break;
      } else {
        let sibling = element.previousElementSibling;
        let siblingCount = 1;
        
        while (sibling) {
          if (sibling.nodeName === element.nodeName) {
            siblingCount++;
          }
          sibling = sibling.previousElementSibling;
        }
        
        if (siblingCount !== 1) {
          selector += `:nth-of-type(${siblingCount})`;
        }
      }
      
      parts.unshift(selector);
      
      if (element.parentElement) {
        element = element.parentElement;
      } else {
        break;
      }
    }
    
    return parts.join(' > ');
  };

  return {
    trackEvent,
    sendBehaviorData,
    startNewSession,
    endSession,
    getSessionEvents,
    getAllSessions,
    currentSessionId
  };
}
