import express from 'express';
const router = express.Router();

// In-memory storage for behavior data (in a real app, use a database)
const behaviorSessions = new Map();

// Store behavior data
router.post('/behavior-analysis', (req, res) => {
  try {
    const { events, sessionId, isUnload } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid events data' });
    }

    // Get or create session
    if (!behaviorSessions.has(sessionId)) {
      behaviorSessions.set(sessionId, {
        id: sessionId,
        events: [],
        startTime: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }

    const session = behaviorSessions.get(sessionId);
    session.events = [...session.events, ...events];
    session.lastUpdated = new Date().toISOString();

    // If this is a page unload, mark the session as ended
    if (isUnload) {
      session.endTime = new Date().toISOString();
    }

    console.log(`Processed ${events.length} events for session ${sessionId}`);
    res.status(200).json({ success: true, sessionId });
  } catch (error) {
    console.error('Error processing behavior data:', error);
    res.status(500).json({ error: 'Failed to process behavior data' });
  }
});

// Analyze behavior data
router.post('/analyze-behavior', (req, res) => {
  try {
    const { sessionId, events: eventData } = req.body;
    
    if (!sessionId && !eventData) {
      return res.status(400).json({ error: 'Session ID or events data is required' });
    }

    let sessionEvents = [];
    
    if (sessionId) {
      const session = behaviorSessions.get(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      sessionEvents = session.events;
    } else if (eventData && Array.isArray(eventData)) {
      sessionEvents = eventData;
    }

    if (sessionEvents.length === 0) {
      return res.status(400).json({ error: 'No events to analyze' });
    }

    // Simple analysis (extend this with more sophisticated analysis)
    const eventTypes = [...new Set(sessionEvents.map(e => e.type))];
    const eventCounts = sessionEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});

    // Calculate session duration if we have start and end times
    const timestamps = sessionEvents.map(e => e.timestamp).filter(Boolean).sort();
    const sessionDuration = timestamps.length > 1 
      ? (timestamps[timestamps.length - 1] - timestamps[0]) / 1000 
      : 0;

    // Generate mock analysis (replace with real analysis)
    const analysis = {
      eventTypes,
      eventCounts,
      sessionDuration,
      totalEvents: sessionEvents.length,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(analysis);
  } catch (error) {
    console.error('Error analyzing behavior data:', error);
    res.status(500).json({ error: 'Failed to analyze behavior data' });
  }
});

// Get session data
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = behaviorSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.status(200).json(session);
  } catch (error) {
    console.error('Error getting session data:', error);
    res.status(500).json({ error: 'Failed to get session data' });
  }
});

export default router;
