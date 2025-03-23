import analyze from '../../src/api/analyze.js';
import dotenv from 'dotenv';
import { launchBrowser } from '../utils/browser.js';

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

    console.log(`Analyzing URL: ${url}`);
    
    // Get a new browser instance using our fixed browser utility
    try {
      console.log('Launching browser...');
      browser = await launchBrowser();
      console.log('Browser launched successfully');
    } catch (browserError) {
      console.error('Failed to launch browser:', browserError);
      return res.status(500).json({
        error: 'Browser launch failed',
        message: browserError.message,
        suggestion: 'Please check the browser-check endpoint for detailed diagnostics.'
      });
    }

    // Pass the browser instance to the analyze function
    console.log('Starting analysis...');
    const analysis = await analyze(url, browser);
    console.log('Analysis completed');
    
    // Close the browser after analysis
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
      console.log('Browser closed');
    }
    
    res.status(200).json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    
    // Ensure browser is closed on error
    if (browser) {
      try {
        console.log('Closing browser after error...');
        await browser.close();
        console.log('Browser closed after error');
      } catch (closingError) {
        console.error('Error closing browser:', closingError);
      }
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to analyze website',
      suggestion: 'Please try the lightweight analysis endpoint or check the browser-check endpoint for diagnostics.'
    });
  }
} 