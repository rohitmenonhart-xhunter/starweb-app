# Quick Guide: Deploying StarWeb to Vercel

This guide provides a simplified approach to deploying the StarWeb application to Vercel. For more detailed instructions, see [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md).

## One-Click Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fstarweb&env=OPENAI_API_KEY,EMAIL_USER,EMAIL_PASS,EMAIL_SERVICE)

## Manual Deployment Steps

### 1. Fork & Clone the Repository

```bash
git clone https://github.com/yourusername/starweb.git
cd starweb
```

### 2. Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

Follow the prompts to configure your project and add environment variables.

### 3. Required Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `EMAIL_USER` | Your email address (for sending reports) |
| `EMAIL_PASS` | Your email app password |
| `EMAIL_SERVICE` | Email service (default: gmail) |

### 4. Test Your Deployment

Visit your deployed URL and test the main features:
- Website analysis
- AI solution generation
- Email sharing

### 5. Common Issues & Solutions

- **Puppeteer fails to launch**: We've configured chrome-aws-lambda v6.0.0 for compatibility. If issues persist, check Vercel logs.
- **Function timeout**: We've set function timeout to 60 seconds. Complex analyses may need optimization.
- **Environment variables not working**: Verify they are set in Vercel dashboard and redeploy.

### 6. Update Your Deployment

Commit and push to your repository, Vercel will automatically redeploy.

```bash
git add .
git commit -m "Update application"
git push
```

Or force a deployment:

```bash
vercel --prod
``` 