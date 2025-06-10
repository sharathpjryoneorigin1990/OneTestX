'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSettings, FiLink, FiExternalLink, FiGrid, FiColumns, FiCheck, FiX } from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
// Using a simple switch component since the UI library one is not available
const Switch = ({
  checked,
  onCheckedChange,
  className = '',
  id = '',
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  id?: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    id={id}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 ${className} ${
      checked ? 'bg-blue-600' : 'bg-gray-600'
    }`}
    onClick={() => onCheckedChange(!checked)}
  >
    <span
      className={`${
        checked ? 'translate-x-6' : 'translate-x-1'
      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
    />
  </button>
);

interface ProjectSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProjectSettings = ({ isOpen, onClose }: ProjectSettingsProps) => {
  const router = useRouter();
  const [gridView, setGridView] = useState(true);

  // Load settings from localStorage on mount
  const loadSettings = () => {
    const savedGridView = localStorage.getItem('projectSettings-gridView') !== 'false';
    setGridView(savedGridView);
  };

  // Navigate to Jira settings page
  const navigateToJiraSettings = () => {
    router.push('/jira-settings');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[500px] bg-dark-800 border-dark-700 text-white"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          loadSettings();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiSettings className="h-5 w-5" />
            Project Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Jira Integration */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-100 mb-3">Jira Integration</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiLink className="h-5 w-5 text-gray-300" />
                <span className="text-gray-300">Configure Jira Integration</span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={navigateToJiraSettings}
              >
                Settings
              </Button>
            </div>
          </div>

          {/* Display Settings */}
          <div className="border-t border-dark-700 pt-4">
            <h3 className="font-medium text-gray-100 mb-3">Display Settings</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {gridView ? (
                  <FiGrid className="h-5 w-5 text-gray-300" />
                ) : (
                  <FiColumns className="h-5 w-5 text-gray-300" />
                )}
                <Label htmlFor="grid-view" className="text-gray-300">Grid View</Label>
              </div>
              <Switch
                id="grid-view"
                checked={gridView}
                onCheckedChange={(checked: boolean) => setGridView(checked)}
                className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-600"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectSettings;
