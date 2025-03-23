import { getBrowserInfo, ensureBrowser } from './utils/install-browser.js';
import { launchBrowser } from './utils/browser.js';
import fs from 'fs';

export default async function handler(req, res) {
  // Begin collecting diagnostic info
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      platform: process.platform,
      arch: process.arch,
      node: process.version,
      vercel: process.env.VERCEL ? true : false,
      region: process.env.VERCEL_REGION || 'unknown'
    },
    browser: {
      info: await getBrowserInfo(),
      status: 'unknown'
    },
    filesystem: {
      tempDir: []
    },
    memoryUsage: process.memoryUsage()
  };

  // Check temp directory contents
  try {
    if (fs.existsSync('/tmp')) {
      diagnostics.filesystem.tempDir = fs.readdirSync('/tmp');
    }
  } catch (error) {
    diagnostics.filesystem.error = error.message;
  }

  // Try to ensure browser
  try {
    console.log('Running browser installation check...');
    const executablePath = await ensureBrowser();
    diagnostics.browser.installation = {
      success: !!executablePath,
      path: executablePath || 'not found'
    };
  } catch (error) {
    diagnostics.browser.installation = {
      success: false,
      error: error.message
    };
  }

  // Try to launch the browser
  try {
    console.log('Attempting to launch browser...');
    const browser = await launchBrowser();
    
    if (browser) {
      diagnostics.browser.status = 'success';
      diagnostics.browser.version = await browser.version();
      
      // Try to create a page
      try {
        const page = await browser.newPage();
        await page.goto('about:blank');
        const isPageWorking = await page.evaluate(() => document.readyState);
        diagnostics.browser.page = {
          created: true,
          working: isPageWorking === 'complete'
        };
        await page.close();
      } catch (pageError) {
        diagnostics.browser.page = {
          created: false,
          error: pageError.message
        };
      }
      
      // Close the browser
      await browser.close();
    } else {
      diagnostics.browser.status = 'failed';
      diagnostics.browser.error = 'Browser object is null';
    }
  } catch (error) {
    diagnostics.browser.status = 'error';
    diagnostics.browser.error = error.message;
  }
  
  // Add library versions
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    diagnostics.dependencies = {
      puppeteer: packageJson.dependencies['puppeteer-core'],
      chromeAwsLambda: packageJson.dependencies['chrome-aws-lambda']
    };
  } catch (error) {
    diagnostics.dependencies = {
      error: error.message
    };
  }
  
  // Return diagnostics
  res.status(200).json(diagnostics);
} 