import analyze from '../src/api/analyze.js';
import dotenv from 'dotenv';
import { getChromiumBrowser } from './utils/chromium.js';

// Load environment variables
dotenv.config();

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser = null;

  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({ error: 'Invalid URL format. URL must start with http:// or https://' });
    }

    // Get a new browser instance for each request (more reliable in serverless)
    browser = await getChromiumBrowser();

    // Pass the browser instance to the analyze function
    const analysis = await analyze(url, browser);
    
    // Close the browser after analysis
    if (browser) {
      await browser.close();
    }
    
    res.status(200).json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    
    // Ensure browser is closed on error
    if (browser) {
      try {
        await browser.close();
      } catch (closingError) {
        console.error('Error closing browser:', closingError);
      }
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to analyze website'
    });
  }
} 