import dotenv from 'dotenv';
import fs from 'fs';
import { OpenAI } from 'openai';
import { getBrowserInfo, ensureBrowser } from './utils/install-browser.js';
import { launchBrowser } from './utils/browser.js';

// Load environment variables
dotenv.config();

export default async function handler(req, res) {
  // Parse the endpoint from the path
  const { endpoint } = req.query;
  
  console.log(`Processing combined-utils request for endpoint: ${endpoint}`);
  
  switch (endpoint) {
    case 'browser-check':
      return handleBrowserCheck(req, res);
    case 'health':
      return handleHealth(req, res);
    case 'test-email-config':
      return handleEmailConfig(req, res);
    default:
      return res.status(404).json({ error: 'Endpoint not found' });
  }
}

/**
 * Handler for browser-check endpoint
 */
async function handleBrowserCheck(req, res) {
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
  return res.status(200).json(diagnostics);
}

/**
 * Handler for health endpoint
 */
async function handleHealth(req, res) {
  const healthStatus = {
    status: 'ok',
    components: {
      api: { status: 'ok' },
      openai: { status: 'unknown' },
      browser: { status: 'unknown' },
      environment: { status: 'unknown' }
    },
    timestamp: new Date().toISOString(),
    serverInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage()
    }
  };

  // Check OpenAI API connectivity
  try {
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "user", content: "Hello" }
        ],
        max_tokens: 5
      });
      
      healthStatus.components.openai = {
        status: 'ok',
        model: "gpt-3.5-turbo"
      };
    } else {
      healthStatus.components.openai = {
        status: 'warning',
        message: 'OPENAI_API_KEY not configured'
      };
    }
  } catch (error) {
    healthStatus.components.openai = {
      status: 'error',
      message: error.message
    };
    healthStatus.status = 'degraded';
  }

  // Check browser availability
  try {
    const browser = await launchBrowser();
    if (browser) {
      await browser.close();
      healthStatus.components.browser = {
        status: 'ok',
        engine: 'Puppeteer'
      };
    }
  } catch (error) {
    healthStatus.components.browser = {
      status: 'error',
      message: error.message
    };
    healthStatus.status = 'degraded';
  }

  // Check environment variables
  const requiredEnvVars = ['OPENAI_API_KEY'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length === 0) {
    healthStatus.components.environment = {
      status: 'ok'
    };
  } else {
    healthStatus.components.environment = {
      status: 'warning',
      missingVars: missingEnvVars
    };
    healthStatus.status = 'degraded';
  }

  // If any components have errors, return a 503 status code
  if (Object.values(healthStatus.components).some(component => component.status === 'error')) {
    healthStatus.status = 'error';
    return res.status(503).json(healthStatus);
  }

  // If any components have warnings, return a 200 but with degraded status
  if (Object.values(healthStatus.components).some(component => component.status === 'warning')) {
    healthStatus.status = 'degraded';
  }

  return res.status(200).json(healthStatus);
}

/**
 * Handler for email config test endpoint
 */
function handleEmailConfig(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Testing email configuration');
  
  const emailConfig = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER ? process.env.EMAIL_USER : 'Not configured',
    passConfigured: process.env.EMAIL_PASS ? true : false
  };
  
  console.log('Email configuration:', {
    service: emailConfig.service,
    user: emailConfig.user.substring(0, 5) + '...',
    passConfigured: emailConfig.passConfigured
  });
  
  return res.status(200).json({
    success: true,
    config: {
      service: emailConfig.service,
      user: emailConfig.user.substring(0, 5) + '...',
      passConfigured: emailConfig.passConfigured
    }
  });
} 