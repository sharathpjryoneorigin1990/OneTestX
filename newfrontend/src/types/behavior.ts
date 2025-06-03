export interface BehaviorEvent {
  type: string;
  timestamp: number;
  element?: string;
  selector?: string;
  position?: { x: number; y: number };
  url?: string;
  metadata?: Record<string, any>;
  scrollDepth?: number;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface BehaviorAnalysisResult {
  eventTypes: string[];
  eventCounts: Record<string, number>;
  sessionDuration: number;
  clickHeatmap: {
    elementClicks: Record<string, number>;
    positionClicks: Array<{x: number; y: number; count: number}>;
  };
  navigationFlow: Array<{
    from: string;
    to: string;
    count: number;
  }>;
  engagement: {
    score: number;
    activeTime: number;
    scrollDepth: number;
    pagesPerSession?: number;
    bounceRate?: number;
    ctr?: number;
  };
  anomalies: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    timestamp?: number;
    message?: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high';
  }>;
  sessionStart: number;
  sessionEnd: number;
  pagesVisited: string[];
  timeOnPage: Record<string, number>;
  
  // Add any additional properties that might be used in the dashboard
  [key: string]: any;
}

export interface Session {
  id: string;
  url: string;
  events: BehaviorEvent[];
  startTime: number;
  endTime: number | null;
  status?: 'active' | 'completed';
  eventCount?: number;
  metadata?: Record<string, any>;
}

export interface SessionData {
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  sessionStart: number;
  sessionEnd: number;
  pageLoadTime?: number;
  referrer?: string;
  language?: string;
  timezone?: string;
  screenResolution?: {
    width: number;
    height: number;
  };
  deviceType?: 'desktop' | 'tablet' | 'mobile';
}
