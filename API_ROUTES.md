# StarWeb API Routes

This document describes the API endpoints available in the StarWeb application. Due to the Vercel Hobby plan limitation of 12 serverless functions, we've consolidated several endpoints into combined handlers.

## API Endpoints

### Core Analysis

- **`/api/analyze`**: Main lightweight analysis endpoint (standalone)
  - Method: `POST`
  - Body: `{ "url": "https://example.com" }`
  - Returns full analysis with optimized memory usage

### Combined Endpoints

#### `/api/analysis` (Combined Analysis Endpoints)

This endpoint handles multiple analysis-related functions:

- **`/api/analysis?endpoint=analyze`**: Full analysis
  - Method: `POST`
  - Body: `{ "url": "https://example.com" }`

- **`/api/analysis?endpoint=analyze-lightweight`**: Lightweight analysis
  - Method: `POST`
  - Body: `{ "url": "https://example.com" }`

- **`/api/analysis?endpoint=generate-solution`**: Generate solution for an issue
  - Method: `POST`
  - Body: `{ "issue": "Issue description" }`

#### `/api/utils` (Combined Utility Endpoints)

This endpoint handles various utility functions:

- **`/api/utils?endpoint=browser-check`**: Check browser installation status
  - Method: `GET`

- **`/api/utils?endpoint=health`**: Check application health
  - Method: `GET`

- **`/api/utils?endpoint=test-email-config`**: Test email configuration
  - Method: `GET`

#### `/api/email` (Combined Email Endpoints)

This endpoint handles email-related functions:

- **`/api/email?endpoint=send-email`**: Send email report
  - Method: `POST`
  - Body: `{ "to": "user@example.com", "subject": "Analysis Report", "html": "<html>content</html>", "siteName": "Site Name", "siteUrl": "https://example.com" }`

- **`/api/email?endpoint=test-config`**: Test email configuration
  - Method: `GET`

- **`/api/email?endpoint=test-send`**: Send a test email
  - Method: `GET` or `POST`
  - Query Parameters: `email` (optional) - the email address to send to
  - Body (POST): `{ "email": "user@example.com" }` (optional)
  - Returns test email sending result

## Deployment Considerations

This API structure is specifically designed to work within the constraints of the Vercel Hobby plan, which limits deployments to 12 serverless functions. By consolidating related endpoints, we've reduced the function count while maintaining all functionality.

If you upgrade to a Vercel Pro plan, you can uncomment additional individual endpoints in `api/index.js` for more granular control.

## Local Development

During local development, all API endpoints will function normally. The consolidation only affects deployment to Vercel. 