# Troubleshooting Puppeteer on Vercel

This guide addresses the most common issues when running Puppeteer in Vercel's serverless functions.

## Common Errors and Solutions

### Error: Could not find browser revision 843427

**Solution:**
We've implemented a custom Chrome AWS Lambda setup:

1. We've set exact version matches for both `chrome-aws-lambda` and `puppeteer-core` (10.1.0)
2. We've created an installation helper that ensures the browser is properly set up
3. We've added browser diagnostic endpoints to help with debugging

Test the browser installation by visiting:
```
https://your-vercel-deployment.vercel.app/api/browser-check
```

### Error: libnss3.so not found

This error indicates that Chrome is missing required libraries.

**Solution:**

We've made the following changes:
1. Updated `vercel.json` with the necessary environment variables
2. Set compatible versions of `chrome-aws-lambda` and `puppeteer-core`
3. Created a browser launcher that handles Vercel-specific requirements

### Error: Failed to launch the browser process

This often happens due to:
- Missing dependencies
- Incorrect executable paths
- Permission issues

**Solution:**
Our implementation tries multiple strategies:
1. First using chrome-aws-lambda's provided path and options
2. Falling back to explicit browser configurations if the first attempt fails
3. Implementing an installation helper that ensures proper permissions

## Checking Browser Status

You can check the status of your browser installation by visiting:
```
https://your-vercel-deployment.vercel.app/api/browser-check
```

This will provide a diagnostic report with:
- Environment details
- Browser installation status
- Chrome version information
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
3. Verify your `package.json` has the correct dependencies
4. Make sure your `vercel.json` includes the proper environment variables

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