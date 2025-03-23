import dotenv from 'dotenv';
import { getBrowserPage } from './utils/browser.js';
import { OpenAI } from 'openai';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser = null;
  let page = null;

  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({ error: 'Invalid URL format. URL must start with http:// or https://' });
    }

    console.log(`Analyzing URL (lightweight): ${url}`);
    
    try {
      // Get a new browser and page with memory optimizations
      console.log('Setting up browser...');
      const browserSetup = await getBrowserPage();
      browser = browserSetup.browser;
      page = browserSetup.page;
      console.log('Browser launched successfully');
    } catch (browserError) {
      console.error('Failed to launch browser:', browserError);
      return res.status(500).json({
        error: 'Failed to launch browser',
        message: browserError.message,
        suggestion: 'This is likely due to Vercel serverless function limitations. Consider upgrading to Vercel Pro or using the Docker deployment option.'
      });
    }

    // Set a short timeout to prevent long-running processes
    page.setDefaultNavigationTimeout(30000);
    
    // Navigate to the page
    console.log(`Navigating to ${url}`);
    try {
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', // Less resource-intensive than 'networkidle0'
        timeout: 30000
      });
    } catch (navigationError) {
      console.error('Navigation error:', navigationError);
      await browser.close();
      return res.status(500).json({
        error: 'Failed to navigate to URL',
        message: navigationError.message,
        suggestion: 'The website may be blocking automated access or taking too long to load.'
      });
    }
    
    // Wait a short amount of time for content to load
    await page.waitForTimeout(1000);

    console.log('Extracting basic information...');
    
    // Extract essential information
    const basicInfo = await page.evaluate(() => {
      return {
        title: document.title,
        metaDescription: document.querySelector('meta[name="description"]')?.content || '',
        h1Text: Array.from(document.querySelectorAll('h1')).map(h => h.innerText).join(' | '),
        linkCount: document.querySelectorAll('a').length,
        imageCount: document.querySelectorAll('img').length,
        wordCount: document.body.innerText.split(/\s+/).length,
        hasViewport: !!document.querySelector('meta[name="viewport"]'),
        mobileOptimized: !!document.querySelector('meta[name="viewport"][content*="width=device-width"]'),
        scripts: Array.from(document.querySelectorAll('script')).map(s => s.src).filter(Boolean),
        styles: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(s => s.href).filter(Boolean)
      };
    });

    console.log('Basic info extracted:', JSON.stringify(basicInfo).substring(0, 100) + '...');

    // Take a screenshot with reduced quality to save memory
    console.log('Taking screenshot...');
    const screenshot = await page.screenshot({ 
      type: 'jpeg', 
      quality: 50, 
      fullPage: false, 
      clip: { x: 0, y: 0, width: 1280, height: 720 } 
    });
    const screenshotBase64 = screenshot.toString('base64');
    console.log('Screenshot captured, size:', Math.round(screenshotBase64.length / 1024), 'KB');
    
    // Close the page and browser to free memory
    await page.close();
    await browser.close();
    browser = null;
    page = null;
    console.log('Browser resources released');
    
    console.log('Generating AI analysis...');
    
    // Generate AI analysis using OpenAI API
    const aiAnalysisResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system", 
          content: "You are a web design and SEO expert. Analyze this website data and provide a concise assessment."
        },
        {
          role: "user",
          content: `Analyze this website: ${url}\n\nTitle: ${basicInfo.title}\nDescription: ${basicInfo.metaDescription}\nH1: ${basicInfo.h1Text}\nLinks: ${basicInfo.linkCount}\nImages: ${basicInfo.imageCount}\nWords: ${basicInfo.wordCount}\nMobile Optimized: ${basicInfo.mobileOptimized}`
        }
      ],
      max_tokens: 500
    });
    
    const aiAnalysis = aiAnalysisResponse.choices[0].message.content;
    
    // Generate a summary of issues using OpenAI API
    const issuesResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Changed from gpt-4o to gpt-3.5-turbo for Vercel Hobby plan
      messages: [
        {
          role: "system", 
          content: "You are a web design and SEO expert. Based on this website analysis, identify the top 3-5 most important issues that should be fixed."
        },
        {
          role: "user",
          content: `Website: ${url}\n\nTitle: ${basicInfo.title}\nDescription: ${basicInfo.metaDescription}\nH1: ${basicInfo.h1Text}\nLinks: ${basicInfo.linkCount}\nImages: ${basicInfo.imageCount}\nWords: ${basicInfo.wordCount}\nMobile Optimized: ${basicInfo.mobileOptimized}\n\nGenerate a JSON array of issues with the following format: [{\"issue\": \"Issue description\", \"impact\": \"Impact description\", \"priority\": \"high|medium|low\"}]`
        }
      ],
      max_tokens: 500,
      response_format: { type: "json_object" }
    });
    
    const issuesText = issuesResponse.choices[0].message.content;
    let issues = [];
    try {
      const issuesObj = JSON.parse(issuesText);
      issues = issuesObj.issues || [];
    } catch (e) {
      console.error('Error parsing issues JSON:', e);
      issues = [];
    }
    
    // Prepare the response
    const result = {
      mainPage: {
        title: basicInfo.title,
        url: url,
        screenshot: screenshotBase64,
        metadata: {
          description: basicInfo.metaDescription,
          viewport: basicInfo.hasViewport ? 'Set correctly' : 'Missing'
        }
      },
      assets: {
        scripts: basicInfo.scripts.length,
        styles: basicInfo.styles.length,
        images: basicInfo.imageCount
      },
      content: {
        wordCount: basicInfo.wordCount,
        headings: {
          h1: basicInfo.h1Text.split(' | ').length
        },
        links: basicInfo.linkCount
      },
      issues: issues,
      analysis: aiAnalysis,
      summary: "Lightweight analysis completed. For more detailed analysis, consider upgrading to Vercel Pro plan."
    };
    
    console.log('Analysis completed successfully');
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Analysis error:', error);
    
    // Ensure browser is closed on error
    if (page) {
      try {
        await page.close();
      } catch (closingError) {
        console.error('Error closing page:', closingError);
      }
    }
    
    if (browser) {
      try {
        await browser.close();
      } catch (closingError) {
        console.error('Error closing browser:', closingError);
      }
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to analyze website',
      suggestion: 'The analysis exceeded the memory limits of the Vercel Hobby plan. Consider upgrading to the Pro plan or using a simpler analysis.'
    });
  }
} 