/**
 * Generates a solution for a given issue
 * This is a simple implementation that could be enhanced with more specific solutions
 * In a real-world scenario, you might want to use AI or a database of solutions
 */
export function generateSolution(issue: string): string {
  // Common solutions for different types of issues
  if (issue.toLowerCase().includes('image') && issue.toLowerCase().includes('alt')) {
    return 'Add descriptive alt text to all images to improve accessibility.\n\nExample:\n<img src="image.jpg" alt="Descriptive text about the image content" />\n\nGood alt text should:\n- Be concise but descriptive\n- Convey the purpose of the image\n- Not start with "image of" or "picture of"';
  }
  
  if (issue.toLowerCase().includes('contrast')) {
    return 'Improve color contrast between text and background to meet WCAG standards (minimum 4.5:1 for normal text, 3:1 for large text).\n\nSteps to fix:\n1. Use a contrast checker tool like WebAIM\n2. Adjust text or background colors\n3. Consider adding a semi-transparent background behind text on images';
  }
  
  if (issue.toLowerCase().includes('responsive') || issue.toLowerCase().includes('mobile')) {
    return 'Make your design responsive for all device sizes:\n\n1. Use responsive units (%, em, rem) instead of fixed pixels\n2. Implement media queries for different breakpoints\n3. Test on various devices and screen sizes\n4. Consider a mobile-first approach to design';
  }
  
  if (issue.toLowerCase().includes('load') || issue.toLowerCase().includes('performance')) {
    return 'Improve page load performance:\n\n1. Optimize and compress images\n2. Minify CSS and JavaScript\n3. Implement lazy loading for images and videos\n4. Use a Content Delivery Network (CDN)\n5. Enable browser caching\n6. Reduce third-party scripts';
  }
  
  if (issue.toLowerCase().includes('seo') || issue.toLowerCase().includes('meta')) {
    return 'Improve SEO with these steps:\n\n1. Add descriptive title tags (50-60 characters)\n2. Write compelling meta descriptions (150-160 characters)\n3. Use proper heading structure (H1, H2, etc.)\n4. Add structured data/schema markup\n5. Ensure mobile-friendliness\n6. Improve page load speed';
  }
  
  if (issue.toLowerCase().includes('font') || issue.toLowerCase().includes('typography')) {
    return 'Improve typography:\n\n1. Limit font families to 2-3 per page\n2. Ensure proper font sizes (min 16px for body text)\n3. Maintain adequate line height (1.5-2x font size)\n4. Use web-safe fonts or properly implement web fonts\n5. Ensure consistent styling throughout the site';
  }
  
  if (issue.toLowerCase().includes('navigation') || issue.toLowerCase().includes('menu')) {
    return 'Improve navigation:\n\n1. Keep navigation consistent across all pages\n2. Highlight the current page/section\n3. Ensure clickable areas are large enough (min 44x44px)\n4. Add breadcrumbs for complex sites\n5. Make sure navigation is keyboard accessible\n6. Consider adding a search function';
  }
  
  if (issue.toLowerCase().includes('content') || issue.toLowerCase().includes('text')) {
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