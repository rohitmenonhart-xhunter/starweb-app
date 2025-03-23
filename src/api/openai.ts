/**
 * OpenAI API service for generating personalized solutions
 */

// OpenAI API endpoint
const OPENAI_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

// Get API key from environment variables
// In development with Vite, environment variables need to be prefixed with VITE_
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

// Fallback message if API key is not available
const API_KEY_MISSING_MESSAGE = 'API key not found. Please set OPENAI_API_KEY in your environment variables.';

/**
 * Categorizes an issue based on its content
 * @param issue - The issue to categorize
 * @returns The category of the issue
 */
function categorizeIssue(issue: string): string {
  const issueLower = issue.toLowerCase();
  
  if (issueLower.includes('image') && (issueLower.includes('alt') || issueLower.includes('accessibility'))) {
    return 'accessibility';
  }
  
  if (issueLower.includes('contrast') || issueLower.includes('color') || issueLower.includes('readability')) {
    return 'contrast';
  }
  
  if (issueLower.includes('responsive') || issueLower.includes('mobile') || issueLower.includes('screen size')) {
    return 'responsive';
  }
  
  if (issueLower.includes('load') || issueLower.includes('performance') || issueLower.includes('speed')) {
    return 'performance';
  }
  
  if (issueLower.includes('seo') || issueLower.includes('meta') || issueLower.includes('search engine')) {
    return 'seo';
  }
  
  if (issueLower.includes('font') || issueLower.includes('typography') || issueLower.includes('text')) {
    return 'typography';
  }
  
  if (issueLower.includes('navigation') || issueLower.includes('menu') || issueLower.includes('link')) {
    return 'navigation';
  }
  
  if (issueLower.includes('content') || issueLower.includes('writing') || issueLower.includes('copy')) {
    return 'content';
  }
  
  if (issueLower.includes('security') || issueLower.includes('privacy') || issueLower.includes('data')) {
    return 'security';
  }
  
  if (issueLower.includes('form') || issueLower.includes('input') || issueLower.includes('validation')) {
    return 'forms';
  }
  
  return 'general';
}

/**
 * Gets a system prompt for a specific category
 * @param category - The category to get a prompt for
 * @returns The system prompt
 */
function getSystemPromptForCategory(category: string): string {
  const prompts: Record<string, string> = {
    accessibility: 'You are an accessibility expert specializing in web development. Provide specific, actionable solutions to fix website accessibility issues. Include code examples, WCAG guidelines references, and best practices. Focus on creating inclusive experiences for users with disabilities.',
    
    contrast: 'You are a UI/UX designer specializing in color theory and visual accessibility. Provide specific solutions for contrast and color issues on websites. Include color ratio recommendations, tools for checking contrast, and code examples using accessible color combinations.',
    
    responsive: 'You are a responsive design expert. Provide detailed solutions for making websites work well on all device sizes. Include CSS media query examples, responsive design patterns, and testing methodologies. Focus on mobile-first approaches and fluid layouts.',
    
    performance: 'You are a web performance optimization specialist. Provide technical solutions for improving website loading speed and performance. Include specific code optimizations, caching strategies, and resource loading techniques. Mention relevant tools for measuring and monitoring performance.',
    
    seo: 'You are an SEO specialist. Provide detailed solutions for improving website search engine optimization. Include specific meta tag recommendations, structured data examples, and content optimization techniques. Focus on both technical SEO and content-related improvements.',
    
    typography: 'You are a typography and web design expert. Provide solutions for improving text readability and visual hierarchy. Include CSS examples, font pairing recommendations, and best practices for line height, spacing, and font sizes. Focus on both aesthetics and readability.',
    
    navigation: 'You are a UX designer specializing in website navigation and information architecture. Provide solutions for improving site navigation, menu structures, and user flows. Include accessibility considerations, mobile navigation patterns, and best practices for link design.',
    
    content: 'You are a content strategist and UX writer. Provide solutions for improving website content quality, structure, and effectiveness. Include writing guidelines, content organization strategies, and techniques for improving readability and engagement.',
    
    security: 'You are a web security expert. Provide solutions for improving website security and data protection. Include specific code examples, security headers, form validation techniques, and best practices for protecting user data.',
    
    forms: 'You are a UX designer specializing in form design and validation. Provide solutions for improving form usability, accessibility, and conversion rates. Include validation techniques, error handling best practices, and code examples for creating user-friendly forms.',
    
    general: 'You are a helpful web development and design expert. Provide specific, actionable solutions to fix website issues. Format your response with clear steps, examples, and best practices. Keep your response concise but comprehensive.'
  };
  
  return prompts[category] || prompts.general;
}

/**
 * Generates a personalized solution using OpenAI's GPT-4o-mini model
 * @param issue - The issue to generate a solution for
 * @returns A promise that resolves to the personalized solution
 */
export async function generateAISolution(issue: string): Promise<string> {
  try {
    // Check if API key is available
    if (!OPENAI_API_KEY) {
      console.error(API_KEY_MISSING_MESSAGE);
      return `Error: ${API_KEY_MISSING_MESSAGE}`;
    }
    
    // Categorize the issue
    const category = categorizeIssue(issue);
    
    // Get the appropriate system prompt
    const systemPrompt = getSystemPromptForCategory(category);
    
    // Make a request to the OpenAI API
    const response = await fetch(OPENAI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Provide a personalized solution for this website issue: "${issue}". Include specific code examples and best practices. Format your response with markdown for code blocks.`
          }
        ],
        max_tokens: 800,
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
    
    console.log(`Generated AI solution for issue: "${issue.substring(0, 50)}..."`);
    
    return solution;
  } catch (error) {
    console.error('Error generating AI solution:', error);
    throw error;
  }
} 