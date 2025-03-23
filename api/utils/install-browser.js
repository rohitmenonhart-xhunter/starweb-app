import chromium from 'chrome-aws-lambda';
import fs from 'fs';
import path from 'path';
import { getLibraryPaths } from './lambda-setup.js';

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
    env: process.env.VERCEL ? 'Vercel' : (process.env.AWS_LAMBDA_FUNCTION_NAME ? 'AWS Lambda' : 'Other')
  });

  // Check if we're in a serverless environment
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    console.log('Running in serverless environment, ensuring browser is available');
    
    try {
      // Fix for the libnss3.so error: check common library paths
      const libraryPaths = getLibraryPaths();
      
      let foundLibNss3 = false;
      for (const libPath of libraryPaths.libnss3) {
        if (fs.existsSync(libPath)) {
          console.log(`Found libnss3.so at: ${libPath}`);
          foundLibNss3 = true;
          break;
        }
      }
      
      if (!foundLibNss3) {
        console.warn('Could not find libnss3.so in common locations. Chrome may fail to start.');
      }

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
          
          // Check if the directory has proper permissions
          try {
            const dirPath = path.dirname(executablePath);
            fs.chmodSync(dirPath, 0o755);
            console.log('Set directory permissions for Chrome');
          } catch (error) {
            console.warn('Could not set directory permissions:', error.message);
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
        // Ensure directory has proper permissions
        fs.chmodSync(chromeDir, 0o755);
      }
      
      // Log available files in the temp directory
      console.log('Checking /tmp directory...');
      if (fs.existsSync('/tmp')) {
        const files = fs.readdirSync('/tmp');
        console.log('Files in /tmp:', files);
        
        // If we see chromium-related files, log more details
        for (const file of files) {
          if (file.includes('chrom')) {
            const filePath = path.join('/tmp', file);
            const stats = fs.statSync(filePath);
            console.log(`Found ${filePath}, size: ${stats.size}, mode: ${stats.mode.toString(8)}`);
          }
        }
      }
      
      // Force chrome-aws-lambda to download Chrome
      console.log('Attempting to force chrome-aws-lambda initialization...');
      try {
        await chromium.font('');
        console.log('chrome-aws-lambda initialized successfully');
      } catch (err) {
        console.warn('Error initializing chrome-aws-lambda:', err.message);
      }
      
      // Check if chrome-aws-lambda has downloaded the browser after initialization
      const chromiumPath = await chromium.executablePath;
      if (chromiumPath && fs.existsSync(chromiumPath)) {
        console.log('Chrome has been installed at:', chromiumPath);
        return chromiumPath;
      }
      
      console.warn('Chrome installation verification failed');
      // Return the default path even if we couldn't verify it exists
      // The browser launcher will handle the error if it doesn't work
      return '/tmp/chromium/chrome';
    } catch (error) {
      console.error('Error ensuring browser:', error);
      // Return the default path so the browser launcher can try
      return '/tmp/chromium/chrome';
    }
  } else {
    console.log('Not running in serverless environment, skipping browser installation');
    return null;
  }
}

// Export a function to get installation status
export async function getBrowserInfo() {
  try {
    const executablePath = await chromium.executablePath;
    const defaultPath = '/tmp/chromium/chrome';
    const exists = executablePath ? fs.existsSync(executablePath) : false;
    const defaultExists = fs.existsSync(defaultPath);
    
    const envVars = {
      CHROME_AWS_LAMBDA_CHROMIUM_EXECUTABLE_PATH: process.env.CHROME_AWS_LAMBDA_CHROMIUM_EXECUTABLE_PATH || 'Not set',
      CHROME_AWS_LAMBDA_CACHE_DIR: process.env.CHROME_AWS_LAMBDA_CACHE_DIR || 'Not set',
      PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH || 'Not set',
      AWS_EXECUTION_ENV: process.env.AWS_EXECUTION_ENV || 'Not set',
      AWS_REGION: process.env.AWS_REGION || 'Not set',
      VERCEL_REGION: process.env.VERCEL_REGION || 'Not set'
    };
    
    return {
      executablePath: executablePath || 'Not found',
      exists,
      defaultPathExists: defaultExists,
      headless: chromium.headless,
      args: chromium.args,
      environmentVariables: envVars
    };
  } catch (error) {
    return {
      error: error.message,
      exists: false
    };
  }
} 