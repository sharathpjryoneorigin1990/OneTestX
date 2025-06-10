import { NextResponse } from 'next/server';
import { reloadSettings } from '@/lib/server/jiraService';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    console.log('Reloading Jira settings...');
    const success = await reloadSettings();
    
    if (!success) {
      console.error('Failed to reload Jira settings');
      return NextResponse.json(
        { message: 'Failed to reload Jira settings. Please check your Jira credentials and try again.' },
        { status: 400 }
      );
    }
    
    console.log('Successfully reloaded Jira settings');
    return NextResponse.json({ 
      message: 'Jira settings reloaded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in reload-settings API:', error);
    return NextResponse.json(
      { 
        message: 'Failed to reload Jira settings', 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
