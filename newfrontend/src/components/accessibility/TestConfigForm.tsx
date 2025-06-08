import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface TestConfigFormProps {
  initialScreenName?: string;
  initialUrl?: string;
  onRunTest: (params: { screenName: string; url: string; viewport: string }) => void;
  isRunning?: boolean;
  error?: string | null;
  className?: string;
}

export function TestConfigForm({
  initialScreenName = '',
  initialUrl = '',
  onRunTest,
  isRunning = false,
  error = null,
  className = '',
}: TestConfigFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [screenName, setScreenName] = useState(initialScreenName);
  const [url, setUrl] = useState(initialUrl);
  const [viewport, setViewport] = useState('desktop');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize form from URL params if available
  useEffect(() => {
    const urlParam = searchParams.get('url');
    const nameParam = searchParams.get('name');
    const viewportParam = searchParams.get('viewport');
    
    if (urlParam) setUrl(urlParam);
    if (nameParam) setScreenName(nameParam);
    if (viewportParam && ['mobile', 'tablet', 'desktop', 'large'].includes(viewportParam)) {
      setViewport(viewportParam);
    }
  }, [searchParams]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!screenName || !url) {
      return;
    }
    
    // Update URL with current form state
    const params = new URLSearchParams();
    params.set('name', screenName);
    params.set('url', url);
    params.set('viewport', viewport);
    router.push(`?${params.toString()}`, { scroll: false });
    
    // Trigger the test
    onRunTest({ screenName, url, viewport });
  };
  
  const viewportOptions = [
    { value: 'mobile', label: 'Mobile (375x667)' },
    { value: 'tablet', label: 'Tablet (768x1024)' },
    { value: 'desktop', label: 'Desktop (1280x800)' },
    { value: 'large', label: 'Large (1920x1080)' },
  ];
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <CardTitle>Run Accessibility Test</CardTitle>
          <CardDescription>
            Test any web page for accessibility issues using automated checks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="screenName">Test Name</Label>
              <Input
                id="screenName"
                placeholder="e.g., Homepage, Login Form, Checkout"
                value={screenName}
                onChange={(e) => setScreenName(e.target.value)}
                required
                disabled={isRunning}
              />
              <p className="text-xs text-muted-foreground">
                A name to identify this test run
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="url">URL to Test</Label>
              <div className="flex space-x-2">
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  disabled={isRunning}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Full URL including https://
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="viewport">Viewport Size</Label>
              <Select 
                value={viewport} 
                onValueChange={setViewport}
                disabled={isRunning}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select viewport size" />
                </SelectTrigger>
                <SelectContent>
                  {viewportOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The screen size to test with
              </p>
            </div>
            
            <div className="pt-2">
              <div 
                className="flex items-center space-x-2 cursor-pointer mb-2"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              >
                <Switch 
                  id="advanced-settings" 
                  checked={isAdvancedOpen} 
                  onCheckedChange={setIsAdvancedOpen}
                />
                <Label htmlFor="advanced-settings" className="cursor-pointer">
                  Advanced Settings
                </Label>
              </div>
              
              {isAdvancedOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                    <div className="space-y-2">
                      <Label>Authentication (Coming Soon)</Label>
                      <div className="space-y-2">
                        <Input 
                          placeholder="Username" 
                          disabled 
                          className="opacity-50" 
                        />
                        <Input 
                          type="password" 
                          placeholder="Password" 
                          disabled 
                          className="opacity-50"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Authentication support will be available in a future update.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Additional Options (Coming Soon)</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 opacity-50">
                          <input type="checkbox" id="include-screenshots" disabled />
                          <label htmlFor="include-screenshots" className="text-sm">
                            Include screenshots
                          </label>
                        </div>
                        <div className="flex items-center space-x-2 opacity-50">
                          <input type="checkbox" id="include-html" disabled />
                          <label htmlFor="include-html" className="text-sm">
                            Include full HTML
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end pt-2">
              <Button 
                type="submit" 
                disabled={isRunning || !screenName || !url}
                className="w-full sm:w-auto"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Test...
                  </>
                ) : (
                  'Run Accessibility Test'
                )}
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground text-center">
              Powered by{' '}
              <a 
                href="https://www.deque.com/axe/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                axe-core
              </a>{' '}
              and{' '}
              <a 
                href="https://playwright.dev/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Playwright
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
