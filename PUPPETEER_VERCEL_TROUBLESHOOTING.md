# Troubleshooting Puppeteer on Vercel

This guide addresses the most common issues when running Puppeteer in Vercel's serverless functions.

## Common Errors and Solutions

### Error: Could not find browser revision 843427

**The Problem:** 
This specific error appears when Puppeteer cannot locate the required Chrome revision. It tries to find an exact version (843427) but fails.

**Root Causes:**
1. Vercel's serverless environment doesn't include Chrome by default
2. The `chrome-aws-lambda` package needs compatible versions with `puppeteer-core`
3. Mismatch between the Chrome version Puppeteer expects and what's available

**Solution:**
We've implemented a multi-layered approach to fix this:

1. We've set exact version matches for both `chrome-aws-lambda` and `puppeteer-core` (10.1.0)
2. Created a browser installation helper that ensures the browser is properly set up
3. Added a direct S3 download fallback method to get Chrome if the default method fails
4. Added browser diagnostic endpoints to help with debugging

Test the browser installation by visiting:
```
https://your-vercel-deployment.vercel.app/api/browser-check
```

### Error: libnss3.so not found

**The Problem:**
This error indicates that Chrome is missing required system libraries. The error message specifically mentions `libnss3.so`.

**Root Causes:**
1. Chrome requires certain libraries that may not be available in the serverless environment
2. Chrome is looking for libraries in locations that don't exist in Vercel

**Solution:**
Our implementation includes:

1. Updated `vercel.json` with the necessary environment variables
2. Added checks for common locations of the required libraries
3. Created a browser launcher that handles Vercel-specific requirements and fallbacks
4. Updated API endpoints to use the new browser launcher with better error handling

### Error: Failed to launch the browser process

**The Problem:**
This error indicates Chrome couldn't start properly, even if the executable was found.

**Root Causes:**
- Missing dependencies
- Incorrect executable paths
- Permission issues
- Memory constraints

**Solution:**
Our implementation tries multiple strategies:

1. First using `chrome-aws-lambda`'s provided path and options
2. Implementing fallback options with memory-optimized settings
3. Using a last-resort minimal configuration if other methods fail
4. Setting proper executable permissions on Chrome files
5. Downloading Chrome directly from S3 if needed

## Checking Browser Status

You can check the status of your browser installation by visiting:
```
https://your-vercel-deployment.vercel.app/api/browser-check
```

This endpoint provides a detailed diagnostic report with:
- Environment details
- Browser installation status
- Chrome version information
- Available files in the temp directory
- Page creation test results

## Package Version Compatibility

The working combination of packages:
- `chrome-aws-lambda`: 10.1.0
- `puppeteer-core`: 10.1.0

These versions are compatible with Vercel's serverless environment and have been tested to work properly.

## Manual Debugging Steps

If you continue to experience issues:

1. Check the Vercel logs for your deployment
2. Examine the `/api/browser-check` endpoint results
3. Try the `/api/health` endpoint to check all components
4. Verify your `package.json` has the correct dependencies
5. Make sure your `vercel.json` includes the proper environment variables

## Lightweight Analysis Option

We've implemented a lightweight analysis endpoint that uses less memory:

```
https://your-vercel-deployment.vercel.app/api/analyze
```

This endpoint is optimized for Vercel's memory constraints and should work more reliably.

## Common Memory Issues

Puppeteer can be memory-intensive. If you see memory-related errors:

1. Set proper browser launch arguments (we've included memory-saving options in the browser launcher)
2. Use request interception to block non-essential resources
3. Use a lower-resolution viewport
4. Close browser instances as soon as possible after use

## Vercel Pro Plan

If you need to run more intensive browser operations and continue facing issues on the Hobby plan:

1. Consider upgrading to the Vercel Pro plan for increased memory limits (3008MB)
2. Pro plan also offers longer function execution times (up to 900 seconds) 