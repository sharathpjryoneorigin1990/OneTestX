import axios from 'axios';

// Command types
interface Command {
  action: 'type' | 'click';
  text?: string;
  targetDescription: string;
  selectors: string[];
}

interface MCPResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class MCPClient {
  private static instance: MCPClient;
  private sessionId: string | null = null;
  private apiClient: any;

  private constructor() {
    this.apiClient = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  public static getInstance(): MCPClient {
    if (!MCPClient.instance) {
      MCPClient.instance = new MCPClient();
    }
    return MCPClient.instance;
  }

  async createSession(url: string): Promise<string> {
    try {
      const response = await this.apiClient.post('/api/mcp/session', { url });
      const sessionId = response.data.sessionId;
      if (!sessionId) {
        throw new Error('Session ID not provided in response');
      }
      this.sessionId = sessionId;
      return sessionId;
    } catch (error: unknown) {
      console.error('Error creating MCP session:', error);
      throw error instanceof Error ? error : new Error('Failed to create MCP session');
    }
  }

  async executeCommand(command: Command): Promise<MCPResponse> {
    if (!this.sessionId) {
      throw new Error('No active MCP session');
    }

    try {
      const response = await this.apiClient.post(`/api/mcp/session/${this.sessionId}/command`, {
        command
      });

      return response.data;
    } catch (error: unknown) {
      console.error('Error executing command:', error);
      throw error instanceof Error ? error : new Error('Failed to execute command');
    }
  }

  async closeSession(): Promise<void> {
    if (!this.sessionId) return;

    try {
      await this.apiClient.delete(`/api/mcp/session/${this.sessionId}`);
    } catch (error: unknown) {
      console.error('Error closing MCP session:', error);
    } finally {
      this.sessionId = null;
    }
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}
