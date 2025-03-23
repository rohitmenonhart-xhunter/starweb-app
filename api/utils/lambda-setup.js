/**
 * Special configurations and setup procedures for AWS Lambda/Vercel
 */

/**
 * Detects if we're running in a serverless environment
 * @returns {boolean} True if running in serverless environment
 */
export function isServerless() {
  return !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
}

/**
 * Detects the AWS Lambda region we're running in
 * @returns {string} AWS region
 */
export function getRegion() {
  return process.env.AWS_REGION || 
    process.env.VERCEL_REGION || 
    'us-east-1'; // Default to us-east-1 if not specified
}

/**
 * Updates process.env with required environment variables for chrome-aws-lambda
 */
export function setupChromeAwsLambda() {
  if (!isServerless()) {
    console.log('Not running in serverless environment, skipping chrome-aws-lambda setup');
    return;
  }

  // Configure CHROME_AWS_LAMBDA env vars if they don't exist
  if (!process.env.CHROME_AWS_LAMBDA_CHROMIUM_EXECUTABLE_PATH) {
    process.env.CHROME_AWS_LAMBDA_CHROMIUM_EXECUTABLE_PATH = '/tmp/chromium/chrome';
  }
  
  if (!process.env.CHROME_AWS_LAMBDA_CACHE_DIR) {
    process.env.CHROME_AWS_LAMBDA_CACHE_DIR = '/tmp';
  }

  if (!process.env.AWS_EXECUTION_ENV) {
    process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_nodejs';
  }

  if (!process.env.AWS_REGION) {
    process.env.AWS_REGION = getRegion();
  }

  // Force a non-downloading environment for speed
  process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';

  console.log('Chrome AWS Lambda environment configured:', {
    executablePath: process.env.CHROME_AWS_LAMBDA_CHROMIUM_EXECUTABLE_PATH,
    cacheDir: process.env.CHROME_AWS_LAMBDA_CACHE_DIR,
    region: process.env.AWS_REGION
  });
}

/**
 * Gets paths to common library locations on Lambda
 * @returns {Object} Object with library paths
 */
export function getLibraryPaths() {
  return {
    libnss3: [
      '/var/lang/lib/libnss3.so', // Lambda runtime location
      '/lib64/libnss3.so',         // Possible system location
      '/usr/lib64/libnss3.so'      // Another possible location
    ]
  };
}

// Export everything together as a setup function
export function setupLambdaEnvironment() {
  setupChromeAwsLambda();
  return {
    isServerless: isServerless(),
    region: getRegion(),
    libraryPaths: getLibraryPaths()
  };
} 