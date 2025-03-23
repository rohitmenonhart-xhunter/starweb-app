import chrome from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

// Function to get the executable path for Chrome
const getExecutablePath = async () => {
  // For local development
  if (process.env.NODE_ENV !== 'production') {
    // Windows
    if (process.platform === 'win32') {
      return 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
    }
    // Mac OS
    if (process.platform === 'darwin') {
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    }
    // Linux
    return '/usr/bin/google-chrome';
  }
  
  // For production (Vercel)
  return await chrome.executablePath;
};

// Memory-optimized options for Vercel Hobby plan (1024MB limit)
const getLowMemoryOptions = (executablePath) => ({
  args: [
    ...chrome.args,
    '--hide-scrollbars',
    '--disable-web-security',
    '--disable-dev-shm-usage', // This is important for low memory environments
    '--disable-features=site-per-process',
    '--disable-extensions',
    '--no-zygote',
    '--single-process', // Important to save memory
    '--disable-accelerated-2d-canvas',
    '--disable-gpu'
  ],
  defaultViewport: {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
  },
  executablePath,
  headless: true,
  ignoreHTTPSErrors: true,
});

// Function to launch a browser instance (memory-optimized)
export async function getChromiumBrowser() {
  const executablePath = await getExecutablePath();
  
  try {
    return await puppeteer.launch(getLowMemoryOptions(executablePath));
  } catch (error) {
    console.error('Error launching Chromium:', error);
    
    // Fallback options with even more memory optimization
    const fallbackOptions = {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--no-zygote',
        '--single-process'
      ],
      headless: true,
      ignoreHTTPSErrors: true,
    };
    
    return await puppeteer.launch(fallbackOptions);
  }
}

// Export the function to get a new page from the browser
export async function getChromiumPage() {
  const browser = await getChromiumBrowser();
  const page = await browser.newPage();
  
  // Configure page for lower memory usage
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    // Block unnecessary resources to save memory
    if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
      request.abort();
    } else {
      request.continue();
    }
  });
  
  return { browser, page };
} 