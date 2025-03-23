# StarWeb - Website Analysis Tool

StarWeb is a comprehensive website analysis tool that helps identify design issues, exit points, and provides recommendations for improvement.

## Features

- Visual analysis of web pages
- Performance and accessibility assessment
- Content quality evaluation
- SEO recommendations
- Email sharing of analysis reports
- PDF and Word report generation

## Deployment Options

### Vercel Deployment (Recommended)

This application is optimized for deployment on Vercel with serverless functions:

1. Fork or clone this repository to your GitHub account
2. Sign up for a [Vercel account](https://vercel.com/signup) if you don't have one
3. Import your GitHub repository into Vercel
4. Set up the required environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `EMAIL_USER`: Your email address (for sending reports)
   - `EMAIL_PASS`: Your email app password
   - `EMAIL_SERVICE`: Email service (default: gmail)
5. Deploy the application

You can also deploy directly to Vercel with the button below:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fstarweb&env=OPENAI_API_KEY,EMAIL_USER,EMAIL_PASS,EMAIL_SERVICE)

### Docker Setup (Alternative)

This project is containerized using Docker, making it easy to set up and run in any environment.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Environment Variables

The application requires environment variables for API keys and email configuration. These are managed through a `.env` file in the root directory.

When you run the `docker-build.sh` script, it will automatically check for a `.env` file and create one if it doesn't exist. You'll then need to edit this file with your actual values:

```
# OpenAI API Key (required for AI analysis)
OPENAI_API_KEY=your_openai_api_key

# Email configuration (required for email sharing)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_SERVICE=gmail
```

**Important Notes:**
- The `.env` file is mounted as a volume in the Docker container, so any changes you make to it will be reflected in the container.
- For Gmail, you need to use an App Password. See [Google's documentation](https://support.google.com/accounts/answer/185833) for more information.
- The `.env` file is excluded from version control for security reasons.

### Quick Start

We provide a convenient script to build and run the Docker container:

```bash
# Make the script executable (if needed)
chmod +x docker-build.sh

# Build and start the container
./docker-build.sh build
```

The script will:
1. Check for a `.env` file and create one if it doesn't exist
2. Prompt you to edit the `.env` file if needed
3. Build and start the Docker container

The application will be available at http://localhost:3001.

### Other Commands

- Start existing container: `./docker-build.sh start`
- Stop container: `./docker-build.sh stop`
- Restart container: `./docker-build.sh restart`
- View logs: `./docker-build.sh logs`
- Clean up Docker resources: `./docker-build.sh clean`
- Show help: `./docker-build.sh help`

### Troubleshooting Docker Issues

If you encounter issues with the Docker setup:

1. Make sure Docker and Docker Compose are installed and running
2. Check if the required ports (3001) are available and not used by other applications
3. Verify that your `.env` file contains valid API keys
4. Check the logs for errors: `./docker-build.sh logs`
5. Try rebuilding the container: `./docker-build.sh build`

## Manual Setup (without Docker)

If you prefer to run the application without Docker:

1. Create a `.env` file in the root directory with the required environment variables (see above)

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Start the production server:
   ```bash
   node server.js
   ```

## How It Works

1. Enter a URL in the analysis tool
2. The tool captures a screenshot of the website
3. It analyzes the design, content, and assets using AI
4. It identifies potential exit points where users might leave
5. It highlights design issues that could be improved
6. It provides specific, actionable recommendations

## License

[MIT](LICENSE) 