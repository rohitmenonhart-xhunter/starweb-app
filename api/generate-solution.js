import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
        model: 'gpt-4o',
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
}

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
    accessibility: 'You are an accessibility expert specializing in web development. Analyze the specific issue described and provide a highly targeted solution.',
    contrast: 'You are a UI/UX designer specializing in color theory and visual accessibility. Analyze the specific contrast/color issue described and provide a highly targeted solution.',
    responsive: 'You are a responsive design expert. Analyze the specific responsive design issue described and provide a highly targeted solution.',
    performance: 'You are a web performance optimization specialist. Analyze the specific performance issue described and provide a highly targeted solution.',
    seo: 'You are an SEO specialist. Analyze the specific SEO issue described and provide a highly targeted solution.',
    general: 'You are a web development and design expert. Analyze the specific issue described and provide a highly targeted solution.'
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
    return 'Add descriptive alt text to all images to improve accessibility.\n\nExample:\n<img src="image.jpg" alt="Descriptive text about the image content" />';
  }
  
  if (issueLower.includes('contrast')) {
    return 'Improve color contrast between text and background to meet WCAG standards (minimum 4.5:1 for normal text, 3:1 for large text).';
  }
  
  if (issueLower.includes('responsive') || issueLower.includes('mobile')) {
    return 'Make your design responsive for all device sizes by using responsive units (%, em, rem) and implementing media queries for different breakpoints.';
  }
  
  // Default solution for other issues
  return `To fix this issue, consider the following steps:

1. Analyze the specific problem mentioned
2. Research best practices for this particular area
3. Implement changes incrementally and test results
4. Get feedback from users or colleagues
5. Continue to monitor and refine your solution`;
} 