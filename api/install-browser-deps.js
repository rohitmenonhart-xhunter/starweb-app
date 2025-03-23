// This script can be run during the build phase to install necessary browser dependencies
import chromium from 'chrome-aws-lambda';
import fs from 'fs';
import { execSync } from 'child_process';

/**
 * Main function to install browser dependencies
 */
async function installBrowserDeps() {
  console.log('Starting browser dependency installation...');

  // Log environment details
  console.log('Environment:', {
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    isVercel: process.env.VERCEL === '1',
    cwd: process.cwd(),
  });

  // Check chrome-aws-lambda version
  try {
    console.log('chrome-aws-lambda version:', chromium.version);
  } catch (error) {
    console.warn('Could not determine chrome-aws-lambda version:', error.message);
  }

  // Ensure /tmp directory exists and is writable
  try {
    if (!fs.existsSync('/tmp')) {
      fs.mkdirSync('/tmp', { recursive: true });
      console.log('Created /tmp directory');
    }

    if (!fs.existsSync('/tmp/chromium')) {
      fs.mkdirSync('/tmp/chromium', { recursive: true });
      console.log('Created /tmp/chromium directory');
    }
    
    // Test write permissions
    fs.writeFileSync('/tmp/test-write', 'test');
    fs.unlinkSync('/tmp/test-write');
    console.log('/tmp directory is writable');
  } catch (error) {
    console.error('Error with /tmp directory:', error.message);
  }

  // Try to get the Chromium path
  try {
    const executablePath = await chromium.executablePath;
    if (executablePath) {
      console.log('Chromium executable path:', executablePath);
      
      if (fs.existsSync(executablePath)) {
        console.log('Chromium executable already exists at:', executablePath);
        
        // Make it executable
        try {
          fs.chmodSync(executablePath, 0o755);
          console.log('Set executable permissions for Chromium binary');
        } catch (err) {
          console.warn('Could not set permissions:', err.message);
        }
      } else {
        console.warn('Chromium executable does not exist at path:', executablePath);
      }
    } else {
      console.warn('No Chromium executable path returned by chrome-aws-lambda');
    }
  } catch (error) {
    console.error('Error getting Chromium executable path:', error.message);
  }

  console.log('Browser dependency installation completed');
}

// Run the installation process
installBrowserDeps()
  .then(() => {
    console.log('Browser setup completed successfully');
  })
  .catch((error) => {
    console.error('Browser setup failed:', error);
  }); 