import { useEffect, useRef, useCallback, useState } from 'react';
import { BehaviorEvent } from '@/types/behavior';

const MAX_EVENTS = 1000; // Prevent memory issues
const SEND_INTERVAL = 30000; // 30 seconds

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
  const sessionStart = useRef(Date.now());
  const lastSentTime = useRef(0);
  const pageLoadTime = useRef(performance.now());
  const lastPage = useRef<string>('');
  const pageVisits = useRef<Record<string, { start: number; end?: number }>>({});

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
    return sessionId;
  }, [generateSessionId]);

  // End a tracking session
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
    }
  }, [currentSessionId]);

  // Get events for a session
  const getSessionEvents = useCallback((sessionId: string): BehaviorEvent[] => {
    return sessions[sessionId]?.events || [];
  }, [sessions]);

  // Get all sessions
  const getAllSessions = useCallback((): Session[] => {
    return Object.values(sessions);
  }, [sessions]);

  // Track an event
  const trackEvent = useCallback((type: string, data: Partial<BehaviorEvent> = {}) => {
    if (events.current.length >= MAX_EVENTS) {
      console.warn('Maximum event limit reached. Some events may be lost.');
      return;
    }

    const event: BehaviorEvent = {
      type,
      timestamp: Date.now(),
      url: window.location.href,
      pageTitle: document.title,
      sessionId: currentSessionId || 'unknown',
      ...data,
    };

    events.current.push(event);

    // Add to current session if it exists
    if (currentSessionId && sessions[currentSessionId]) {
      setSessions(prev => ({
        ...prev,
        [currentSessionId]: {
          ...prev[currentSessionId],
          events: [...prev[currentSessionId].events, event]
        }
      }));
    }

    // Throttle sending data
    const now = Date.now();
    if (now - lastSentTime.current > SEND_INTERVAL) {
      sendBehaviorData();
    }
  }, [currentSessionId, sessions]);

  // Send batched events to the server
  const sendBehaviorData = useCallback(async (customEvents?: BehaviorEvent[], sessionId?: string) => {
    const eventsToSend = customEvents || [...events.current];
    
    if (eventsToSend.length === 0) return true;
    
    if (!customEvents) {
      events.current = []; // Clear the events after sending if not using custom events
    }
    
    lastSentTime.current = Date.now();

    try {
      const response = await fetch('/api/behavior-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: eventsToSend,
          sessionId: sessionId || currentSessionId || 'default-session',
          timestamp: new Date().toISOString(),
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
  }, [currentSessionId]);

  // Get a CSS selector for an element
  const getSelector = useCallback((element: HTMLElement | null): string => {
    if (!element) return 'unknown';
    
    // Try to get ID first
    if (element.id) {
      return `#${element.id}`;
    }
    
    // Then try class names
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(/\s+/).filter(c => c.length > 0);
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
      }
    }
    
    // Try to find a parent with an ID
    let parent = element.parentElement;
    let path = [element.tagName.toLowerCase()];
    
    while (parent && parent !== document.body) {
      if (parent.id) {
        return `${parent.id} > ${path.join(' > ')}`;
      }
      path.unshift(parent.tagName.toLowerCase());
      parent = parent.parentElement;
    }
    
    return element.tagName.toLowerCase();
  }, []);

  // Track an event
  const trackEvent = useCallback((type: string, data: Partial<BehaviorEvent> = {}) => {
    if (events.current.length >= MAX_EVENTS) {
      console.warn('Maximum event limit reached. Some events may be lost.');
      return;
    }

    const event: BehaviorEvent = {
      type,
      timestamp: Date.now(),
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      ...data
    };

    events.current.push(event);
    
    // If we have a lot of events, send them immediately
    if (events.current.length >= MAX_EVENTS * 0.8) {
      sendBehaviorData();
    }
  }, []);

  // Track page view
  const trackPageView = useCallback(() => {
    const now = Date.now();
    const currentUrl = window.location.href.split('?')[0]; // Remove query params
    
    // Record time spent on previous page
    if (lastPage.current && pageVisits.current[lastPage.current]) {
      pageVisits.current[lastPage.current].end = now - 100; // Small adjustment for navigation time
    }
    
    // Record new page view
    if (!pageVisits.current[currentUrl]) {
      pageVisits.current[currentUrl] = { start: now };
    } else {
      // If we've been here before, update the start time
      pageVisits.current[currentUrl].start = now;
    }
    
    lastPage.current = currentUrl;
    trackEvent('pageview', { url: currentUrl });
    
    // Track scroll after page load
    setTimeout(() => {
      const scrollDepth = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      trackEvent('scroll', { scrollDepth });
    }, 1000);
  }, [trackEvent]);

  // Handle click events
  const handleClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    trackEvent('click', {
      element: target.tagName,
      selector: getSelector(target),
      position: { x: e.clientX, y: e.clientY }
    });
  }, [getSelector, trackEvent]);

  // Handle scroll events with debounce
  const handleScroll = useCallback(() => {
    const now = Date.now();
    const scrollDepth = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    
    // Only track if user scrolled at least 5% or 30 seconds have passed since last scroll event
    const lastScrollEvent = events.current
      .filter(e => e.type === 'scroll')
      .pop();
      
    const lastScrollDepth = lastScrollEvent?.scrollDepth || 0;
    const timeSinceLastScroll = lastScrollEvent ? now - lastScrollEvent.timestamp : Infinity;
    
    if (Math.abs(scrollDepth - lastScrollDepth) > 5 || timeSinceLastScroll > 30000) {
      trackEvent('scroll', { scrollDepth });
    }
  }, [trackEvent]);

  // Handle form interactions
  const handleFormInteraction = useCallback((e: Event) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      trackEvent('form_interaction', {
        element: target.tagName,
        selector: getSelector(target as HTMLElement),
        value: target.value,
        name: target.name || target.id || 'unnamed'
      });
    }
  }, [getSelector, trackEvent]);

  // Send behavior data to server
  const sendBehaviorData = useCallback(async (): Promise<void> => {
    if (events.current.length === 0) return;
    
    const now = Date.now();
    
    // Don't send too frequently
    if (now - lastSentTime.current < 5000) {
      return;
    }
    
    const eventsToSend = [...events.current];
    events.current = [];
    lastSentTime.current = now;
    
    try {
      const sessionData: SessionData = {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        sessionStart: sessionStart.current,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: eventsToSend,
          sessionData: getSessionData(),
          sessionId: sessionId || currentSessionId.current,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.error('Failed to send behavior data');
        // Re-add events if sending failed and they're not custom events
        if (!customEvents) {
          events.current = [...eventsToSend, ...events.current];
        }
      }
      
      return response.ok;
    } catch (error) {
      console.error('Error sending behavior data:', error);
      if (!customEvents) {
        events.current = [...eventsToSend, ...events.current];
      }
      return false;
    }
  }, [getSessionData, currentSessionId]);

  // Set up event listeners
  useEffect(() => {
    // Initial page view
    trackPageView();
    
    // Set up event listeners
    window.addEventListener('click', handleClick, { capture: true });
    window.addEventListener('popstate', trackPageView);
    window.addEventListener('pushstate', trackPageView);
    window.addEventListener('replacestate', trackPageView);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Form interactions
    document.addEventListener('input', handleFormInteraction);
    document.addEventListener('change', handleFormInteraction);
    document.addEventListener('submit', (e) => {
      const target = e.target as HTMLFormElement;
      trackEvent('form_submit', {
        formId: target.id || target.name || 'unnamed',
        formAction: target.action || 'unknown',
        formMethod: target.method || 'get'
      });
    });
    
    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        trackEvent('page_visible');
      } else {
        trackEvent('page_hidden');
        // Send data when user leaves the page
        sendBehaviorData().catch(console.error);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up periodic sending
    const intervalId = setInterval(sendBehaviorData, SEND_INTERVAL);
    
    // Clean up
    return () => {
      window.removeEventListener('click', handleClick, { capture: true });
      window.removeEventListener('popstate', trackPageView);
      window.removeEventListener('pushstate', trackPageView);
      window.removeEventListener('replacestate', trackPageView);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('input', handleFormInteraction);
      document.removeEventListener('change', handleFormInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
      
      // Send any remaining events
      if (events.current.length > 0) {
        sendBehaviorData().catch(console.error);
      }
    };
  }, [handleClick, handleFormInteraction, handleScroll, sendBehaviorData, trackPageView]);

  return { trackEvent, sendBehaviorData };
}
