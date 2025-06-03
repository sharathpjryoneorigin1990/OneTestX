import { NextResponse } from 'next/server';
import { BehaviorEvent, BehaviorAnalysisResult, SessionData } from '@/types/behavior';

// In-memory storage for demo purposes
// In a production app, you'd want to use a database
const behaviorData: {
  events: BehaviorEvent[];
  sessions: Record<string, SessionData>;
  analyses: Record<string, BehaviorAnalysisResult>;
} = {
  events: [],
  sessions: {},
  analyses: {}
};

export async function POST(request: Request) {
  try {
    const { events, sessionData, pageVisits } = await request.json();
    
    // Validate input
    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid input: events array is required' },
        { status: 400 }
      );
    }

    // Store the raw events
    behaviorData.events = [...behaviorData.events, ...events];
    
    // Store or update session data
    if (sessionData) {
      const sessionId = sessionData.sessionStart.toString();
      behaviorData.sessions[sessionId] = {
        ...(behaviorData.sessions[sessionId] || {}),
        ...sessionData,
        sessionEnd: Date.now()
      };
      
      // Update page visit times
      if (pageVisits) {
        Object.entries(pageVisits).forEach(([url, visit]: [string, any]) => {
          if (visit.start && visit.end) {
            behaviorData.sessions[sessionId] = {
              ...behaviorData.sessions[sessionId],
              pageVisits: {
                ...(behaviorData.sessions[sessionId]?.pageVisits || {}),
                [url]: {
                  start: visit.start,
                  end: visit.end,
                  duration: visit.end - visit.start
                }
              }
            };
          }
        });
      }
      
      // Analyze the session
      const analysis = await analyzeUserBehavior(events, sessionData);
      behaviorData.analyses[sessionId] = analysis;
      
      return NextResponse.json({
        success: true,
        analysis,
        version: '1.0.0',
        analyzedAt: new Date().toISOString()
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing behavior data:', error);
    return NextResponse.json(
      { error: 'Failed to process behavior data' },
      { status: 500 }
    );
  }
}

// Get latest analysis
export async function GET() {
  try {
    const latestSessionId = Object.keys(behaviorData.sessions).sort().pop();
    if (!latestSessionId) {
      return NextResponse.json(
        { error: 'No session data available' },
        { status: 404 }
      );
    }
    
    const analysis = behaviorData.analyses[latestSessionId];
    if (!analysis) {
      return NextResponse.json(
        { error: 'No analysis available for the latest session' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      analysis,
      version: '1.0.0',
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error retrieving behavior analysis:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve behavior analysis' },
      { status: 500 }
    );
  }
}

// Analysis function
async function analyzeUserBehavior(
  events: BehaviorEvent[],
  sessionData: SessionData
): Promise<BehaviorAnalysisResult> {
  // 1. Basic event analysis
  const eventTypes = new Set(events.map(e => e.type));
  const eventCounts = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 2. Session duration
  const sessionDuration = (sessionData.sessionEnd - sessionData.sessionStart) / 1000; // in seconds
  
  // 3. Click analysis
  const clickEvents = events.filter(e => e.type === 'click');
  const clickHeatmap = analyzeClickPositions(clickEvents);
  
  // 4. Navigation flow
  const navigationFlow = analyzeNavigationFlow(events);
  
  // 5. Engagement metrics
  const engagement = calculateEngagement(events, sessionDuration);
  
  // 6. Anomaly detection
  const anomalies = detectAnomalies(events, sessionData);
  
  // 7. Pages visited
  const pageViewEvents = events.filter(e => e.type === 'pageview');
  const pagesVisited = [...new Set(pageViewEvents.map(e => e.url))].filter(Boolean) as string[];
  
  // 8. Time on page
  const timeOnPage: Record<string, number> = {};
  for (let i = 0; i < pageViewEvents.length - 1; i++) {
    const current = pageViewEvents[i];
    const next = pageViewEvents[i + 1];
    if (current.url && next.timestamp > current.timestamp) {
      timeOnPage[current.url] = (timeOnPage[current.url] || 0) + 
        (next.timestamp - current.timestamp) / 1000; // in seconds
    }
  }

  return {
    eventTypes: Array.from(eventTypes),
    eventCounts,
    sessionDuration,
    clickHeatmap,
    navigationFlow,
    engagement,
    anomalies,
    recommendations: generateRecommendations(engagement, anomalies, eventCounts, timeOnPage),
    sessionStart: sessionData.sessionStart,
    sessionEnd: sessionData.sessionEnd,
    pagesVisited,
    timeOnPage
  };
}

// Helper functions
function analyzeClickPositions(clickEvents: BehaviorEvent[]) {
  const elementClicks: Record<string, number> = {};
  const positionClicks: {x: number, y: number, count: number}[] = [];
  
  clickEvents.forEach(click => {
    // Count clicks per element
    const selector = click.selector || 'unknown';
    elementClicks[selector] = (elementClicks[selector] || 0) + 1;
    
    // Track click positions if available
    if (click.position) {
      const existing = positionClicks.find(
        p => Math.abs(p.x - click.position!.x) < 10 && 
             Math.abs(p.y - click.position!.y) < 10
      );
      
      if (existing) {
        existing.count++;
      } else {
        positionClicks.push({
          x: click.position.x,
          y: click.position.y,
          count: 1
        });
      }
    }
  });
  
  return { elementClicks, positionClicks };
}

function analyzeNavigationFlow(events: BehaviorEvent[]) {
  const pageViewEvents = events.filter(e => e.type === 'pageview');
  const flow: Record<string, {to: string, count: number}[]> = {};
  
  for (let i = 0; i < pageViewEvents.length - 1; i++) {
    const from = pageViewEvents[i].url || 'unknown';
    const to = pageViewEvents[i + 1].url || 'unknown';
    
    if (!flow[from]) {
      flow[from] = [];
    }
    
    const existing = flow[from].find(item => item.to === to);
    if (existing) {
      existing.count++;
    } else {
      flow[from].push({ to, count: 1 });
    }
  }
  
  // Convert to array format
  const result: Array<{from: string, to: string, count: number}> = [];
  Object.entries(flow).forEach(([from, transitions]) => {
    transitions.forEach(transition => {
      result.push({
        from,
        to: transition.to,
        count: transition.count
      });
    });
  });
  
  return result;
}

function calculateEngagement(events: BehaviorEvent[], sessionDuration: number) {
  // Engagement score based on event types and frequency
  const eventWeights: Record<string, number> = {
    click: 1,
    scroll: 0.5,
    input: 2,
    change: 1.5,
    submit: 3,
    pageview: 0.2
  };
  
  const weightedEvents = events.reduce((sum, event) => {
    return sum + (eventWeights[event.type] || 0.1);
  }, 0);
  
  // Normalize by session duration (events per minute)
  const eventsPerMinute = (events.length / Math.max(1, sessionDuration / 60));
  
  // Calculate score (0-100)
  let score = Math.min(100, (weightedEvents / Math.max(1, sessionDuration / 60)) * 10);
  
  // Consider scroll depth
  const scrollEvents = events.filter(e => e.type === 'scroll' && e.scrollDepth !== undefined);
  const avgScrollDepth = scrollEvents.length > 0 
    ? scrollEvents.reduce((sum, e) => sum + (e.scrollDepth || 0), 0) / scrollEvents.length
    : 0;
    
  // Adjust score based on scroll depth (up to 20% of the score)
  score = score * 0.8 + (score * 0.2 * (avgScrollDepth / 100));
  
  return {
    score: Math.round(score * 10) / 10, // Round to 1 decimal place
    activeTime: sessionDuration,
    scrollDepth: Math.round(avgScrollDepth * 10) / 10 // Average scroll depth in %
  };
}

function detectAnomalies(events: BehaviorEvent[], sessionData: SessionData) {
  const anomalies: Array<{type: string, description: string, severity: 'low' | 'medium' | 'high'}> = [];
  
  // 1. Rapid clicks (potential rage clicking)
  const clickTimestamps = events
    .filter(e => e.type === 'click')
    .map(e => e.timestamp);
    
  for (let i = 2; i < clickTimestamps.length; i++) {
    const timeDiff = clickTimestamps[i] - clickTimestamps[i - 2]; // Check 3 clicks
    if (timeDiff < 1000) { // 3 clicks in less than 1 second
      anomalies.push({
        type: 'Rapid Clicks',
        description: 'User clicked rapidly in a short period, which may indicate frustration or UI issues.',
        severity: 'medium'
      });
      break;
    }
  }
  
  // 2. Long session with few interactions
  const sessionDuration = (sessionData.sessionEnd - sessionData.sessionStart) / 1000; // in seconds
  if (sessionDuration > 300 && events.length < 5) { // 5+ minutes with < 5 events
    anomalies.push({
      type: 'Low Engagement',
      description: 'Long session with very few interactions. The user may be confused or the page may be unresponsive.',
      severity: 'low'
    });
  }
  
  // 3. High scroll depth but no clicks
  const scrollEvents = events.filter(e => e.type === 'scroll');
  const lastScroll = scrollEvents[scrollEvents.length - 1] as (BehaviorEvent & { scrollDepth?: number }) | undefined;
  
  if (lastScroll && lastScroll.scrollDepth && lastScroll.scrollDepth > 80) {
    const clicksAfterDeepScroll = events.some(e => 
      e.type === 'click' && 
      e.timestamp > lastScroll.timestamp
    );
    
    if (!clicksAfterDeepScroll) {
      anomalies.push({
        type: 'Scrolled Far Without Interaction',
        description: 'User scrolled to the bottom of the page but didn\'t interact with any elements.',
        severity: 'low'
      });
    }
  }
  
  // 4. Form abandonment
  const formStarts = events.filter(e => 
    e.type === 'focus' && 
    (e.element === 'INPUT' || e.element === 'TEXTAREA' || e.element === 'SELECT')
  ).length;
  
  const formSubmits = events.filter(e => e.type === 'submit').length;
  
  if (formStarts > 0 && formSubmits === 0 && events.some(e => e.type === 'blur')) {
    anomalies.push({
      type: 'Form Abandonment',
      description: 'User started filling out a form but did not submit it.',
      severity: 'medium'
    });
  }
  
  return anomalies;
}

function generateRecommendations(
  engagement: { score: number; activeTime: number; scrollDepth: number },
  anomalies: Array<{type: string, severity: string}>,
  eventCounts: Record<string, number>,
  timeOnPage: Record<string, number>
): string[] {
  const recommendations: string[] = [];
  
  // Engagement-based recommendations
  if (engagement.score < 30) {
    recommendations.push(
      'Consider improving content engagement with more interactive elements or clearer calls-to-action.'
    );
  }
  
  // Anomaly-based recommendations
  if (anomalies.some(a => a.type === 'Rapid Clicks')) {
    recommendations.push(
      'Users are clicking rapidly in certain areas. Check if those elements are working as expected.'
    );
  }
  
  if (anomalies.some(a => a.type === 'Form Abandonment')) {
    recommendations.push(
      'Users are starting but not completing forms. Consider simplifying the form or breaking it into smaller steps.'
    );
  }
  
  // Scroll depth analysis
  if (engagement.scrollDepth < 40) {
    recommendations.push(
      'Most users aren\'t scrolling far down the page. Consider moving important content higher or making the page more engaging.'
    );
  }
  
  // Page-specific recommendations
  const highTimePages = Object.entries(timeOnPage)
    .filter(([_, time]) => time > 120) // More than 2 minutes
    .sort((a, b) => b[1] - a[1]);
    
  if (highTimePages.length > 0) {
    recommendations.push(
      `Users are spending a long time on ${highTimePages[0][0]}. Consider if the content is clear and the next steps are obvious.`
    );
  }
  
  // Event-based recommendations
  if (eventCounts['error'] > 0) {
    recommendations.push(
      'Errors were detected during the session. Review and fix any JavaScript or API errors.'
    );
  }
  
  // If no specific recommendations, provide general ones
  if (recommendations.length === 0) {
    recommendations.push(
      'User engagement appears normal. Consider A/B testing different layouts or content to improve conversion rates.'
    );
  }
  
  return recommendations.slice(0, 5); // Return top 5 recommendations
}
