import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analyze from './src/api/analyze.js';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add CORS middleware to allow cross-origin requests from the frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Add health check endpoint for Docker
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({ error: 'Invalid URL format. URL must start with http:// or https://' });
    }

    const analysis = await analyze(url);
    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to analyze website'
    });
  }
});

// Add the AI solution generation endpoint
app.post('/api/generate-solution', async (req, res) => {
  try {
    const { issue } = req.body;
    
    if (!issue) {
      return res.status(400).json({ error: 'Issue is required' });
    }

    // Get the OpenAI API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('OpenAI API key not found, using fallback solution generator');
      // Provide a fallback solution if no API key is available
      return res.json({ 
        solution: generateFallbackSolution(issue) 
      });
    }

    // Categorize the issue to provide better context to the AI
    const category = categorizeIssue(issue);
    
    // Create a more specific prompt based on the issue category
    const systemPrompt = getSystemPromptForCategory(category);

    // Make a request to the OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Provide a personalized solution for this website issue: "${issue}"`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const solution = data.choices[0].message.content.trim();

    // Log the successful generation
    console.log(`Generated personalized solution for issue: "${issue.substring(0, 50)}..."`);

    res.json({ solution });
  } catch (error) {
    console.error('Error generating AI solution:', error);
    res.json({ 
      solution: generateFallbackSolution(req.body.issue) 
    });
  }
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  console.log('Email endpoint called with data:', req.body);
  
  try {
    const { to, subject, html, siteName, siteUrl } = req.body;
    
    // Validate email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error('Invalid email address:', to);
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }
    
    // Create a transporter
    console.log('Creating nodemailer transporter with config:', {
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 5) + '...' : undefined,
        pass: process.env.EMAIL_PASS ? '********' : undefined
      }
    });
    
    // Check if email credentials are available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email credentials are missing in environment variables');
      return res.status(500).json({ 
        success: false, 
        message: 'Email configuration is incomplete', 
        error: 'Missing email credentials' 
      });
    }
    
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Email options
    console.log('Setting up email options');
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
      attachments: []
    };
    
    // Send the email
    console.log('Sending email');
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully with info:', info);
      
      res.json({ 
        success: true, 
        message: `Analysis report for ${siteName} has been sent to ${to}` 
      });
    } catch (emailError) {
      console.error('Error in transporter.sendMail:', emailError);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send email', 
        error: emailError.message,
        stack: emailError.stack
      });
    }
  } catch (error) {
    console.error('Error in email endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email', 
      error: error.message,
      stack: error.stack
    });
  }
});

// Add a test endpoint to verify email configuration
app.get('/api/test-email-config', (req, res) => {
  console.log('Testing email configuration');
  
  const emailConfig = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER ? process.env.EMAIL_USER : 'Not configured',
    passConfigured: process.env.EMAIL_PASS ? true : false
  };
  
  console.log('Email configuration:', {
    service: emailConfig.service,
    user: emailConfig.user.substring(0, 5) + '...',
    passConfigured: emailConfig.passConfigured
  });
  
  res.json({
    success: true,
    config: {
      service: emailConfig.service,
      user: emailConfig.user.substring(0, 5) + '...',
      passConfigured: emailConfig.passConfigured
    }
  });
});

// Add a test endpoint to send a test email
app.get('/api/send-test-email', async (req, res) => {
  console.log('Sending test email');
  
  try {
    // Check if email credentials are available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email credentials are missing in environment variables');
      return res.status(500).json({ 
        success: false, 
        message: 'Email configuration is incomplete', 
        error: 'Missing email credentials' 
      });
    }
    
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: 'StarWeb Test Email',
      html: '<h1>Test Email</h1><p>This is a test email from StarWeb.</p>'
    };
    
    // Send the email
    console.log('Sending test email to', process.env.EMAIL_USER);
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Test email sent successfully with info:', info);
      
      res.json({ 
        success: true, 
        message: `Test email sent to ${process.env.EMAIL_USER}`,
        info: info
      });
    } catch (emailError) {
      console.error('Error in transporter.sendMail:', emailError);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send test email', 
        error: emailError.message,
        stack: emailError.stack
      });
    }
  } catch (error) {
    console.error('Error in test email endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test email', 
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * Categorizes an issue based on its content
 * @param {string} issue - The issue to categorize
 * @returns {string} - The category of the issue
 */
function categorizeIssue(issue) {
  const issueLower = issue.toLowerCase();
  
  // Extract the main element and problem from the detailed issue format
  let element = '';
  let problem = '';
  
  // Try to parse the detailed issue format (Element: Problem. Impact)
  const issueParts = issue.split(/:\s+|(?<=\.)(?=\s+)/);
  if (issueParts.length >= 2) {
    element = issueParts[0].toLowerCase().trim();
    problem = issueParts[1].toLowerCase().trim();
  }
  
  // Check for accessibility issues
  if (
    issueLower.includes('accessibility') || 
    issueLower.includes('alt text') || 
    issueLower.includes('screen reader') ||
    issueLower.includes('aria') ||
    (element.includes('image') && problem.includes('alt')) ||
    (element.includes('form') && problem.includes('label'))
  ) {
    return 'accessibility';
  }
  
  // Check for contrast/color issues
  if (
    issueLower.includes('contrast') || 
    issueLower.includes('color') || 
    issueLower.includes('readability') ||
    problem.includes('contrast') ||
    problem.includes('difficult to read')
  ) {
    return 'contrast';
  }
  
  // Check for responsive design issues
  if (
    issueLower.includes('responsive') || 
    issueLower.includes('mobile') || 
    issueLower.includes('screen size') ||
    issueLower.includes('viewport') ||
    problem.includes('different screen sizes') ||
    problem.includes('mobile device')
  ) {
    return 'responsive';
  }
  
  // Check for performance issues
  if (
    issueLower.includes('load') || 
    issueLower.includes('performance') || 
    issueLower.includes('speed') ||
    issueLower.includes('slow') ||
    problem.includes('unoptimized') ||
    problem.includes('large file size') ||
    problem.includes('delay')
  ) {
    return 'performance';
  }
  
  // Check for SEO issues
  if (
    issueLower.includes('seo') || 
    issueLower.includes('meta') || 
    issueLower.includes('search engine') ||
    element.includes('title') ||
    element.includes('description') ||
    problem.includes('keyword') ||
    problem.includes('search ranking')
  ) {
    return 'seo';
  }
  
  // Check for typography issues
  if (
    issueLower.includes('font') || 
    issueLower.includes('typography') || 
    issueLower.includes('text') ||
    problem.includes('font size') ||
    problem.includes('line height') ||
    problem.includes('spacing')
  ) {
    return 'typography';
  }
  
  // Check for navigation issues
  if (
    issueLower.includes('navigation') ||
    issueLower.includes('menu') ||
    issueLower.includes('navbar') ||
    element.includes('nav') ||
    element.includes('menu')
  ) {
    return 'navigation';
  }
  
  // Check for form issues
  if (
    issueLower.includes('form') ||
    issueLower.includes('input') ||
    issueLower.includes('field') ||
    issueLower.includes('validation') ||
    element.includes('form') ||
    element.includes('input')
  ) {
    return 'forms';
  }
  
  // Check for content issues
  if (
    issueLower.includes('content') ||
    issueLower.includes('text quality') ||
    issueLower.includes('wording') ||
    problem.includes('unclear') ||
    problem.includes('generic content')
  ) {
    return 'content';
  }
  
  // Check for layout issues
  if (
    issueLower.includes('layout') ||
    issueLower.includes('spacing') ||
    issueLower.includes('alignment') ||
    problem.includes('misaligned') ||
    problem.includes('inconsistent spacing')
  ) {
    return 'layout';
  }
  
  // Default to general if no specific category is found
  return 'general';
}

/**
 * Gets a system prompt for a specific category
 * @param {string} category - The category to get a prompt for
 * @returns {string} - The system prompt
 */
function getSystemPromptForCategory(category) {
  const prompts = {
    accessibility: 'You are an accessibility expert specializing in web development. Analyze the specific issue described and provide a highly targeted solution. Your response should include:\n\n1. Precise identification of the exact accessibility problem\n2. Specific code changes needed (with before/after examples)\n3. Explanation of how this affects different users with disabilities\n4. Relevant WCAG guidelines with success criteria numbers\n5. Testing methods to verify the fix\n\nFocus on practical implementation rather than general advice.',
    
    contrast: 'You are a UI/UX designer specializing in color theory and visual accessibility. Analyze the specific contrast/color issue described and provide a highly targeted solution. Your response should include:\n\n1. Precise color values that need changing (with hex/RGB codes)\n2. Specific contrast ratios before and after the proposed fix\n3. CSS code examples showing the exact implementation\n4. Tools to verify the contrast improvement\n5. Alternative color palettes that maintain brand identity while improving accessibility\n\nFocus on practical implementation rather than general advice.',
    
    responsive: 'You are a responsive design expert. Analyze the specific responsive design issue described and provide a highly targeted solution. Your response should include:\n\n1. Precise identification of the breakpoint or device size where the problem occurs\n2. Specific CSS media query code to fix the issue\n3. Before/after examples of the responsive behavior\n4. Testing methodology across different devices\n5. Modern responsive design techniques (Flexbox/Grid) that would solve the problem\n\nFocus on practical implementation rather than general advice.',
    
    performance: 'You are a web performance optimization specialist. Analyze the specific performance issue described and provide a highly targeted solution. Your response should include:\n\n1. Precise identification of the performance bottleneck\n2. Specific code or resource optimizations with before/after examples\n3. Expected performance improvement metrics\n4. Implementation steps with exact code changes\n5. Monitoring techniques to verify the improvement\n\nFocus on practical implementation rather than general advice.',
    
    seo: 'You are an SEO specialist. Analyze the specific SEO issue described and provide a highly targeted solution. Your response should include:\n\n1. Precise identification of the SEO problem\n2. Specific HTML/meta tag changes with before/after examples\n3. Content optimization recommendations with examples\n4. Implementation priority and expected impact\n5. Measurement methods to verify SEO improvement\n\nFocus on practical implementation rather than general advice.',
    
    typography: 'You are a typography and web design expert. Analyze the specific typography issue described and provide a highly targeted solution. Your response should include:\n\n1. Precise identification of the typography problem\n2. Specific CSS property changes with before/after examples\n3. Font recommendations if applicable\n4. Responsive typography considerations\n5. Implementation steps with exact code changes\n\nFocus on practical implementation rather than general advice.',
    
    navigation: 'You are a UX designer specializing in website navigation. Analyze the specific navigation issue described and provide a highly targeted solution. Your response should include:\n\n1. Precise identification of the navigation problem\n2. Specific HTML/CSS/JS changes with before/after examples\n3. Mobile and desktop considerations\n4. Accessibility improvements for the navigation\n5. User testing methods to verify the improvement\n\nFocus on practical implementation rather than general advice.',
    
    content: 'You are a content strategist and UX writer. Analyze the specific content issue described and provide a highly targeted solution. Your response should include:\n\n1. Precise identification of the content problem\n2. Specific content rewrites with before/after examples\n3. Content structure improvements\n4. SEO and readability considerations\n5. Content testing methods to verify effectiveness\n\nFocus on practical implementation rather than general advice.',
    
    layout: 'You are a layout and design systems expert. Analyze the specific layout issue described and provide a highly targeted solution. Your response should include:\n\n1. Precise identification of the layout problem\n2. Specific CSS changes with before/after examples using modern layout techniques\n3. Responsive considerations for the layout fix\n4. Visual hierarchy improvements\n5. Implementation steps with exact code changes\n\nFocus on practical implementation rather than general advice.',
    
    forms: 'You are a UX designer specializing in form design. Analyze the specific form issue described and provide a highly targeted solution. Your response should include:\n\n1. Precise identification of the form usability/accessibility problem\n2. Specific HTML/CSS/JS changes with before/after examples\n3. Validation and error handling improvements\n4. Accessibility considerations for the form\n5. User testing methods to verify the improvement\n\nFocus on practical implementation rather than general advice.',
    
    general: 'You are a web development and design expert. Analyze the specific issue described and provide a highly targeted solution. Your response should include:\n\n1. Precise identification of the problem\n2. Specific code or design changes with before/after examples\n3. Implementation steps with exact changes needed\n4. Best practices relevant to this specific issue\n5. Testing methods to verify the fix\n\nFocus on practical implementation rather than general advice.'
  };
  
  return prompts[category] || prompts.general;
}

/**
 * Generates a fallback solution when AI is unavailable
 */
function generateFallbackSolution(issue) {
  // Common solutions for different types of issues
  const issueLower = issue.toLowerCase();
  
  if (issueLower.includes('image') && issueLower.includes('alt')) {
    return 'Add descriptive alt text to all images to improve accessibility.\n\nExample:\n<img src="image.jpg" alt="Descriptive text about the image content" />\n\nGood alt text should:\n- Be concise but descriptive\n- Convey the purpose of the image\n- Not start with "image of" or "picture of"';
  }
  
  if (issueLower.includes('contrast')) {
    return 'Improve color contrast between text and background to meet WCAG standards (minimum 4.5:1 for normal text, 3:1 for large text).\n\nSteps to fix:\n1. Use a contrast checker tool like WebAIM\n2. Adjust text or background colors\n3. Consider adding a semi-transparent background behind text on images';
  }
  
  if (issueLower.includes('responsive') || issueLower.includes('mobile')) {
    return 'Make your design responsive for all device sizes:\n\n1. Use responsive units (%, em, rem) instead of fixed pixels\n2. Implement media queries for different breakpoints\n3. Test on various devices and screen sizes\n4. Consider a mobile-first approach to design';
  }
  
  if (issueLower.includes('load') || issueLower.includes('performance')) {
    return 'Improve page load performance:\n\n1. Optimize and compress images\n2. Minify CSS and JavaScript\n3. Implement lazy loading for images and videos\n4. Use a Content Delivery Network (CDN)\n5. Enable browser caching\n6. Reduce third-party scripts';
  }
  
  if (issueLower.includes('seo') || issueLower.includes('meta')) {
    return 'Improve SEO with these steps:\n\n1. Add descriptive title tags (50-60 characters)\n2. Write compelling meta descriptions (150-160 characters)\n3. Use proper heading structure (H1, H2, etc.)\n4. Add structured data/schema markup\n5. Ensure mobile-friendliness\n6. Improve page load speed';
  }
  
  if (issueLower.includes('font') || issueLower.includes('typography')) {
    return 'Improve typography:\n\n1. Limit font families to 2-3 per page\n2. Ensure proper font sizes (min 16px for body text)\n3. Maintain adequate line height (1.5-2x font size)\n4. Use web-safe fonts or properly implement web fonts\n5. Ensure consistent styling throughout the site';
  }
  
  if (issueLower.includes('navigation') || issueLower.includes('menu')) {
    return 'Improve navigation:\n\n1. Keep navigation consistent across all pages\n2. Highlight the current page/section\n3. Ensure clickable areas are large enough (min 44x44px)\n4. Add breadcrumbs for complex sites\n5. Make sure navigation is keyboard accessible\n6. Consider adding a search function';
  }
  
  if (issueLower.includes('content') || issueLower.includes('text')) {
    return 'Improve content quality:\n\n1. Use clear, concise language\n2. Break text into short paragraphs\n3. Use bullet points for lists\n4. Include subheadings to organize content\n5. Proofread for spelling and grammar\n6. Ensure content is relevant and valuable to users';
  }
  
  // Default solution for other issues
  return `To fix this issue, consider the following steps:

1. Analyze the specific problem mentioned
2. Research best practices for this particular area
3. Implement changes incrementally and test results
4. Get feedback from users or colleagues
5. Continue to monitor and refine your solution

For more specific guidance, consider consulting with a specialist in this area or researching industry standards.`;
}

// Start the server
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // If port 3001 is in use, try port 3002
    const newPort = PORT + 1;
    console.log(`Port ${PORT} is in use, trying port ${newPort}...`);
    app.listen(newPort, '0.0.0.0', () => {
      console.log(`Server running on port ${newPort}`);
      // Update the API endpoint URL in the console for reference
      console.log(`API endpoint: http://localhost:${newPort}/api/generate-solution`);
    });
  } else {
    console.error('Server error:', err);
  }
});