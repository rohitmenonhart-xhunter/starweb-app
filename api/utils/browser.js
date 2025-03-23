import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';
import { ensureBrowser } from './install-browser.js';

/**
 * Launches a browser with proper Vercel serverless environment configuration
 * @returns {Promise<Browser>} Puppeteer browser instance
 */
export async function launchBrowser() {
  console.log('Launching browser for Vercel environment...');
  
  // Try to ensure browser is installed and available
  await ensureBrowser();
  
  const executablePath = await chromium.executablePath;
  
  console.log('Using Chrome executable path:', executablePath || 'default');
  
  // Basic options compatible with Vercel
  const options = {
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  };
  
  try {
    return await puppeteer.launch(options);
  } catch (error) {
    console.error('Failed to launch browser with chrome-aws-lambda:', error.message);
    
    // Fallback with explicit options if the first attempt fails
    const fallbackOptions = {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      executablePath: executablePath || '/tmp/chromium/chrome',
      headless: true,
      ignoreHTTPSErrors: true
    };
    
    console.log('Trying fallback launch with options:', JSON.stringify({
      args: fallbackOptions.args.join(', ').substring(0, 100) + '...',
      executablePath: fallbackOptions.executablePath
    }));
    
    try {
      return await puppeteer.launch(fallbackOptions);
    } catch (fallbackError) {
      console.error('Fallback browser launch also failed:', fallbackError.message);
      throw new Error(`Failed to launch browser in Vercel environment. Original error: ${error.message}, Fallback error: ${fallbackError.message}`);
    }
  }
}

/**
 * Gets a configured page from a browser, optimized for serverless environment
 * @returns {Promise<{browser: Browser, page: Page}>} Browser and page objects
 */
export async function getBrowserPage() {
  try {
    console.log('Getting browser instance...');
    const browser = await launchBrowser();
    
    console.log('Creating new page...');
    const page = await browser.newPage();
    
    // Set up request interception to save memory
    await page.setRequestInterception(true);
    
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      const blockedTypes = ['image', 'media', 'font', 'stylesheet'];
      
      if (blockedTypes.includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    // Set a smaller viewport to reduce memory usage
    await page.setViewport({ width: 1280, height: 720 });
    
    // Set a user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    return { browser, page };
  } catch (error) {
    console.error('Error in getBrowserPage:', error);
    throw error;
  }
} 