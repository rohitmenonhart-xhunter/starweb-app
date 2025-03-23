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

// Function to launch a browser instance
export async function getChromiumBrowser() {
  const executablePath = await getExecutablePath();
  
  const options = {
    args: [...chrome.args, '--hide-scrollbars', '--disable-web-security'],
    defaultViewport: chrome.defaultViewport,
    executablePath,
    headless: true,
    ignoreHTTPSErrors: true,
  };
  
  try {
    return await puppeteer.launch(options);
  } catch (error) {
    console.error('Error launching Chromium:', error);
    
    // Fallback options for Vercel
    const fallbackOptions = {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
      ignoreHTTPSErrors: true,
    };
    
    return await puppeteer.launch(fallbackOptions);
  }
}

// Export the function to get a new page from the browser
export async function getChromiumPage() {
  const browser = await getChromiumBrowser();
  return {
    browser,
    page: await browser.newPage(),
  };
} 