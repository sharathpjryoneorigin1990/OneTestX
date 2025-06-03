interface MCPEvent {
  type: 'MCP_EVENT';
  payload: {
    action: string;
    selector: string;
    value?: any;
    timestamp: number;
  };
}

export const startRecording = async (url: string): Promise<{ success: boolean; sessionId?: string; error?: string }> => {
  try {
    const response = await fetch('/api/mcp/start-recording', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start recording');
    }

    return await response.json();
  } catch (error) {
    console.error('Error starting recording:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to start recording' 
    };
  }
};

export const stopRecording = async (): Promise<{ success: boolean; steps?: any[]; error?: string }> => {
  try {
    const response = await fetch('/api/mcp/stop-recording', {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to stop recording');
    }

    return await response.json();
  } catch (error) {
    console.error('Error stopping recording:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to stop recording' 
    };
  }
};

export const recordEvent = (action: string, selector: string, value?: any) => {
  const event: MCPEvent = {
    type: 'MCP_EVENT',
    payload: {
      action,
      selector,
      value,
      timestamp: Date.now(),
    },
  };

  // Send the event to the parent window (our application)
  window.parent.postMessage(event, window.location.origin);
};
