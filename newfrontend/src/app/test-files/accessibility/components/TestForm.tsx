import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Loader2, Smartphone, Tablet, Monitor } from 'lucide-react';

type ViewportType = 'desktop' | 'tablet' | 'mobile';

interface TestFormProps {
  url: string;
  setUrl: (url: string) => void;
  viewport: ViewportType;
  setViewport: (viewport: ViewportType) => void;
  isLoading: boolean;
  onRunTest: () => void;
}

export function TestForm({
  url,
  setUrl,
  viewport,
  setViewport,
  isLoading,
  onRunTest,
}: TestFormProps) {
  const getViewportIcon = (vp: ViewportType) => {
    switch (vp) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Accessibility Testing</CardTitle>
        <CardDescription>
          Test your website's accessibility and get detailed reports on potential issues.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Website URL
            </Label>
            <div className="flex space-x-2">
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                onClick={onRunTest}
                disabled={isLoading || !url}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : 'Run Test'}
              </Button>
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Viewport
            </Label>
            <div className="flex space-x-2">
              {(['desktop', 'tablet', 'mobile'] as ViewportType[]).map((vp) => (
                <Button
                  key={vp}
                  type="button"
                  variant={viewport === vp ? 'default' : 'outline'}
                  onClick={() => setViewport(vp)}
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  {getViewportIcon(vp)}
                  {vp.charAt(0).toUpperCase() + vp.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
