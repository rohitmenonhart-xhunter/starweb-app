#!/bin/bash

# This script is used as a custom build command for Vercel deployments
echo "Starting custom Vercel build process..."

# Start with a standard build
echo "Building project with Vite..."
npm run build

# Run browser dependency installation
echo "Setting up browser dependencies..."
node api/install-browser-deps.js

# Log package versions
echo "Checking installed versions of critical packages:"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Puppeteer version:"
grep '"puppeteer"' package.json
echo "Chrome AWS Lambda version:"
grep '"chrome-aws-lambda"' package.json

# Check for important environment variables
echo "Checking environment variables:"
if [ -n "$PUPPETEER_SKIP_CHROMIUM_DOWNLOAD" ]; then 
  echo "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD is set to: $PUPPETEER_SKIP_CHROMIUM_DOWNLOAD"
else
  echo "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD is not set"
fi

if [ -n "$CHROME_AWS_LAMBDA_CHROMIUM_EXECUTABLE_PATH" ]; then 
  echo "CHROME_AWS_LAMBDA_CHROMIUM_EXECUTABLE_PATH is set to: $CHROME_AWS_LAMBDA_CHROMIUM_EXECUTABLE_PATH"
else
  echo "CHROME_AWS_LAMBDA_CHROMIUM_EXECUTABLE_PATH is not set"
fi

# Check the file size of chrome-aws-lambda
echo "Checking chrome-aws-lambda installation:"
du -sh ./node_modules/chrome-aws-lambda 2>/dev/null || echo "chrome-aws-lambda not found"

# Success message
echo "Custom build process completed successfully!"
exit 0 