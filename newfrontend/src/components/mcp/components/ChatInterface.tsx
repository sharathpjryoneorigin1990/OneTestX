import React, { useRef, useEffect } from 'react';
import { FiSend, FiTrash2 } from 'react-icons/fi';

interface ChatMessage {
  type: 'user' | 'system' | 'error';
  text: string;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  inputValue: string;
  isProcessing: boolean;
  isRecording: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onClearChat: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  inputValue,
  isProcessing,
  isRecording,
  onInputChange,
  onSendMessage,
  onClearChat
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Chat Assistant</h3>
        <button
          onClick={onClearChat}
          className="p-1 hover:bg-gray-600 rounded-full transition-colors"
          title="Clear chat"
        >
          <FiTrash2 className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <div
        ref={chatContainerRef}
        className="h-64 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isRecording ? "Type a command..." : "Start recording to use commands"}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isRecording || isProcessing}
          />
          <button
            onClick={onSendMessage}
            disabled={!isRecording || isProcessing || !inputValue.trim()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiSend className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
