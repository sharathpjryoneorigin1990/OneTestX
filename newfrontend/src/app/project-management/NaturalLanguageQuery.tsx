'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FiMic, FiSend, FiSearch, FiLoader, FiMessageSquare, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Jira issues dataset (remains the same)
const mockIssues = [
  { key: 'BUG-101', summary: 'API error on login', type: 'bug', priority: 'high', assignee: 'Alice', status: 'open' },
  { key: 'BUG-102', summary: 'UI not responsive', type: 'bug', priority: 'medium', assignee: 'Bob', status: 'in progress' },
  { key: 'TASK-103', summary: 'Add SSO support', type: 'task', priority: 'high', assignee: 'Alice', status: 'open' },
  { key: 'BUG-104', summary: 'Payment gateway unstable', type: 'bug', priority: 'high', assignee: 'Taylor', status: 'open' },
  { key: 'BUG-105', summary: 'Notifications not delivered', type: 'bug', priority: 'low', assignee: 'Alice', status: 'closed' },
  { key: 'BUG-106', summary: 'Critical bug in auth', type: 'bug', priority: 'high', assignee: 'Alice', status: 'open' },
];

// Simulate AI translation from NL to JQL (mocked - remains the same)
function nlToJql(nl: string): string {
  if (/high[- ]?priority.*bugs?.*alice/i.test(nl)) {
    return 'type = Bug AND priority = High AND assignee = Alice';
  }
  if (/open.*tasks?.*alice/i.test(nl)) {
    return 'type = Task AND status = Open AND assignee = Alice';
  }
  if (/critical.*bug/i.test(nl)) {
    return 'type = Bug AND priority = High AND summary ~ "critical"';
  }
  return 'summary ~ "' + nl + '"';
}

// Simulate JQL query execution (mocked - remains the same)
function executeJql(jql: string) {
  if (jql === 'type = Bug AND priority = High AND assignee = Alice') {
    return mockIssues.filter(i => i.type === 'bug' && i.priority === 'high' && i.assignee.toLowerCase() === 'alice');
  }
  if (jql === 'type = Task AND status = Open AND assignee = Alice') {
    return mockIssues.filter(i => i.type === 'task' && i.status === 'open' && i.assignee.toLowerCase() === 'alice');
  }
  if (jql === 'type = Bug AND priority = High AND summary ~ "critical"') {
    return mockIssues.filter(i => i.type === 'bug' && i.priority === 'high' && /critical/i.test(i.summary));
  }
  return mockIssues.filter(i => i.summary.toLowerCase().includes(jql.replace('summary ~ "', '').replace('"', '').toLowerCase()));
}

interface NaturalLanguageQueryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text?: string;
  jql?: string;
  results?: any[];
  timestamp: Date;
}

const NaturalLanguageQuery: React.FC<NaturalLanguageQueryProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // All hooks (useState, useRef, useEffect) are called before this.
  // No direct return null here; AnimatePresence will handle visibility based on isOpen.

  const handleMic = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setListening(false);
      // Optionally, auto-submit after voice input:
      // if (transcript.trim()) handleAsk(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  const handleAsk = async (currentQuery: string = query) => {
    if (!currentQuery.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      sender: 'user',
      text: currentQuery,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const jqlOut = nlToJql(currentQuery);
      const resultsOut = executeJql(jqlOut);
      
      const botMessage: ChatMessage = {
        id: Date.now().toString() + '-bot',
        sender: 'bot',
        jql: jqlOut,
        results: resultsOut,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
    }, 800);
  };

  const panelVariants = {
    hidden: { opacity: 0, y: 50, x: 50, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      x: 0, 
      scale: 1,
      transition: { type: 'spring', stiffness: 260, damping: 25 }
    },
    exit: { 
      opacity: 0, 
      y: 50, 
      x: 50, 
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed bottom-20 right-5 md:right-10 z-50"
        >
      <Card className="w-[350px] h-[500px] md:w-[400px] md:h-[550px] flex flex-col shadow-2xl rounded-lg bg-white dark:bg-gray-800 border dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <FiMessageSquare className="mr-2 text-blue-500" />
            <span>AI Query</span>
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close chat">
            <FiX className="w-5 h-5" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden">
        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50 rounded-md mb-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg shadow ${ 
                  msg.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                {msg.text && <p className="text-sm">{msg.text}</p>}
                {msg.sender === 'bot' && msg.jql && (
                  <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                    <p className="text-xs font-mono bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded mb-1">
                      JQL: {msg.jql}
                    </p>
                    {msg.results && (
                      <div>
                        <p className="text-xs font-semibold mt-1 mb-0.5">
                          Results ({msg.results.length}):
                        </p>
                        {msg.results.length > 0 ? (
                          <ul className="list-disc list-inside text-xs space-y-0.5">
                            {msg.results.slice(0, 3).map(r => (
                              <li key={r.key}>{r.key}: {r.summary}</li>
                            ))}
                            {msg.results.length > 3 && (
                              <li>...and {msg.results.length - 3} more.</li>
                            )}
                          </ul>
                        ) : (
                          <p className="text-xs italic">No results found for this query.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'} text-right">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="flex items-center gap-2 pt-2 border-t dark:border-gray-700">
          <input
            type="text"
            className="flex-1 border rounded px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ask something... (e.g., high priority bugs for Alice)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading ? handleAsk() : undefined}
            aria-label="Natural language query input"
            disabled={loading}
          />
          <Button variant="ghost" onClick={handleMic} aria-label="Voice input" className={listening ? 'text-red-500 animate-pulse' : ''} disabled={loading}>
            <FiMic className="w-5 h-5" />
          </Button>
          <Button variant="primary" onClick={() => handleAsk()} disabled={loading || !query.trim()} aria-label="Send Query">
            {loading ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiSend className="w-5 h-5" />}
          </Button>
        </div>
      </CardContent>
    </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NaturalLanguageQuery;
