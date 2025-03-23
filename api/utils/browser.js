import puppeteer from 'puppeteer-core';

// Try to connect to a browser using various strategies
export async function launchBrowser() {
  const options = {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // Important for memory usage
      '--disable-gpu',
      '--hide-scrollbars'
    ],
    headless: true,
    ignoreHTTPSErrors: true
  };

  console.log('Attempting to launch browser with options:', JSON.stringify({
    args: options.args.join(', ').substring(0, 100) + '...',
    headless: options.headless
  }));

  try {
    // Try to launch without a specific path (attempt to find Chrome)
    console.log('Trying to launch browser without executable path...');
    return await puppeteer.launch(options);
  } catch (error) {
    console.error('Failed to launch browser without path:', error.message);
    
    // Try with possible Chrome paths
    const possiblePaths = [
      // Linux Chrome
      '/usr/bin/google-chrome',
      // Linux Chromium
      '/usr/bin/chromium-browser',
      // Vercel serverless Chrome path (might work)
      '/tmp/chromium/chrome',
      // Lambda Chrome path
      '/opt/chrome/chrome'
    ];
    
    // Try each possible path
    for (const executablePath of possiblePaths) {
      try {
        console.log(`Trying to launch browser with path: ${executablePath}`);
        return await puppeteer.launch({
          ...options,
          executablePath
        });
      } catch (pathError) {
        console.error(`Failed with path ${executablePath}:`, pathError.message);
      }
    }
    
    // If all attempts fail, throw a helpful error
    throw new Error(`Failed to launch browser with all known strategies. Original error: ${error.message}`);
  }
}

// Get a configured page from the browser
export async function getBrowserPage() {
  try {
    const browser = await launchBrowser();
    const page = await browser.newPage();
    
    // Set up request interception to block unnecessary resources
    await page.setRequestInterception(true);
    
    page.on('request', (request) => {
      // Block non-critical resources to save memory
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