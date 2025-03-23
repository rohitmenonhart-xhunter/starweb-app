import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { launchBrowser } from './utils/browser.js';

// Load environment variables
dotenv.config();

export default async function handler(req, res) {
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