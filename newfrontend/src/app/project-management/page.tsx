'use client';

import React from 'react';
import { NewNavbar } from '@/components/layout/NewNavbar';
import ProjectDashboard from '.'; // Corrected import path, imports from local index.ts

export default function ProjectManagementPage() {
  return (
    <div className="min-h-screen bg-dark-900 text-gray-100">
      <NewNavbar />
      <main className="p-4 sm:p-6 lg:p-8">
        <ProjectDashboard />
      </main>
    </div>
  );
}
