import analyze from '../src/api/analyze.js';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { launchBrowser, getBrowserPage } from './utils/browser.js';
import fs from 'fs';

// Load environment variables
dotenv.config();

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse the endpoint from the path
  const { endpoint } = req.query;

  console.log(`Processing combined-analysis request for endpoint: ${endpoint}`);
  
  switch (endpoint) {
    case 'analyze':
      return handleFullAnalysis(req, res);
    case 'analyze-lightweight':
      return handleLightweightAnalysis(req, res);
    case 'generate-solution':
      return handleGenerateSolution(req, res);
    default:
      return res.status(404).json({ error: 'Endpoint not found' });
  }
}

/**
 * Handler for full analysis endpoint
 */
async function handleFullAnalysis(req, res) {
  let browser = null;

  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({ error: 'Invalid URL format. URL must start with http:// or https://' });
    }

    console.log('Starting analysis for URL:', url);
    
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
    console.log('Running analysis...');
    const analysis = await analyze(url, browser);
    
    // Close the browser after analysis
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
      console.log('Browser closed successfully');
    }
    
    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    
    // Ensure browser is closed on error
    if (browser) {
      try {
        console.log('Closing browser after error...');
        await browser.close();
      } catch (closingError) {
        console.error('Error closing browser:', closingError);
      }
    }
    
    return res.status(500).json({ 
      error: error.message || 'Failed to analyze website',
      suggestion: 'Please try the lightweight analysis endpoint or check the browser-check endpoint for diagnostics.'
    });
  }
}

/**
 * Handler for lightweight analysis endpoint
 */
async function handleLightweightAnalysis(req, res) {
  let browser = null;
  let page = null;

  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Get URL from the request
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({ error: 'Invalid URL format. URL must start with http:// or https://' });
    }

    console.log(`Starting lightweight analysis for: ${url}`);

    // Launch browser and create a new page
    try {
      const browserData = await getBrowserPage();
      browser = browserData.browser;
      page = browserData.page;
      
      console.log('Browser and page created successfully');
    } catch (browserError) {
      console.error('Failed to launch browser:', browserError);
      return res.status(500).json({
        error: 'Failed to launch browser',
        message: browserError.message,
        suggestion: 'Please try upgrading to Vercel Pro plan or using Docker for full analysis capabilities.'
      });
    }

    // Set navigation timeout
    await page.setDefaultNavigationTimeout(30000);

    // Navigate to the URL
    console.log(`Navigating to ${url}...`);
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
    } catch (navigationError) {
      console.error('Navigation failed:', navigationError);
      
      // Close browser to free resources
      if (browser) await browser.close();
      
      return res.status(500).json({
        error: 'Navigation failed',
        message: navigationError.message,
        suggestion: 'The website might be unavailable or took too long to respond.'
      });
    }

    // Extract basic information
    console.log('Extracting essential information...');
    const basicInfo = await page.evaluate(() => {
      return {
        title: document.title || 'No title found',
        metaDescription: document.querySelector('meta[name="description"]')?.content || 'No description found',
        h1Text: document.querySelector('h1')?.innerText || 'No H1 found',
        linkCount: document.querySelectorAll('a').length,
        imageCount: document.querySelectorAll('img').length,
        wordCount: document.body.innerText.split(/\s+/).filter(Boolean).length,
        mobileOptimized: document.querySelector('meta[name="viewport"]') ? 'Yes' : 'No'
      };
    });

    // Take a screenshot with reduced quality to save memory
    console.log('Taking screenshot...');
    const screenshotBuffer = await page.screenshot({
      fullPage: false,
      quality: 60,
      type: 'jpeg'
    });
    const screenshotBase64 = screenshotBuffer.toString('base64');

    // Close browser to free up resources
    console.log('Closing browser...');
    await browser.close();
    browser = null;
    page = null;

    // Force garbage collection if available
    if (global.gc) {
      console.log('Running garbage collection...');
      global.gc();
    }

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
      model: "gpt-3.5-turbo",
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
    } catch (jsonError) {
      console.error('Error parsing issues JSON:', jsonError);
      issues = [{ issue: "Error parsing issues", impact: "Could not generate detailed issues list", priority: "medium" }];
    }

    // Prepare the response
    const analysis = {
      mainPage: {
        title: basicInfo.title,
        description: basicInfo.metaDescription,
        h1: basicInfo.h1Text,
        url: url,
        screenshot: `data:image/jpeg;base64,${screenshotBase64}`
      },
      assets: {
        links: basicInfo.linkCount,
        images: basicInfo.imageCount
      },
      content: {
        wordCount: basicInfo.wordCount,
        mobileOptimized: basicInfo.mobileOptimized
      },
      issues: issues,
      aiAnalysis: aiAnalysis,
      analysisType: 'lightweight'
    };

    return res.status(200).json(analysis);
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
    
    return res.status(500).json({ 
      error: error.message || 'Failed to analyze website',
      suggestion: 'Please try again later or contact support if the issue persists.'
    });
  }
}

/**
 * Handler for generate-solution endpoint
 */
async function handleGenerateSolution(req, res) {
  try {
    const { issue } = req.body;
    
    if (!issue) {
      return res.status(400).json({ error: 'Issue description is required' });
    }
    
    console.log('Generating solution for issue:', issue);
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Categorize the issue
    const category = categorizeIssue(issue);
    console.log('Issue category:', category);
    
    // Get the system prompt based on the category
    const systemPrompt = getSystemPromptForCategory(category);
    
    // Generate the solution
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please provide a solution for this website issue: "${issue}"` }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });
      
      const solution = response.choices[0].message.content;
      console.log('Solution generated successfully');
      
      return res.status(200).json({ 
        solution,
        category,
        issue
      });
    } catch (aiError) {
      console.error('Error generating solution with OpenAI:', aiError);
      
      // Try to generate a fallback solution
      const fallbackSolution = generateFallbackSolution(issue);
      
      return res.status(200).json({ 
        solution: fallbackSolution,
        category,
        issue,
        fallback: true
      });
    }
  } catch (error) {
    console.error('Error in generate-solution endpoint:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to generate solution',
      suggestion: 'Please try again later or contact support.'
    });
  }
}

// Helper function to categorize issues
function categorizeIssue(issue) {
  // Convert to lowercase for better matching
  const lowerIssue = issue.toLowerCase();
  
  // Define categories and their keywords
  const categories = {
    "seo": ["seo", "search engine", "meta description", "meta tag", "title tag", "keyword", "ranking", "index", "sitemap", "canonical"],
    "performance": ["speed", "performance", "load time", "loading", "slow", "fast", "optimize", "optimization", "core web vitals", "fcp", "lcp", "cls", "ttfb"],
    "design": ["design", "layout", "visual", "appearance", "color", "font", "typography", "spacing", "responsive", "mobile", "desktop", "ui", "user interface"],
    "content": ["content", "text", "copy", "writing", "message", "information", "readability", "grammar", "spelling", "tone", "voice", "word count"],
    "accessibility": ["accessibility", "a11y", "alt text", "aria", "keyboard", "screen reader", "contrast", "wcag", "disability", "accessible"],
    "ux": ["user experience", "ux", "navigation", "menu", "usability", "interface", "interaction", "ease of use", "user-friendly", "intuitive", "confusing"],
    "conversion": ["conversion", "cta", "call to action", "button", "lead", "sale", "bounce rate", "funnel", "engagement", "click", "sign up", "subscribe", "checkout"],
    "technical": ["technical", "code", "html", "css", "javascript", "error", "bug", "404", "broken", "infrastructure", "hosting", "backend", "frontend", "api"]
  };
  
  // Find the best matching category
  let bestMatch = "general";
  let highestMatchCount = 0;
  
  for (const [category, keywords] of Object.entries(categories)) {
    const matchCount = keywords.filter(keyword => lowerIssue.includes(keyword)).length;
    if (matchCount > highestMatchCount) {
      highestMatchCount = matchCount;
      bestMatch = category;
    }
  }
  
  return bestMatch;
}

// Helper function to get system prompt based on category
function getSystemPromptForCategory(category) {
  const prompts = {
    "seo": "You are an SEO expert. Provide a detailed solution to improve search engine optimization for websites. Include specific technical steps, best practices, and explain how these changes will impact search rankings.",
    "performance": "You are a website performance optimization specialist. Explain how to improve website speed and performance with specific technical recommendations. Include code examples where relevant and explain the expected performance impact.",
    "design": "You are a web design expert. Provide a detailed solution to improve website design, focusing on visual appeal, layout, typography, and responsive design principles.",
    "content": "You are a content strategy expert. Provide specific recommendations to improve website content quality, readability, engagement, and conversion potential.",
    "accessibility": "You are a web accessibility specialist. Provide detailed solutions to make websites more accessible, following WCAG guidelines and best practices for inclusive design.",
    "ux": "You are a UX design expert. Provide detailed solutions to improve website usability, user journey, navigation, and overall user experience based on best practices.",
    "conversion": "You are a conversion rate optimization specialist. Provide detailed strategies to improve website conversion rates with specific recommendations for CTAs, funnels, and user engagement.",
    "technical": "You are a web development expert. Provide technical solutions to fix website code issues, with specific code examples and implementation instructions.",
    "general": "You are a website optimization expert. Provide a comprehensive solution to improve website performance, user experience, and business outcomes."
  };
  
  return prompts[category] || prompts.general;
}

// Helper function to generate fallback solution if AI fails
function generateFallbackSolution(issue) {
  // Basic fallback solutions by issue pattern
  if (issue.toLowerCase().includes("seo")) {
    return "To improve SEO, ensure your page has a descriptive title tag, meta description, and properly structured headings. Use relevant keywords naturally in your content, improve page loading speed, and make sure your site is mobile-friendly. Build quality backlinks and create a sitemap.xml file.";
  } 
  else if (issue.toLowerCase().includes("performance") || issue.toLowerCase().includes("speed")) {
    return "To improve website performance, optimize image sizes, enable browser caching, minify CSS/JavaScript files, use a content delivery network (CDN), and consider upgrading your hosting. Remove unnecessary plugins and scripts, and implement lazy loading for images and videos.";
  }
  else if (issue.toLowerCase().includes("mobile") || issue.toLowerCase().includes("responsive")) {
    return "To improve mobile responsiveness, implement a flexible grid layout, use relative units (% or rem) instead of fixed pixels, add appropriate viewport meta tags, test on multiple devices, and consider a mobile-first design approach. Ensure touch targets are at least 44x44 pixels and text is readable without zooming.";
  }
  else if (issue.toLowerCase().includes("accessibility")) {
    return "To improve accessibility, add alt text to all images, ensure sufficient color contrast, make your site keyboard navigable, use semantic HTML elements, implement ARIA attributes where needed, and provide text alternatives for non-text content. Test with screen readers and ensure focus states are visible.";
  }
  else {
    return "To fix this issue, review industry best practices and conduct user testing to identify specific improvements. Consider consulting with a specialist who can provide tailored recommendations for your website. In the meantime, examine competitor websites for inspiration on potential solutions.";
  }
} 