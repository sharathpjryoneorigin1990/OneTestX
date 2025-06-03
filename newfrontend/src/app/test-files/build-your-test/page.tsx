'use client';

import React from 'react';
import { NewNavbar } from '@/components/layout/NewNavbar';
import { MCPClientProvider } from '@/components/mcp/MCPClient';
import { TestBuilder } from '@/components/mcp/TestBuilder';

export default function BuildYourTestPage() {
  return (
    <MCPClientProvider>
      <div className="min-h-screen bg-gray-900">
        <NewNavbar />
        <div className="pt-24 px-4 pb-8">
          <div className="max-w-7xl mx-auto">
            <TestBuilder />
          </div>
        </div>
      </div>
    </MCPClientProvider>
  );
}
