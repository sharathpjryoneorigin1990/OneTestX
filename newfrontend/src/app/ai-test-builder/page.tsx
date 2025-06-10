/* eslint-disable @next/next/no-img-element */
// ^ Disabling specific lint rule for Next.js Image if not immediately used or for simple placeholders
'use client';

import React, { useState, useEffect } from 'react';
import { NewNavbar } from '@/components/layout/NewNavbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FiSend, FiArrowRight } from 'react-icons/fi';
import axios from 'axios';

// Command types
interface Command {
  action: 'type' | 'click';
  text?: string;
  targetDescription: string;
  selectors: string[];
}

// Message types
interface Message {
  sender: 'user' | 'bot';
  text: string;
}

// Initialize API client
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default function AiTestBuilderPage() {
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Type for message update function
  type MessageUpdater = (prevMessages: Message[]) => Message[];

  // Type for window message event
  type WindowMessageEvent = MessageEvent<string>;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        apiClient.delete(`/api/mcp/session/${sessionId}`)
          .catch(error => console.error('Error cleaning up MCP session:', error));
      }
    };
  }, [sessionId]);

  const handleLoadUrl = async () => {
    const trimmedUrl = targetUrl.trim();
    if (!trimmedUrl) return;

    try {
      setIsLoading(true);
      
      // Create new MCP session
      const response = await apiClient.post<{ sessionId: string }>('/api/mcp/session', { url: trimmedUrl });
      const newSessionId = response.data.sessionId;
      setSessionId(newSessionId);
      
      setChatMessages((prevMessages: Message[]) => [
        ...prevMessages,
        { sender: 'bot', text: 'MCP session created successfully. Ready to accept commands.' }
      ]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create MCP session';
      setChatMessages((prevMessages: Message[]) => [
        ...prevMessages,
        { sender: 'bot', text: errorMessage }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const trimmedInput = chatInput.trim();
    if (!trimmedInput) return;
    if (!sessionId) {
      setChatMessages((prevMessages: Message[]) => [
        ...prevMessages,
        { sender: 'bot', text: 'Please load a URL first to create an MCP session.' }
      ]);
      return;
    }

    const newUserMessage: Message = { sender: 'user', text: chatInput };
    setChatMessages((prevMessages: Message[]) => [
      ...prevMessages,
      newUserMessage
    ]);
    setIsLoading(true);

    try {
      // Parse command
      let structuredCommand: Command | null = null;
      const lowerChatInput = chatInput.toLowerCase();

      // Basic parsing for 'type [text] in [target]'
      const typeMatch = lowerChatInput.match(/^type\s+(.+?)\s+in\s+(.+)$/i);
      if (typeMatch) {
        const textToType = typeMatch[1];
        const targetDescription = typeMatch[2];
        structuredCommand = {
          action: 'type',
          text: textToType,
          targetDescription,
          selectors: [
            `input[name*="${targetDescription}" i]`,
            `input[type*="${targetDescription}" i]`,
            `textarea[name*="${targetDescription}" i]`,
            `[aria-label*="${targetDescription}" i]`,
            `[placeholder*="${targetDescription}" i]`,
            `#${targetDescription}` // if targetDescription is an ID
          ]
        };
      }

      // Basic parsing for 'click [target]'
      const clickMatch = lowerChatInput.match(/^click\s+(.+)$/i);
      if (!structuredCommand && clickMatch) {
        const targetDescription = clickMatch[1];
        structuredCommand = {
          action: 'click',
          targetDescription,
          selectors: [
            `button:contains("${targetDescription}" i)`,
            `a:contains("${targetDescription}" i)`,
            `input[type="button"][value*="${targetDescription}" i]`,
            `input[type="submit"][value*="${targetDescription}" i]`,
            `[role="button"][aria-label*="${targetDescription}" i]`,
            `[aria-label*="${targetDescription}" i]`,
            `#${targetDescription}` // if targetDescription is an ID
          ]
        };
      }

      if (structuredCommand) {
        console.log('[AI_TEST_BUILDER] Structured command:', JSON.stringify(structuredCommand, null, 2));

        // Adapt payload to be flatter for the backend
        const payload: any = {
          action: structuredCommand.action,
        };

        if (structuredCommand.selectors && structuredCommand.selectors.length > 0) {
          payload.selector = structuredCommand.selectors[0]; // Use the first selector for now
        }

        if (structuredCommand.action === 'type' && structuredCommand.text) {
          payload.value = structuredCommand.text;
        }
        // If other actions might have a 'value' (e.g. navigate), add them here
        // else if (structuredCommand.action === 'navigate' && structuredCommand.text) { 
        //   payload.value = structuredCommand.text; // Assuming navigate uses 'text' as URL
        // }

        console.log('[AI_TEST_BUILDER] Sending payload to backend:', JSON.stringify(payload, null, 2));

        // Execute command using MCP API
        const response = await apiClient.post<{ success: boolean; message: string }>(`/api/mcp/session/${sessionId}/command`, payload);

        const result = response.data;
        setChatMessages((prevMessages: Message[]) => [
          ...prevMessages,
          { sender: 'bot', text: result.message || 'Command executed successfully' }
        ]);
      } else {
        setChatMessages((prevMessages: Message[]) => [
          ...prevMessages,
          { sender: 'bot', text: `Sorry, I didn't understand that command. Try 'type [text] in [target]' or 'click [target]'.` }
        ]);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setChatMessages((prevMessages: Message[]) => [
        ...prevMessages,
        { sender: 'bot', text: `Error executing command: ${errorMessage}` }
      ]);
    } finally {
      setIsLoading(false);
      setChatInput('');
    }
  };

  // Effect for handling messages FROM the target window
  useEffect(() => {
    const handleMessage = (event: MessageEvent<string>) => {
      // Removed targetWindow check since we're no longer using it
      setChatMessages((prevMessages: Message[]) => {
        return [...prevMessages, { sender: 'bot', text: `Received message from target window: ${event.data}` }];
      });
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-800 text-gray-100">
      <NewNavbar />
      
      {/* Header Section */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
            AI Test Builder
          </h1>
          <p className="text-gray-400 mb-6">
            Interact with websites using natural language commands
          </p>
          <div className="flex gap-4">
            <Input
              placeholder="Enter URL..."
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleLoadUrl}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Load URL
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-4">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.sender === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-700'
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="p-6 border-t border-gray-700">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-4">
            <Input
              placeholder="Type your command..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
