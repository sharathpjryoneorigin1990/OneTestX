import React from 'react';
import { FiPlay, FiStopCircle, FiSave, FiTrash2 } from 'react-icons/fi';

interface TestHeaderProps {
  isRecording: boolean;
  isRunning: boolean;
  isSaving: boolean;
  websiteUrl: string;
  testName: string;
  testDescription: string;
  onWebsiteUrlChange: (url: string) => void;
  onTestNameChange: (name: string) => void;
  onTestDescriptionChange: (desc: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSaveTest: () => void;
  onClearTest: () => void;
  onRunTest: () => void;
}

export const TestHeader: React.FC<TestHeaderProps> = ({
  isRecording,
  isRunning,
  isSaving,
  websiteUrl,
  testName,
  testDescription,
  onWebsiteUrlChange,
  onTestNameChange,
  onTestDescriptionChange,
  onStartRecording,
  onStopRecording,
  onSaveTest,
  onClearTest,
  onRunTest
}) => {
  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-300 mb-1">
            Website URL
          </label>
          <input
            type="url"
            id="websiteUrl"
            value={websiteUrl}
            onChange={(e) => onWebsiteUrlChange(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isRecording}
          />
        </div>
        <div>
          <label htmlFor="testName" className="block text-sm font-medium text-gray-300 mb-1">
            Test Name
          </label>
          <input
            type="text"
            id="testName"
            value={testName}
            onChange={(e) => onTestNameChange(e.target.value)}
            placeholder="Enter test name"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="testDescription" className="block text-sm font-medium text-gray-300 mb-1">
            Description
          </label>
          <textarea
            id="testDescription"
            value={testDescription}
            onChange={(e) => onTestDescriptionChange(e.target.value)}
            placeholder="Enter test description"
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {!isRecording ? (
          <button
            onClick={onStartRecording}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
            disabled={isRunning}
          >
            <FiPlay className="mr-2 h-4 w-4" />
            Start Recording
          </button>
        ) : (
          <button
            onClick={onStopRecording}
            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
          >
            <FiStopCircle className="mr-2 h-4 w-4" />
            Stop Recording
          </button>
        )}

        <button
          onClick={onSaveTest}
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiSave className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Test'}
        </button>

        <button
          onClick={onRunTest}
          disabled={isRecording || isRunning}
          className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiPlay className="mr-2 h-4 w-4" />
          Run Test
        </button>

        <button
          onClick={onClearTest}
          className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
        >
          <FiTrash2 className="mr-2 h-4 w-4" />
          Clear Test
        </button>
      </div>
    </div>
  );
};
