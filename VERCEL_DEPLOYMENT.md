# Deploying to Vercel

This guide explains how to deploy the StarWeb application to Vercel, addressing common issues and providing best practices.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Node.js](https://nodejs.org/) installed locally
3. [Vercel CLI](https://vercel.com/docs/cli) (optional, but recommended for troubleshooting)
4. An OpenAI API key

## Deployment Steps

### 1. Prepare Your Repository

Make sure your repository is ready for deployment:

```bash
# Install dependencies
npm install

# Test that the app works locally
npm run dev
```

### 2. Configure Environment Variables

Create a `.env` file in your project root with the following variables:

```
OPENAI_API_KEY=your_openai_api_key
```

You'll need to add these same environment variables in the Vercel dashboard during deployment.

### 3. Deploy to Vercel

#### Option A: Deploy via GitHub Integration (Recommended)

1. Push your code to a GitHub repository
2. Log in to the [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New..." > "Project"
4. Select your GitHub repository
5. Configure project settings:
   - Set the framework preset to "Vite"
   - Add your environment variables from step 2
   - Under "Build and Output Settings," ensure:
     - Build Command: `npm run build`
     - Output Directory: `dist`
6. Click "Deploy"

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI if you haven't already
npm i -g vercel

# Deploy to Vercel
vercel

# Follow the prompts to configure your project
```

## Memory Management for Vercel Hobby Plan

The Vercel Hobby plan has a memory limit of 1024MB. The StarWeb application has been optimized to work within these constraints by:

1. Using lightweight browser configurations in `api/utils/browser.js`
2. Implementing a specialized analysis endpoint for memory-constrained environments
3. Using optimized models (gpt-3.5-turbo instead of gpt-4o)

### Plan Limits

| Plan | Memory Limit | Function Duration |
|------|--------------|-------------------|
| Hobby | 1024 MB | 10s (Edge), 60s (Serverless) |
| Pro | 3008 MB | 900s |
| Enterprise | 4096 MB | 900s |

## Troubleshooting

### Browser Launch Issues

If you encounter browser launch issues, check the health endpoint to diagnose problems:

```
https://your-vercel-deployment.vercel.app/api/health
```

Common browser-related issues:

1. **Chrome Executable Not Found**: The deployment is attempting to find a Chrome executable. This has been addressed in the `browser.js` utility which tries multiple paths.

2. **Memory Limitations**: If the browser fails to launch due to memory constraints, consider:
   - Using the lightweight analyze endpoint
   - Upgrading to the Vercel Pro plan

### Environment Variables

If the health check indicates missing environment variables:

1. Log in to the Vercel Dashboard
2. Select your project
3. Go to "Settings" > "Environment Variables"
4. Add or update the required variables

### Function Execution Timeouts

If analysis is timing out:

1. Check the function logs in Vercel Dashboard
2. Consider using the lightweight analysis endpoint
3. If necessary, upgrade to Vercel Pro for longer execution times

## Monitoring

Monitor your deployment using:

1. **Vercel Analytics**: Enable in the Vercel Dashboard
2. **Custom Health Checks**: The `/api/health` endpoint provides detailed status information
3. **Vercel Logs**: Check function execution logs for errors

## Upgrading

If you need more resources, consider:

1. **Upgrading to Vercel Pro**: Increases memory limit to 3008MB
2. **Using Edge Functions**: For certain endpoints that can benefit from the Edge network
3. **Optimizing Local Analysis**: Use the app locally for intensive analysis tasks 