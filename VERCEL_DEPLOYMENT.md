# Deploying to Vercel

This document provides detailed instructions for deploying the StarWeb application to Vercel.

## Prerequisites

1. A GitHub account
2. A Vercel account (free tier works fine)
3. OpenAI API key
4. Email account credentials (for sending reports)

## Step 1: Prepare your repository

If you're starting from this repository:

1. Fork this repository to your GitHub account
2. Clone your forked repository to your local machine
3. Make any desired changes
4. Push the changes to your GitHub repository

## Step 2: Set up Vercel

### Option 1: Deploy from the Vercel Dashboard

1. Sign up for a [Vercel account](https://vercel.com/signup) if you don't already have one
2. Connect your GitHub account to Vercel
3. Import your GitHub repository into Vercel
   - Go to the Vercel dashboard and click "Add New..."
   - Select "Project"
   - Select your GitHub repository
   
### Option 2: Deploy using the Vercel CLI

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Log in to your Vercel account:
   ```bash
   vercel login
   ```

3. Navigate to your project directory and deploy:
   ```bash
   cd /path/to/your/project
   vercel
   ```

4. Follow the prompts to configure your project:
   - Set up and deploy? Yes
   - Which scope? Select your account
   - Link to existing project? No (unless you've already created one)
   - What's your project name? (Choose a name)
   - In which directory is your code located? ./ (or your specific directory)
   - Want to override settings? Yes
   - Which settings would you like to override? Environment Variables (at minimum)

5. Add your environment variables when prompted:
   - OPENAI_API_KEY
   - EMAIL_USER
   - EMAIL_PASS
   - EMAIL_SERVICE (if not using Gmail)

## Step 3: Configure environment variables

During the import process or after deployment, you'll need to set up the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `EMAIL_USER` | Your email address | Yes, for email functionality |
| `EMAIL_PASS` | Your email app password | Yes, for email functionality |
| `EMAIL_SERVICE` | Email service (default: gmail) | No |

For Gmail accounts, you need to use an App Password rather than your normal password. See [Google's documentation](https://support.google.com/accounts/answer/185833) for more information.

### Adding environment variables via the Dashboard

1. Go to your project in the Vercel dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables" in the left sidebar
4. Add each environment variable and its value
5. Make sure to select all deployment environments (Production, Preview, Development)
6. Click "Save" to apply the changes

### Adding environment variables via the CLI

You can also add environment variables using the Vercel CLI:

```bash
vercel env add OPENAI_API_KEY
# Enter the value when prompted

vercel env add EMAIL_USER
# Enter the value when prompted

vercel env add EMAIL_PASS
# Enter the value when prompted

# If not using Gmail
vercel env add EMAIL_SERVICE
# Enter the value when prompted
```

After adding all environment variables, redeploy your application:

```bash
vercel --prod
```

## Step 4: Deploy

1. Click "Deploy" to start the deployment process
2. Vercel will automatically build and deploy your application
3. Once deployed, Vercel will provide you with a URL for your application

## Step 5: Testing your deployment

1. Visit the URL provided by Vercel
2. Test the application by analyzing a website
3. Check the email functionality by sharing a report
4. Test the AI solution generator

## Troubleshooting

### Error: The serverless function has crashed

This error might occur if:
- Your serverless function exceeds the memory limit
- Puppeteer is not properly configured

**Solution**:
- Check the Vercel build logs
- Ensure Puppeteer is properly configured for serverless environments
- Consider using `chrome-aws-lambda` instead of regular Puppeteer
- Increase the memory limit in vercel.json (we've set it to 3008MB)

### Error: Environment variables not accessible

**Solution**:
- Verify that you've properly set the environment variables in the Vercel dashboard
- Ensure the variables are set on the production environment (not just preview)
- Redeploy after setting environment variables with `vercel --prod`

### Error: Email functionality not working

**Solution**:
- Verify your email credentials
- For Gmail, ensure you're using an App Password
- Check the logs in the Vercel dashboard

### Error: Puppeteer failing to launch in Vercel

**Solution**:
- Make sure you're using the correct versions of chrome-aws-lambda (^6.0.0) and puppeteer-core (^6.0.0)
- Verify that the chromium.js utility file is correctly set up
- Check if you need to increase the memory limit in vercel.json

## Updating your deployment

When you push changes to your GitHub repository, Vercel will automatically rebuild and redeploy your application. You can also force a deployment using the CLI:

```bash
vercel --prod
```

## Conclusion

Your StarWeb application should now be successfully deployed to Vercel and accessible via the provided URL. If you encounter any issues or have questions, refer to the [Vercel documentation](https://vercel.com/docs) or open an issue in the GitHub repository. 