/**
 * Centralizes error handling for browser issues
 */

/**
 * Checks if error is specifically a browser missing error
 * @param {Error} error The error to check
 * @returns {boolean} True if it's a browser missing error
 */
export function isBrowserMissingError(error) {
  const message = error?.message?.toLowerCase() || '';
  return (
    message.includes('could not find browser revision') ||
    message.includes('failed to launch the browser process') ||
    message.includes('libnss3.so') ||
    message.includes('chrome executable')
  );
}

/**
 * Gets a user-friendly error message for browser issues
 * @param {Error} error The browser error
 * @returns {Object} User-friendly error message and suggestions
 */
export function getBrowserErrorResponse(error) {
  // Check if it's a browser missing error
  if (isBrowserMissingError(error)) {
    return {
      error: 'Browser Launch Error',
      message: error.message,
      suggestion: 'The server is having trouble launching Chrome. Please try the browser-check endpoint for diagnostics.',
      troubleshooting: [
        'Try using the /api/browser-check endpoint to diagnose the issue',
        'Try using the lightweight analyze endpoint instead',
        'Check Vercel logs for detailed error information'
      ]
    };
  }

  // Generic browser error
  return {
    error: 'Browser Error',
    message: error.message,
    suggestion: 'An error occurred with the browser. Please try again later.'
  };
}

/**
 * Safely closes a browser instance if it exists
 * @param {Browser} browser The browser instance to close
 */
export async function safeCloseBrowser(browser) {
  if (browser) {
    try {
      console.log('Safely closing browser...');
      await browser.close();
      console.log('Browser closed successfully');
    } catch (error) {
      console.error('Error closing browser:', error);
    }
  }
} 