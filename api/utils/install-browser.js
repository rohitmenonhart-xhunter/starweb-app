import chromium from 'chrome-aws-lambda';
import fs from 'fs';
import path from 'path';

/**
 * Ensures that the Chrome browser is installed and available
 * This is especially important for Vercel deployments
 */
export async function ensureBrowser() {
  // Log the environment for debugging
  console.log('Environment:', {
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    env: process.env.VERCEL ? 'Vercel' : 'Other'
  });

  // Check if we're in Vercel
  if (process.env.VERCEL) {
    console.log('Running in Vercel environment, ensuring browser is available');
    
    try {
      // Get the executable path from chrome-aws-lambda
      const executablePath = await chromium.executablePath;
      
      if (executablePath) {
        console.log('Chrome executable path from chrome-aws-lambda:', executablePath);
        
        // Check if the executable exists
        if (fs.existsSync(executablePath)) {
          console.log('Chrome executable exists at path:', executablePath);
          
          // Make it executable if it's not already
          try {
            fs.chmodSync(executablePath, 0o755);
            console.log('Set executable permissions for Chrome');
          } catch (error) {
            console.warn('Could not set executable permissions:', error.message);
          }
          
          return executablePath;
        } else {
          console.warn('Chrome executable not found at path:', executablePath);
        }
      } else {
        console.warn('No Chrome executable path provided by chrome-aws-lambda');
      }
      
      // If we get here, we need to try alternative approaches
      // First, let's check if we need to create the directory
      const chromeDir = '/tmp/chromium';
      if (!fs.existsSync(chromeDir)) {
        console.log('Creating directory for Chrome:', chromeDir);
        fs.mkdirSync(chromeDir, { recursive: true });
      }
      
      // Log available files in the temp directory
      const files = fs.readdirSync('/tmp');
      console.log('Files in /tmp:', files);
      
      // Check if chrome-aws-lambda has downloaded the browser
      const chromiumPath = await chromium.executablePath;
      if (chromiumPath && fs.existsSync(chromiumPath)) {
        console.log('Chrome has been installed at:', chromiumPath);
        return chromiumPath;
      }
      
      console.warn('Chrome installation verification failed');
      return null;
    } catch (error) {
      console.error('Error ensuring browser:', error);
      return null;
    }
  } else {
    console.log('Not running in Vercel environment, skipping browser installation');
    return null;
  }
}

// Export a function to get installation status
export async function getBrowserInfo() {
  try {
    const executablePath = await chromium.executablePath;
    const exists = executablePath ? fs.existsSync(executablePath) : false;
    
    return {
      executablePath: executablePath || 'Not found',
      exists,
      headless: chromium.headless,
      args: chromium.args
    };
  } catch (error) {
    return {
      error: error.message,
      exists: false
    };
  }
} 