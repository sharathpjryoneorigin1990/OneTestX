'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface ContrastResultItemProps {
  result: {
    element: string;
    text: string;
    foreground: string;
    background: string;
    contrast: {
      contrastRatio: number;
      aa: { normal: boolean; large: boolean };
      aaa: { normal: boolean; large: boolean };
      wcagLevel: 'AAA' | 'AA' | 'Fail';
      fontSize: string;
      fontWeight: string;
    };
    selector: string;
    html: string;
  };
}

const ColorSwatch = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-2">
    <div 
      className="w-6 h-6 rounded border border-gray-200" 
      style={{ backgroundColor: color }}
      aria-label={`${label} color`}
    />
    <code className="text-sm">{color}</code>
  </div>
);

export const ContrastResultItem = ({ result }: ContrastResultItemProps) => {
  const { wcagLevel } = result.contrast;
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {result.element}
            </span>
            <Badge 
              variant={
                wcagLevel === 'Fail' ? 'error' : 
                wcagLevel === 'AA' ? 'warning' : 'success'
              }
            >
              {wcagLevel}
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            Contrast: {result.contrast.contrastRatio.toFixed(1)}:1
          </div>
        </div>
        <p className="mt-2 text-sm line-clamp-2">
          {result.text}
        </p>
      </div>
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1">Foreground</h4>
            <ColorSwatch color={result.foreground} label="Foreground" />
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1">Background</h4>
            <ColorSwatch color={result.background} label="Background" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-medium text-gray-500 mb-1">Element Details</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Font Size:</span>{' '}
              <span className="font-mono">{result.contrast.fontSize}</span>
            </div>
            <div>
              <span className="text-gray-500">Weight:</span>{' '}
              <span className="font-mono">{result.contrast.fontWeight}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Selector:</span>{' '}
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                {result.selector}
              </code>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
