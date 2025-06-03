import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiExternalLink, FiRefreshCw, FiMaximize2, FiMinimize2, FiAlertTriangle } from 'react-icons/fi';

interface Interaction {
  id: string;
  type: 'navigate' | 'click' | 'input' | 'scroll';
  target: string;
  value?: string;
  timestamp: number;
  url: string;
}

interface ExternalSiteTesterProps {
  initialUrl?: string;
}

const ExternalSiteTester: React.FC<ExternalSiteTesterProps> = ({ initialUrl = 'https://example.com' }) => {
  const [url, setUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Load URL in iframe
  const loadUrl = useCallback((targetUrl: string) => {
    if (!targetUrl) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Add https:// if no protocol is specified
      let finalUrl = targetUrl;
      if (!/^https?:\/\//i.test(targetUrl)) {
        finalUrl = `https://${targetUrl}`;
        setUrl(finalUrl);
      }
      
      // Add to interaction history
      setInteractions(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'navigate',
          target: 'page',
          timestamp: Date.now(),
          url: finalUrl
        }
      ]);
      
      // Reset iframe source
      if (iframeRef.current) {
        iframeRef.current.src = finalUrl;
      }
      
    } catch (err) {
      setError('Failed to load URL');
      console.error('Error loading URL:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUrl(url);
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!iframeRef.current) return;
    
    if (!document.fullscreenElement) {
      iframeRef.current.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load the website. Please check the URL and try again.');
  };

  // Load initial URL
  useEffect(() => {
    loadUrl(initialUrl);
  }, [initialUrl, loadUrl]);

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="bg-dark-800 p-4 border-b border-dark-700">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1">
            <div className="relative">
              <input
                ref={urlInputRef}
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter website URL"
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-md text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-md text-white"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
          </button>
        </form>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertTriangle className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Iframe container */}
      <div className="flex-1 relative bg-dark-900">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-900/80 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-2 text-gray-400">Loading website...</p>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={url}
          title="External Website Tester"
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          allowFullScreen
        />
      </div>

      {/* Interaction history */}
      <div className="bg-dark-800 border-t border-dark-700 p-4 h-48 overflow-y-auto">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Interaction History</h3>
        <div className="space-y-1">
          {interactions.length === 0 ? (
            <p className="text-sm text-gray-500">No interactions recorded</p>
          ) : (
            <ul className="space-y-1">
              {[...interactions].reverse().map((interaction) => (
                <li key={interaction.id} className="text-sm text-gray-300 font-mono">
                  <span className="text-gray-500">
                    {new Date(interaction.timestamp).toLocaleTimeString()}
                  </span>{' '}
                  <span className="text-primary-400">[{interaction.type}]</span>{' '}
                  {interaction.target}
                  {interaction.value && `: ${interaction.value}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExternalSiteTester;
