import { BehaviorAnalysisResult } from '@/types/behavior';

export const mockBehaviorData: BehaviorAnalysisResult = {
  eventTypes: ['click', 'scroll', 'pageview', 'form_interaction'],
  eventCounts: {
    click: 42,
    scroll: 18,
    pageview: 5,
    form_interaction: 7
  },
  sessionDuration: 245, // seconds
  clickHeatmap: {
    elementClicks: {
      '.primary-button': 12,
      '.secondary-button': 8,
      '.nav-link': 15,
      '.cta-button': 7
    },
    positionClicks: [
      { x: 25, y: 300, count: 5 },
      { x: 50, y: 200, count: 3 },
      { x: 75, y: 400, count: 2 },
      { x: 60, y: 100, count: 1 },
      { x: 80, y: 250, count: 4 },
      { x: 30, y: 350, count: 2 },
      { x: 65, y: 180, count: 3 },
      { x: 45, y: 280, count: 6 },
      { x: 55, y: 320, count: 2 },
      { x: 70, y: 220, count: 5 }
    ]
  },
  navigationFlow: [
    { from: '', to: '/behavior-test', count: 1 },
    { from: '/behavior-test', to: '/behavior-test/page1', count: 1 },
    { from: '/behavior-test/page1', to: '/behavior-test/page2', count: 1 },
    { from: '/behavior-test/page2', to: '/behavior-test', count: 1 }
  ],
  engagement: {
    score: 0.72,
    activeTime: 185, // seconds
    scrollDepth: 68, // percentage
    pagesPerSession: 3.2,
    bounceRate: 0.15,
    ctr: 0.28
  },
  anomalies: [
    {
      type: 'Rapid Clicks',
      description: 'Detected multiple rapid clicks on the same element',
      severity: 'medium',
      timestamp: Date.now() - 1000 * 60 * 5 // 5 minutes ago
    },
    {
      type: 'Form Abandonment',
      description: 'User started but did not complete the contact form',
      severity: 'low',
      timestamp: Date.now() - 1000 * 60 * 10 // 10 minutes ago
    }
  ],
  recommendations: [
    {
      title: 'Improve Call-to-Action Buttons',
      description: 'Increase the size and contrast of primary action buttons to improve click-through rates.',
      priority: 'high'
    },
    {
      title: 'Optimize Page Load Speed',
      description: 'Reduce image sizes and enable compression to improve page load times on mobile devices.',
      priority: 'medium'
    },
    {
      title: 'Simplify Form Fields',
      description: 'Reduce the number of required fields in the contact form to decrease abandonment rates.',
      priority: 'low'
    }
  ],
  sessionStart: Date.now() - 1000 * 60 * 30, // 30 minutes ago
  sessionEnd: Date.now(),
  pagesVisited: [
    '/behavior-test',
    '/behavior-test/page1',
    '/behavior-test/page2',
    '/behavior-test'
  ],
  timeOnPage: {
    '/behavior-test': 85,
    '/behavior-test/page1': 70,
    '/behavior-test/page2': 90
  }
};

// Add a function to simulate live updates
export const simulateLiveUpdate = (): Promise<BehaviorAnalysisResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Create a deep copy of the mock data
      const updatedData = JSON.parse(JSON.stringify(mockBehaviorData));
      
      // Simulate some changes
      updatedData.eventCounts.click += Math.floor(Math.random() * 5);
      updatedData.eventCounts.scroll += Math.floor(Math.random() * 3);
      updatedData.engagement.scrollDepth = Math.min(100, updatedData.engagement.scrollDepth + Math.random() * 5);
      updatedData.engagement.score = Math.min(1, updatedData.engagement.score + (Math.random() * 0.1 - 0.05));
      
      // Add a new click position
      updatedData.clickHeatmap.positionClicks.push({
        x: 20 + Math.random() * 60,
        y: 100 + Math.random() * 400,
        count: 1 + Math.floor(Math.random() * 3)
      });
      
      resolve(updatedData);
    }, 5000); // Update every 5 seconds
  });
};
