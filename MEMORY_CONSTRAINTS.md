# Memory Constraints on Vercel Deployment

## Understanding Vercel Serverless Function Limits

Vercel has different memory constraints depending on your plan:

| Plan | Memory Limit | Function Duration |
|------|--------------|-------------------|
| Hobby (Free) | 1024 MB | 10 seconds (Edge), 60 seconds (Serverless) |
| Pro | 3008 MB | 60 seconds (Edge), 900 seconds (Serverless) |
| Enterprise | 4096 MB | Configurable |

## Our Solution for Hobby Plan Users

The StarWeb application performs intensive website analysis that can be memory-heavy. To accommodate users on the Hobby plan, we've implemented:

1. **Lightweight Analysis Mode**: 
   - Uses less memory by focusing on essential metrics only
   - Blocks unnecessary resources (images, stylesheets)
   - Takes smaller, lower-quality screenshots
   - Reduces the depth of analysis

2. **Optimized Chromium Configuration**:
   - Uses memory-saving browser flags
   - Implements a single-process architecture
   - Disables GPU and other resource-intensive features

3. **Early Resource Cleanup**:
   - Closes browser instances as soon as possible
   - Explicitly runs garbage collection when available

## Options For Full Analysis

If you need the full, detailed analysis capabilities, you have these options:

### 1. Upgrade to Vercel Pro Plan

The Pro plan provides 3008 MB of memory, which is sufficient for our full analysis. Benefits:

- Complete in-depth analysis
- Longer function execution time (up to 900 seconds)
- More generous bandwidth and build execution limits

### 2. Use the Docker Deployment Option

As documented in our README, you can run the application using Docker:

```bash
./docker-build.sh build
```

This approach runs the application on your own infrastructure, without the memory limitations of serverless functions.

### 3. Run the Application Locally

You can run the application locally during development:

```bash
npm run dev
```

This gives you the full analysis capabilities on your local machine.

## Lightweight vs. Full Analysis

| Feature | Lightweight Analysis | Full Analysis |
|---------|---------------------|---------------|
| Memory Usage | ~800MB | ~2500MB |
| Screenshot | Partial, lower quality | Full page, high quality |
| Resource Analysis | Basic count | Detailed with recommendations |
| Content Analysis | Word count, basic structure | In-depth content quality analysis |
| SEO Analysis | Basic metrics | Comprehensive SEO evaluation |
| Accessibility | Basic checks | Detailed accessibility audit |
| Performance | Basic metrics | Full performance analysis |
| AI Recommendations | Limited | Comprehensive |

## Further Optimization

If you're experiencing issues with the lightweight analysis on the Hobby plan, try these options:

1. **Analyze simpler websites** first (fewer images, less JavaScript)
2. **Use the solution generator** separately from the analyzer
3. **Generate reports locally** rather than on the server
4. **Disable screenshot capture** in the query parameters

Contact us if you need help optimizing your specific use case. 