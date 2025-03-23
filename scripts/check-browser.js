#!/usr/bin/env node

/**
 * This script checks if Chrome/Chromium is available for Puppeteer
 * and provides helpful information for debugging browser issues.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Setup dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a require function
const require = createRequire(import.meta.url);

// ANSI colors for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bright: '\x1b[1m'
};

function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

log('╔════════════════════════════════════════════════════════════╗', colors.cyan);
log('║              Chrome/Puppeteer Environment Check            ║', colors.cyan + colors.bright);
log('╚════════════════════════════════════════════════════════════╝', colors.cyan);

// Check environment
log('\n📊 Environment Information:', colors.yellow + colors.bright);
log(`Platform: ${process.platform}`);
log(`Architecture: ${process.arch}`);
log(`Node.js: ${process.version}`);

// Check if running in CI/Vercel
const isCI = process.env.CI === 'true' || !!process.env.VERCEL;
log(`CI Environment: ${isCI ? 'Yes' : 'No'}`);
if (process.env.VERCEL) {
  log(`Vercel Environment: Yes (${process.env.VERCEL_REGION || 'unknown region'})`);
}

// Check package.json for puppeteer/chrome versions
log('\n📦 Package Versions:', colors.yellow + colors.bright);
try {
  const packageJson = require('../package.json');
  
  log(`chrome-aws-lambda: ${packageJson.dependencies['chrome-aws-lambda'] || 'Not installed'}`);
  log(`puppeteer-core: ${packageJson.dependencies['puppeteer-core'] || 'Not installed'}`);
  log(`puppeteer: ${packageJson.devDependencies['puppeteer'] || 'Not installed'}`);
} catch (error) {
  log(`Error reading package.json: ${error.message}`, colors.red);
}

// Check for Chrome/Chromium binary
log('\n🔍 Looking for Chrome/Chromium binaries:', colors.yellow + colors.bright);

// Common Chrome paths
const chromePaths = [
  // Linux
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  
  // Mac
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  
  // Windows
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  
  // Lambda layers
  '/tmp/chromium/chrome',
  '/opt/chrome/chrome',
  '/var/task/node_modules/chrome-aws-lambda/bin'
];

let foundChrome = false;

chromePaths.forEach(chromePath => {
  if (fs.existsSync(chromePath)) {
    log(`✅ Found Chrome at: ${chromePath}`, colors.green);
    
    try {
      const version = execSync(`"${chromePath}" --version`).toString().trim();
      log(`  Version: ${version}`, colors.green);
      foundChrome = true;
    } catch (error) {
      log(`  ⚠️ Found Chrome binary but couldn't get version: ${error.message}`, colors.yellow);
    }
  }
});

if (!foundChrome) {
  log('❌ No Chrome binaries found in common locations.', colors.yellow);
  log('  This is expected in serverless environments (Vercel/Lambda).', colors.yellow);
  log('  chrome-aws-lambda will attempt to download/extract Chrome at runtime.', colors.yellow);
}

// Show relevant environment variables
log('\n🔧 Environment Variables:', colors.yellow + colors.bright);
const relevantVars = [
  'PUPPETEER_SKIP_CHROMIUM_DOWNLOAD',
  'PUPPETEER_EXECUTABLE_PATH',
  'CHROME_AWS_LAMBDA_CHROMIUM_EXECUTABLE_PATH',
  'CHROME_AWS_LAMBDA_CACHE_DIR',
  'AWS_LAMBDA_FUNCTION_NAME',
  'AWS_REGION',
  'VERCEL_REGION'
];

relevantVars.forEach(varName => {
  if (process.env[varName]) {
    log(`${varName}: ${process.env[varName]}`);
  } else {
    log(`${varName}: Not set`);
  }
});

log('\n✅ Browser check complete. See above for diagnostic information.', colors.green + colors.bright);
log('  If you encounter browser issues at runtime, refer to:', colors.white);
log('  PUPPETEER_VERCEL_TROUBLESHOOTING.md', colors.cyan);
log('\n'); 