import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// In a production environment, you would use a database instead of a JSON file
const SETTINGS_FILE_PATH = path.join(process.cwd(), 'jira-settings.json');

// Helper function to read settings
const readSettings = (): any => {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading settings file:', error);
  }
  return { host: '', username: '', apiToken: '' };
};

// Helper function to write settings
const writeSettings = (settings: any): boolean => {
  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing settings file:', error);
    return false;
  }
};

// GET handler to retrieve Jira settings
export async function GET() {
  try {
    // First try to read from environment variables
    const envSettings = {
      host: process.env.JIRA_HOST || '',
      username: process.env.JIRA_USERNAME || '',
      apiToken: process.env.JIRA_API_TOKEN ? '••••••••••••' : ''
    };
    
    // If all required environment variables are set, use them
    if (envSettings.host && envSettings.username && process.env.JIRA_API_TOKEN) {
      console.log('Using Jira settings from environment variables');
      return NextResponse.json({
        host: envSettings.host,
        username: envSettings.username,
        apiToken: '••••••••••••' // Mask the token
      });
    }
    
    // Fall back to file-based settings
    const fileSettings = readSettings();
    
    // Return the settings with masked token
    return NextResponse.json({
      host: fileSettings.host || '',
      username: fileSettings.username || '',
      apiToken: fileSettings.apiToken ? '••••••••••••' : ''
    });
    
  } catch (error) {
    console.error('Error retrieving Jira settings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve Jira settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST handler to update Jira settings
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.host) {
      return NextResponse.json({ error: 'Jira host is required' }, { status: 400 });
    }
    
    if (!data.username) {
      return NextResponse.json({ error: 'Jira username is required' }, { status: 400 });
    }
    
    // Only update API token if provided (to avoid overwriting with empty string)
    const currentSettings = readSettings();
    const newSettings = {
      host: data.host,
      username: data.username,
      apiToken: data.apiToken || currentSettings.apiToken
    };
    
    const success = writeSettings(newSettings);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Jira settings updated successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating Jira settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
