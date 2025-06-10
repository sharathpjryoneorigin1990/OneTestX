import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

// Promisify fs functions
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

// Helper function to get the project root directory
function getProjectRoot() {
  // Start with the current working directory
  let dir = process.cwd();
  
  // If we're in the newfrontend directory, go up one level
  if (dir.includes('newfrontend')) {
    dir = dir.split('newfrontend')[0];
  }
  
  return dir;
}

// Define the expected request body structure
interface SyncRequestBody {
  username: string;
  token: string;
  repo: string;
}

// Define the response structure
interface SyncResponse {
  success: boolean;
  message: string;
  syncedFiles?: string[];
  errors?: string[];
}

export async function POST(req: NextRequest) {
  console.log('GitHub sync API called');
  try {
    // Parse request body
    const body: SyncRequestBody = await req.json();
    const { username, token, repo } = body;

    // Validate required fields
    if (!username || !token || !repo) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize Octokit with the provided token
    const octokit = new Octokit({
      auth: token,
    });

    // Get repository information
    const [repoOwner, repoName] = repo.split('/');
    if (!repoOwner || !repoName) {
      return NextResponse.json(
        { success: false, message: 'Invalid repository format. Use owner/repo format.' },
        { status: 400 }
      );
    }

    // First, verify that the repository exists and is accessible
    try {
      await octokit.repos.get({
        owner: repoOwner,
        repo: repoName
      });
      console.log(`Repository ${repoOwner}/${repoName} exists and is accessible`);
    } catch (repoError) {
      console.error(`Error accessing repository ${repoOwner}/${repoName}:`, repoError);
      return NextResponse.json(
        { success: false, message: `Repository ${repoOwner}/${repoName} not found or not accessible` },
        { status: 404 }
      );
    }

    // Get repository contents, specifically looking for the 'tests' directory
    let repoContents;
    try {
      const response = await octokit.repos.getContent({
        owner: repoOwner,
        repo: repoName,
        path: 'tests',
      });
      repoContents = response.data;
      console.log(`Found 'tests' directory in repository ${repoOwner}/${repoName}`);
    } catch (testsError) {
      console.error(`Error finding 'tests' directory in repository ${repoOwner}/${repoName}:`, testsError);
      return NextResponse.json(
        { success: false, message: `Tests directory not found in repository ${repoOwner}/${repoName}` },
        { status: 404 }
      );
    }

    // Check if we got an array (directory listing)
    if (!Array.isArray(repoContents)) {
      return NextResponse.json(
        { success: false, message: 'Tests directory not found or is not a directory' },
        { status: 404 }
      );
    }

    // Track sync results
    const syncResults: SyncResponse = {
      success: true,
      message: 'Sync completed',
      syncedFiles: [],
      errors: [],
    };

    // Check if smoke and e2e directories exist in the repository
    const foundDirs = repoContents.filter(item => 
      item.type === 'dir' && (item.name === 'smoke' || item.name === 'e2e')
    );
    
    if (foundDirs.length === 0) {
      console.log('No smoke or e2e directories found in the tests directory');
      return NextResponse.json({
        success: false,
        message: 'No smoke or e2e test directories found in the repository. Please ensure your repository has tests/smoke or tests/e2e directories.'
      }, { status: 404 });
    }
    
    console.log(`Found ${foundDirs.length} test directories: ${foundDirs.map(d => d.name).join(', ')}`);
    
    // Process directories (looking for 'smoke' and 'e2e')
    for (const item of repoContents) {
      if (item.type === 'dir' && (item.name === 'smoke' || item.name === 'e2e')) {
        try {
          // Get contents of the test directory (smoke or e2e)
          const { data: testFiles } = await octokit.repos.getContent({
            owner: repoOwner,
            repo: repoName,
            path: `tests/${item.name}`,
          });

          if (Array.isArray(testFiles)) {
            // Create local directory if it doesn't exist
            // Use absolute path to ensure files are saved in the correct location
            const projectRoot = getProjectRoot();
            const localDir = path.join(projectRoot, 'backend', 'tests', 'ui', item.name);
            console.log('Saving files to directory:', localDir);
            
            try {
              // Ensure directory exists
              await mkdir(localDir, { recursive: true });
              console.log(`Directory created or verified: ${localDir}`);
            } catch (dirCreateError) {
              console.error(`Error creating directory ${localDir}:`, dirCreateError);
              throw dirCreateError;
            }

            // Download each file
            for (const file of testFiles) {
              if (file.type === 'file') {
                try {
                  // Get file content
                  const { data: fileData } = await octokit.repos.getContent({
                    owner: repoOwner,
                    repo: repoName,
                    path: file.path,
                  });

                  if ('content' in fileData && 'encoding' in fileData) {
                    // Decode content (usually base64)
                    const content = Buffer.from(fileData.content, fileData.encoding as BufferEncoding).toString('utf-8');
                    
                    // Write to local file
                    const localFilePath = path.join(localDir, file.name);
                    console.log(`Writing file to: ${localFilePath}`);
                    
                    try {
                      // Ensure the file is written properly
                      await writeFile(localFilePath, content, 'utf8');
                      
                      // Verify file was created
                      const stats = await fs.promises.stat(localFilePath);
                      console.log(`File created successfully: ${localFilePath}, size: ${stats.size} bytes`);
                      
                      // Add to synced files
                      syncResults.syncedFiles!.push(`${item.name}/${file.name}`);
                      console.log(`Successfully synced: ${item.name}/${file.name}`);
                    } catch (writeError) {
                      console.error(`Error writing file ${localFilePath}:`, writeError);
                      throw writeError;
                    }
                  }
                } catch (fileError: unknown) {
                  const errorMessage = fileError instanceof Error ? fileError.message : 'Unknown error';
                  syncResults.errors!.push(`Error syncing ${file.path}: ${errorMessage}`);
                }
              }
            }
          }
        } catch (dirError: unknown) {
          const errorMessage = dirError instanceof Error ? dirError.message : 'Unknown error';
          syncResults.errors!.push(`Error processing ${item.name} directory: ${errorMessage}`);
        }
      }
    }

    // Return results
    if (syncResults.syncedFiles!.length === 0 && syncResults.errors!.length > 0) {
      syncResults.success = false;
      syncResults.message = 'Sync failed with errors';
    } else if (syncResults.syncedFiles!.length === 0) {
      syncResults.success = false;
      syncResults.message = 'No test files found to sync';
    }

    return NextResponse.json(syncResults);
  } catch (error: unknown) {
    console.error('GitHub sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to sync with GitHub repository', 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}
