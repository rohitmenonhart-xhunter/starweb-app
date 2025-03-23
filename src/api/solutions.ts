/**
 * API function to generate personalized solutions using AI
 */

// Define possible API endpoints for AI solutions
const API_ENDPOINTS = [
  'http://localhost:3001/api/generate-solution',
  'http://localhost:3002/api/generate-solution'
];

/**
 * Tries to fetch from multiple endpoints until one succeeds
 * @param issue The issue to generate a solution for
 * @returns A promise that resolves to the response from the first successful endpoint
 */
async function fetchFromMultipleEndpoints(issue: string): Promise<Response> {
  let lastError: Error | null = null;
  
  // Try each endpoint in sequence
  for (const endpoint of API_ENDPOINTS) {
    try {
      console.log(`Attempting to connect to endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ issue }),
        // Short timeout to quickly move to the next endpoint if this one fails
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        console.log(`Successfully connected to endpoint: ${endpoint}`);
        return response;
      } else {
        console.warn(`Endpoint returned non-OK status: ${endpoint}`, response.status, response.statusText);
        lastError = new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn(`Failed to connect to endpoint: ${endpoint}`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continue to the next endpoint
    }
  }
  
  // If we've tried all endpoints and none worked, throw the last error
  throw lastError || new Error('All API endpoints failed');
}

/**
 * Generates a personalized solution for a specific issue using AI
 * @param issue The issue to generate a solution for
 * @returns A promise that resolves to the personalized solution
 */
export async function generatePersonalizedSolution(issue: string): Promise<string> {
  try {
    const response = await fetchFromMultipleEndpoints(issue);
    const data = await response.json();
    return data.solution;
  } catch (error) {
    console.error('Error generating personalized solution:', error);
    
    // Try to generate a solution directly in the browser as a last resort
    try {
      return generateLocalSolution(issue);
    } catch (localError) {
      console.error('Local solution generation also failed:', localError);
      
      // Fallback to a generic solution if all else fails
      return `To fix this issue "${issue}", consider the following steps:

1. Analyze the specific problem mentioned
2. Research best practices for this particular area
3. Implement changes incrementally and test results
4. Get feedback from users or colleagues
5. Continue to monitor and refine your solution

For more specific guidance, consider consulting with a specialist in this area or researching industry standards.`;
    }
  }
}

/**
 * Generates a solution locally in the browser
 * This is a fallback when the server is unavailable
 */
function generateLocalSolution(issue: string): string {
  const issueLower = issue.toLowerCase();
  
  if (issueLower.includes('image') && issueLower.includes('alt')) {
    return `To fix missing alt text on images:

1. Add descriptive alt attributes to all <img> elements
2. Make sure alt text accurately describes the image content
3. Keep alt text concise but informative (typically 5-15 words)
4. For decorative images, use alt="" (empty alt attribute)

Example:
\`\`\`html
<!-- Before -->
<img src="product.jpg">

<!-- After -->
<img src="product.jpg" alt="Red leather office chair with ergonomic design">
\`\`\`

This improves accessibility for screen reader users and helps with SEO.`;
  }
  
  if (issueLower.includes('contrast')) {
    return `To fix contrast issues:

1. Ensure text has sufficient contrast with its background (WCAG AA requires 4.5:1 for normal text)
2. Use tools like WebAIM's Contrast Checker to verify your color combinations
3. Consider adding a semi-transparent background behind text on images
4. Avoid light gray text on white backgrounds or dark gray on black backgrounds

Example CSS fix:
\`\`\`css
/* Before - Poor contrast */
.text {
  color: #999999;
  background-color: #ffffff;
}

/* After - Better contrast */
.text {
  color: #595959;
  background-color: #ffffff;
}
\`\`\`

This makes your content more readable for all users, especially those with visual impairments.`;
  }
  
  if (issueLower.includes('responsive') || issueLower.includes('mobile')) {
    return `To improve responsiveness for mobile devices:

1. Use a mobile-first approach with CSS media queries
2. Implement flexible grid layouts with CSS Grid or Flexbox
3. Use relative units (%, em, rem) instead of fixed pixels
4. Set appropriate viewport meta tag

Example:
\`\`\`css
/* Mobile-first base styles */
.container {
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

/* Tablet and larger */
@media (min-width: 768px) {
  .container {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .item {
    flex: 0 0 50%;
  }
}

/* Desktop and larger */
@media (min-width: 1024px) {
  .item {
    flex: 0 0 33.333%;
  }
}
\`\`\`

Test on multiple devices and screen sizes to ensure a good experience for all users.`;
  }
  
  if (issueLower.includes('load') || issueLower.includes('performance')) {
    return `To improve page load performance:

1. Optimize and compress images (use WebP format where possible)
2. Minify CSS, JavaScript, and HTML
3. Implement lazy loading for images and videos
4. Reduce third-party scripts and plugins
5. Enable browser caching with proper headers
6. Consider using a Content Delivery Network (CDN)

Example for lazy loading images:
\`\`\`html
<img src="placeholder.jpg" 
     data-src="actual-image.jpg" 
     loading="lazy" 
     alt="Description of image">
\`\`\`

These optimizations can significantly improve your page load times and user experience.`;
  }
  
  if (issueLower.includes('seo') || issueLower.includes('meta')) {
    return `To improve SEO:

1. Add a descriptive title tag (50-60 characters)
2. Write a compelling meta description (150-160 characters)
3. Use proper heading structure (H1, H2, etc.)
4. Ensure all images have alt text
5. Improve page load speed
6. Make your site mobile-friendly
7. Add structured data/schema markup

Example meta tags:
\`\`\`html
<head>
  <title>Professional Web Design Services | YourCompany</title>
  <meta name="description" content="Custom web design services that help your business stand out. Our expert team creates responsive, SEO-friendly websites that convert visitors into customers.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://yourwebsite.com/services/web-design">
</head>
\`\`\`

These changes will help search engines better understand and rank your content.`;
  }
  
  if (issueLower.includes('font') || issueLower.includes('typography')) {
    return `To improve typography:

1. Use a limited set of fonts (2-3 per page)
2. Ensure adequate font size (minimum 16px for body text)
3. Maintain proper line height (1.5-2x font size)
4. Set appropriate line length (45-75 characters per line)
5. Create clear typographic hierarchy with different sizes and weights

Example CSS:
\`\`\`css
body {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

h2 {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

p {
  margin-bottom: 1.5rem;
  max-width: 70ch; /* Limit line length */
}
\`\`\`

Good typography improves readability and the overall user experience.`;
  }
  
  if (issueLower.includes('navigation') || issueLower.includes('menu')) {
    return `To improve navigation:

1. Keep navigation consistent across all pages
2. Highlight the current page/section
3. Make clickable areas large enough (minimum 44x44px for touch targets)
4. Ensure navigation is keyboard accessible
5. Add breadcrumbs for complex sites
6. Consider adding a search function

Example responsive navigation:
\`\`\`html
<nav>
  <button class="mobile-menu-toggle" aria-expanded="false" aria-controls="main-menu">
    Menu <span class="icon"></span>
  </button>
  
  <ul id="main-menu" class="nav-menu">
    <li><a href="/" class="active">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/services">Services</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>
\`\`\`

Clear navigation helps users find what they're looking for quickly and improves overall usability.`;
  }
  
  if (issueLower.includes('content') || issueLower.includes('text')) {
    return `To improve content quality:

1. Use clear, concise language
2. Break text into short paragraphs (3-4 sentences max)
3. Use subheadings to organize content
4. Include bullet points and numbered lists
5. Add relevant images and media
6. Proofread for spelling and grammar errors
7. Ensure content is relevant and valuable to users

Example structure:
\`\`\`html
<article>
  <h1>How to Improve Your Website's Content</h1>
  
  <p>Creating high-quality content is essential for engaging visitors and improving SEO. Here's how to enhance your website's content.</p>
  
  <h2>1. Know Your Audience</h2>
  <p>Understanding who you're writing for helps you create more relevant content. Research your audience's needs, preferences, and pain points.</p>
  
  <h2>2. Create Scannable Content</h2>
  <ul>
    <li>Use descriptive headings and subheadings</li>
    <li>Keep paragraphs short (3-4 sentences)</li>
    <li>Include bullet points for lists</li>
    <li>Highlight important information</li>
  </ul>
</article>
\`\`\`

Well-structured, high-quality content keeps users engaged and encourages them to take action.`;
  }
  
  // Default solution for other issues
  return `To address this issue, consider these general web development best practices:

1. Follow web standards and accessibility guidelines (WCAG)
2. Test your website across different browsers and devices
3. Optimize for both performance and user experience
4. Implement proper error handling and validation
5. Keep your code clean, modular, and well-documented
6. Stay updated with current web development trends and technologies

Without more specific details about the issue, these general principles should help improve your website overall. For more targeted advice, consider consulting with a specialist in this particular area.`;
} 