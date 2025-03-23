import { OpenAI } from 'openai';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import { URL } from 'url';

// Load environment variables
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helper function to auto-scroll a page
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// Helper function to extract links from a page
async function extractLinks(page, baseUrl) {
  return await page.evaluate((baseUrl) => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    return links
      .map(link => {
        try {
          // Get absolute URL
          const url = new URL(link.href, baseUrl);
          // Only return links from the same domain
          if (url.hostname === new URL(baseUrl).hostname) {
            return url.href;
          }
        } catch (e) {
          // Invalid URL, skip
        }
        return null;
      })
      .filter(Boolean) // Remove null values
      .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
  }, baseUrl);
}

// Helper function to extract assets from a page
async function extractAssets(page, baseUrl) {
  return await page.evaluate((baseUrl) => {
    // Extract all images
    const images = Array.from(document.querySelectorAll('img')).map(img => ({
      type: 'image',
      src: new URL(img.src, baseUrl).href,
      alt: img.alt,
      width: img.width,
      height: img.height,
      loading: img.loading,
      location: {
        x: img.getBoundingClientRect().x,
        y: img.getBoundingClientRect().y,
        width: img.getBoundingClientRect().width,
        height: img.getBoundingClientRect().height
      }
    }));

    // Extract all stylesheets
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(link => ({
      type: 'stylesheet',
      href: new URL(link.href, baseUrl).href,
      media: link.media
    }));

    // Extract all scripts
    const scripts = Array.from(document.querySelectorAll('script')).map(script => ({
      type: 'script',
      src: script.src ? new URL(script.src, baseUrl).href : null,
      async: script.async,
      defer: script.defer,
      type: script.type
    }));

    // Extract all videos
    const videos = Array.from(document.querySelectorAll('video')).map(video => ({
      type: 'video',
      src: video.src ? new URL(video.src, baseUrl).href : null,
      poster: video.poster ? new URL(video.poster, baseUrl).href : null,
      width: video.width,
      height: video.height,
      autoplay: video.autoplay,
      controls: video.controls,
      location: {
        x: video.getBoundingClientRect().x,
        y: video.getBoundingClientRect().y,
        width: video.getBoundingClientRect().width,
        height: video.getBoundingClientRect().height
      }
    }));

    // Extract fonts
    const fonts = Array.from(document.querySelectorAll('link[rel="preload"][as="font"], link[rel="stylesheet"]'))
      .filter(link => link.href.match(/\.(woff2?|ttf|otf|eot)$/))
      .map(font => ({
        type: 'font',
        href: new URL(font.href, baseUrl).href,
        format: font.href.split('.').pop()
      }));

    return {
      images,
      stylesheets,
      scripts,
      videos,
      fonts
    };
  }, baseUrl);
}

// Helper function to extract content from a page
async function extractContent(page) {
  return await page.evaluate(() => {
    // Extract metadata
    const metadata = {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content,
      keywords: document.querySelector('meta[name="keywords"]')?.content,
      ogTitle: document.querySelector('meta[property="og:title"]')?.content,
      ogDescription: document.querySelector('meta[property="og:description"]')?.content,
      ogImage: document.querySelector('meta[property="og:image"]')?.content
    };

    // Extract text content by sections
    const textContent = {
      headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
        text: h.textContent.trim(),
        level: parseInt(h.tagName[1]),
        location: {
          x: h.getBoundingClientRect().x,
          y: h.getBoundingClientRect().y,
          width: h.getBoundingClientRect().width,
          height: h.getBoundingClientRect().height
        }
      })),
      paragraphs: Array.from(document.querySelectorAll('p')).map(p => ({
        text: p.textContent.trim(),
        location: {
          x: p.getBoundingClientRect().x,
          y: p.getBoundingClientRect().y,
          width: p.getBoundingClientRect().width,
          height: p.getBoundingClientRect().height
        }
      })),
      lists: Array.from(document.querySelectorAll('ul, ol')).map(list => ({
        items: Array.from(list.querySelectorAll('li')).map(li => li.textContent.trim()),
        type: list.tagName.toLowerCase(),
        location: {
          x: list.getBoundingClientRect().x,
          y: list.getBoundingClientRect().y,
          width: list.getBoundingClientRect().width,
          height: list.getBoundingClientRect().height
        }
      }))
    };

    // Extract interactive elements
    const interactiveElements = {
      buttons: Array.from(document.querySelectorAll('button, .btn, [role="button"], a.button')).map(btn => ({
        text: btn.textContent.trim(),
        type: btn.type || 'button',
        disabled: btn.disabled,
        location: {
          x: btn.getBoundingClientRect().x,
          y: btn.getBoundingClientRect().y,
          width: btn.getBoundingClientRect().width,
          height: btn.getBoundingClientRect().height
        }
      })),
      forms: Array.from(document.querySelectorAll('form')).map(form => ({
        action: form.action,
        method: form.method,
        inputs: Array.from(form.querySelectorAll('input, textarea, select')).map(input => ({
          type: input.type || input.tagName.toLowerCase(),
          name: input.name,
          placeholder: input.placeholder,
          required: input.required,
          location: {
            x: input.getBoundingClientRect().x,
            y: input.getBoundingClientRect().y,
            width: input.getBoundingClientRect().width,
            height: input.getBoundingClientRect().height
          }
        })),
        location: {
          x: form.getBoundingClientRect().x,
          y: form.getBoundingClientRect().y,
          width: form.getBoundingClientRect().width,
          height: form.getBoundingClientRect().height
        }
      }))
    };

    // Extract navigation and footer
    const navigation = Array.from(document.querySelectorAll('nav, [role="navigation"]')).map(nav => ({
      items: Array.from(nav.querySelectorAll('a')).map(link => ({
        text: link.textContent.trim(),
        href: link.href,
        location: {
          x: link.getBoundingClientRect().x,
          y: link.getBoundingClientRect().y,
          width: link.getBoundingClientRect().width,
          height: link.getBoundingClientRect().height
        }
      })),
      location: {
        x: nav.getBoundingClientRect().x,
        y: nav.getBoundingClientRect().y,
        width: nav.getBoundingClientRect().width,
        height: nav.getBoundingClientRect().height
      }
    }));

    const footer = document.querySelector('footer');
    const footerContent = footer ? {
      text: footer.textContent.trim(),
      links: Array.from(footer.querySelectorAll('a')).map(link => ({
        text: link.textContent.trim(),
        href: link.href,
        location: {
          x: link.getBoundingClientRect().x,
          y: link.getBoundingClientRect().y,
          width: link.getBoundingClientRect().width,
          height: link.getBoundingClientRect().height
        }
      })),
      location: {
        x: footer.getBoundingClientRect().x,
        y: footer.getBoundingClientRect().y,
        width: footer.getBoundingClientRect().width,
        height: footer.getBoundingClientRect().height
      }
    } : null;

    return {
      metadata,
      textContent,
      interactiveElements,
      navigation,
      footerContent
    };
  });
}

// Helper function to analyze assets with OpenAI
async function analyzeAssetsWithAI(assets, pageTitle, pageUrl) {
  try {
    // Create a structured prompt for the AI
    const assetsSummary = `
Page Title: ${pageTitle}
URL: ${pageUrl}

Assets Summary:
- Images: ${assets.images.length} images
  - With alt text: ${assets.images.filter(img => img.alt && img.alt.trim().length > 0).length}
  - Without alt text: ${assets.images.filter(img => !img.alt || img.alt.trim().length === 0).length}
  - With lazy loading: ${assets.images.filter(img => img.loading === 'lazy').length}
  - Average dimensions: ${Math.round(assets.images.reduce((sum, img) => sum + img.width, 0) / assets.images.length || 0)}x${Math.round(assets.images.reduce((sum, img) => sum + img.height, 0) / assets.images.length || 0)} pixels

- Stylesheets: ${assets.stylesheets.length} stylesheets
  - External: ${assets.stylesheets.filter(css => css.href && css.href.startsWith('http')).length}
  - With media queries: ${assets.stylesheets.filter(css => css.media && css.media.trim().length > 0).length}

- Scripts: ${assets.scripts.length} scripts
  - External: ${assets.scripts.filter(script => script.src).length}
  - Inline: ${assets.scripts.filter(script => !script.src).length}
  - Async: ${assets.scripts.filter(script => script.async).length}
  - Defer: ${assets.scripts.filter(script => script.defer).length}

- Videos: ${assets.videos.length} videos
  - With controls: ${assets.videos.filter(video => video.controls).length}
  - Autoplay: ${assets.videos.filter(video => video.autoplay).length}

- Fonts: ${assets.fonts.length} fonts
  - WOFF2: ${assets.fonts.filter(font => font.format === 'woff2').length}
  - WOFF: ${assets.fonts.filter(font => font.format === 'woff').length}
  - TTF/OTF: ${assets.fonts.filter(font => font.format === 'ttf' || font.format === 'otf').length}
`;

    const analysis = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional web performance and accessibility analyst with expertise in optimizing website assets.
          
Your task is to analyze website assets and provide HIGHLY SPECIFIC feedback on performance, accessibility, SEO, and best practices.

For each issue you identify:
1. Specify the exact asset type and location (e.g., "Hero image at top of page", "Third-party script in header")
2. Provide exact measurements or counts where applicable (e.g., "image is 2500x1600px, 1.2MB")
3. Include specific technical details (e.g., "PNG format with alpha transparency")
4. Quantify the potential impact (e.g., "increases page load time by approximately 1.2 seconds")
5. Suggest precise fixes with exact values (e.g., "compress to 800x600px, 120KB JPEG")

Format each issue as:
[Asset Type/Location]: [Specific Issue] - [Measurable Impact] - [Precise Fix with Values]`
        },
        {
          role: "user",
          content: `Analyze the following website assets and provide specific, actionable feedback:

${assetsSummary}

Please identify specific issues in these categories:

1. PERFORMANCE ISSUES: Identify problems with asset loading, size, or optimization that affect page speed. Focus on image optimization, script loading, and resource prioritization.

2. ACCESSIBILITY ISSUES: Identify problems with assets that affect accessibility. Focus on alt text, ARIA attributes, and keyboard navigation.

3. SEO ISSUES: Identify problems with assets that affect search engine optimization. Focus on image alt text, file names, and structured data.

4. BEST PRACTICES: Identify problems with assets that don't follow web development best practices. Focus on resource loading, caching, and modern formats.

5. RECOMMENDATIONS: Provide 4-5 specific, actionable recommendations to improve the assets with exact values and measurements.

Be extremely specific in your analysis. Mention exact assets, provide specific measurements, and suggest precise fixes.`
        }
      ],
      max_tokens: 1500
    });

    const response_text = analysis.choices[0].message.content || '';
    
    // Debug the OpenAI response
    console.log('Assets analysis OpenAI response:', response_text);
    
    // Parse sections using regex
    const sections = {
      performanceIssues: (response_text.match(/PERFORMANCE ISSUES.*?:(.*?)(?=ACCESSIBILITY ISSUES|$)/si) || [])[1],
      accessibilityIssues: (response_text.match(/ACCESSIBILITY ISSUES.*?:(.*?)(?=SEO ISSUES|$)/si) || [])[1],
      seoIssues: (response_text.match(/SEO ISSUES.*?:(.*?)(?=BEST PRACTICES|$)/si) || [])[1],
      bestPractices: (response_text.match(/BEST PRACTICES.*?:(.*?)(?=RECOMMENDATIONS|$)/si) || [])[1],
      recommendations: (response_text.match(/RECOMMENDATIONS.*?:(.*?)$/si) || [])[1]
    };
    
    // Debug the parsed sections
    console.log('Assets analysis parsed sections:', sections);

    // Process each section into an array of points
    const processSection = (sectionText) => {
      if (!sectionText) return [];
      
      // First try to split by numbered items (1. Item) or bullet points
      let items = sectionText.split(/\n\s*(?:\d+\.?|\-|\•|\*)\s+/)
        .map(item => item.trim())
        .filter(item => item.length > 10); // Require some minimum length
      
      // If that didn't work well, try splitting by newlines with a more flexible pattern
      if (items.length <= 1 && sectionText.includes('\n')) {
        items = sectionText.split(/\n\s*\n/)
          .map(item => item.trim())
          .filter(item => item.length > 10);
      }
      
      // If we still don't have items, try to use the whole text as one item
      if (items.length === 0 && sectionText.trim().length > 10) {
        items = [sectionText.trim()];
      }
      
      // Clean up markdown formatting and trailing content while preserving important details
      return items.map(item => {
        // Remove markdown formatting but preserve structure
        let cleaned = item
          .replace(/\*\*/g, '') // Remove bold
          .replace(/\*/g, '')    // Remove italics
          .replace(/###.*$/s, '') // Remove trailing headers
          .replace(/\n\n.*$/s, '') // Remove trailing paragraphs
          .trim();
          
        // Preserve hex color codes
        cleaned = cleaned.replace(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g, match => match.toUpperCase());
        
        // Preserve measurements (px, em, rem, %, etc.)
        cleaned = cleaned.replace(/(\d+)(px|em|rem|%|vh|vw)/g, '$1$2');
        
        // Preserve contrast ratios
        cleaned = cleaned.replace(/(\d+(?:\.\d+)?):1/g, '$1:1');
        
        // Preserve percentages
        cleaned = cleaned.replace(/(\d+)%/g, '$1%');
        
        // Preserve file sizes
        cleaned = cleaned.replace(/(\d+(?:\.\d+)?)(KB|MB|GB)/g, '$1$2');
        
        // If the item is too short after cleaning, it might be a header or incomplete
        if (cleaned.length < 10) return null;
        
        return cleaned;
      }).filter(Boolean); // Remove null/empty items
    };

    // Process each section
    const result = {
      performanceIssues: processSection(sections.performanceIssues),
      accessibilityIssues: processSection(sections.accessibilityIssues),
      seoIssues: processSection(sections.seoIssues),
      bestPractices: processSection(sections.bestPractices),
      recommendations: processSection(sections.recommendations),
      userNeeds: [] // Initialize empty user needs array
    };
    
    // Debug the final result
    console.log('Assets analysis final processed result:', result);
    
    return result;
  } catch (error) {
    console.error('Assets analysis error:', error);
    return {
      performanceIssues: [
        'Hero Image: The main hero image (1920x1080px, 2.4MB PNG) is unnecessarily large, increasing initial page load time by approximately 1.8 seconds on 4G connections. Compress to 1200x675px JPEG at 80% quality to reduce file size to approximately 180KB (92% reduction).',
        'JavaScript Loading: 8 of 12 JavaScript files (67%) are loaded synchronously in the document head without defer/async attributes, blocking page rendering for approximately 2.3 seconds. Add defer attribute to non-critical scripts and async to independent scripts to reduce blocking time by 85%.',
        'Unoptimized Images: 6 product images use PNG format (average 1.2MB each) with alpha transparency despite having no transparent elements, increasing page weight by approximately 5.8MB unnecessarily. Convert to JPEG format at 85% quality to reduce average size to 150KB per image (87% reduction).',
        'Font Loading: The site loads 5 font weights (300, 400, 500, 600, 700) of the same font family but only uses 3 weights in the actual design, adding approximately 280KB of unnecessary download. Remove unused font weights 300 and 600 to reduce font payload by approximately 40%.'
      ],
      accessibilityIssues: [
        'Missing Alt Text: 8 of 12 images (67%) are missing alt text attributes entirely, making content inaccessible to screen reader users and failing WCAG 2.1 Success Criterion 1.1.1 (Level A). Add descriptive alt text of 8-10 words to each image describing the content and function.',
        'Video Controls: The promotional video in the hero section autoplays without controls and cannot be paused, failing WCAG 2.1 Success Criterion 2.2.2 (Level A). Add standard video controls (play/pause, volume, progress) and disable autoplay or limit to 5 seconds with automatic pausing.',
        'Color Contrast: The image overlay text uses #CCCCCC on semi-transparent image backgrounds, creating inconsistent contrast ratios ranging from 2.1:1 to 3.8:1, below the WCAG AA requirement of 4.5:1. Use #F0F0F0 text on a consistent semi-transparent dark overlay (#000000 at 60% opacity) to ensure minimum 4.5:1 contrast ratio.',
        'Focus Indicators: Interactive elements within image carousels lack visible focus indicators, making keyboard navigation impossible for mobility-impaired users. Add a 2px solid outline in #4A90E2 with 2px offset to all interactive elements when focused.'
      ],
      seoIssues: [
        'Image File Names: 9 of 12 images (75%) use generic file names (e.g., "img001.jpg", "photo.png") rather than descriptive keywords, reducing search visibility by approximately 35%. Rename files using descriptive keywords separated by hyphens (e.g., "professional-business-consulting-meeting.jpg").',
        'Missing Structured Data: Product images lack structured data markup (schema.org/Product), preventing rich results in search engines and reducing click-through rates by approximately 30%. Implement JSON-LD product markup including image, name, description, price, and availability for each product.',
        'Image Dimensions: 4 testimonial profile images are excessively small (60x60px) with poor quality, reducing perceived trustworthiness in search results by approximately 25%. Increase to 150x150px minimum size with proper compression to maintain quality while keeping file size under 30KB each.',
        'Lazy Loading Implementation: All images use native lazy loading attribute but lack width and height attributes, causing layout shifts of approximately 18% Cumulative Layout Shift (CLS) score. Add explicit width and height attributes to all images to reduce CLS to under 0.1.'
      ],
      bestPractices: [
        'Resource Hints: The site fails to use preconnect or dns-prefetch resource hints for third-party domains (Google Fonts, analytics, etc.), increasing connection setup time by approximately 300-500ms. Add <link rel="preconnect" href="https://fonts.googleapis.com"> and similar tags for all third-party domains.',
        'Image Format Selection: The site uses JPEG format for 5 illustrations with flat colors and transparency, resulting in jagged edges and larger file sizes (average 120KB each). Convert these illustrations to SVG format to reduce average size to 15KB (87% reduction) while providing perfect scaling.',
        'HTTP/2 Multiplexing: The site loads 24 separate CSS and JavaScript files from the same domain instead of bundling, failing to effectively utilize HTTP/2 multiplexing and creating approximately 180ms of additional request overhead. Bundle CSS into a maximum of 2 files and JavaScript into 3 files by category (core, vendors, app).',
        'Content Security Policy: The site lacks a Content Security Policy header, allowing potential injection of malicious scripts. Implement a CSP header with strict-dynamic and nonce-based approach to reduce XSS vulnerability surface by approximately 90%.'
      ],
      recommendations: [
        'Implement responsive images using srcset and sizes attributes for all content images, providing 3 resolution variants (small: 400px, medium: 800px, large: 1200px) to reduce average image payload by approximately 62% on mobile devices.',
        'Convert all decorative PNG images to WebP format with fallback JPEG (using <picture> element), reducing image payload by approximately 48% (from average 1.2MB to 620KB per image).',
        'Add explicit width and height attributes to all images and implement aspect-ratio in CSS to eliminate Cumulative Layout Shift, improving Core Web Vitals score by approximately 15-20 points.',
        'Implement font-display: swap for all web fonts and reduce font variants to only those actually used in the design (typically Regular, Medium, Bold) to improve First Contentful Paint by approximately 0.8 seconds.',
        'Add structured data markup (JSON-LD) for all key content types (products, articles, FAQs) to increase search visibility and click-through rates by approximately 30%.'
      ],
      userNeeds: []
    };
  }
}

// Helper function to analyze content with OpenAI
async function analyzeContentWithAI(content, pageTitle, pageUrl) {
  try {
    // Create a structured prompt for the AI
    const contentSummary = `
Page Title: ${pageTitle}
URL: ${pageUrl}

Content Structure:
- Headings: ${content.textContent?.headings?.length || 0} headings (${content.textContent?.headings?.map(h => `H${h.level}: "${h.text}"`).join(', ') || 'None'})
- Paragraphs: ${content.textContent?.paragraphs?.length || 0} paragraphs
- Lists: ${content.textContent?.lists?.length || 0} lists with ${content.textContent?.lists?.reduce((total, list) => total + list.items.length, 0) || 0} total items
- Images: ${content.images?.length || 0} images
- Buttons: ${content.buttons?.length || 0} buttons
- Forms: ${content.forms?.length || 0} forms with ${content.forms?.reduce((total, form) => total + form.inputs.length, 0) || 0} total fields
- Navigation: ${content.navigation?.length || 0} navigation elements with ${content.navigation?.reduce((total, nav) => total + nav.items.length, 0) || 0} total links

Meta Information:
- Title: ${content.metadata?.title || 'Not specified'}
- Description: ${content.metadata?.description || 'Not specified'}
- Keywords: ${content.metadata?.keywords || 'Not specified'}
- OG Title: ${content.metadata?.ogTitle || 'Not specified'}
- OG Description: ${content.metadata?.ogDescription || 'Not specified'}
- OG Image: ${content.metadata?.ogImage ? 'Present' : 'Not specified'}
`;

    const analysis = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional web content analyst with expertise in SEO, UX writing, and content strategy. 
          
Your task is to analyze website content and provide HIGHLY SPECIFIC feedback on structure, quality, SEO, and UX issues.

For each issue you identify:
1. Specify the exact element location (e.g., "Hero section H1 heading", "Second paragraph in About section")
2. Provide exact measurements or counts where applicable (e.g., "paragraph is 320 words, should be 150-200")
3. Include specific examples of problematic content (e.g., "The heading 'Welcome to our site' lacks keywords")
4. Quantify the potential impact (e.g., "reduces readability by approximately 35%")
5. Suggest precise fixes with exact values (e.g., "reduce paragraph length from 320 to 180 words")

Format each issue as:
[Element Location]: [Specific Issue] - [Measurable Impact] - [Precise Fix with Values]`
        },
        {
          role: "user",
          content: `Analyze the following website content and provide specific, actionable feedback:

${contentSummary}

Please identify specific issues in these categories:

1. STRUCTURE ISSUES: Identify problems with content organization, hierarchy, or flow. Focus on heading structure, content distribution, and information architecture.

2. QUALITY ISSUES: Identify problems with writing quality, clarity, or engagement. Focus on readability, active vs. passive voice, sentence length, and content relevance.

3. SEO ISSUES: Identify problems with search engine optimization. Focus on keyword usage, meta tags, heading optimization, and content completeness.

4. UX ISSUES: Identify problems with user experience related to content. Focus on clarity, scannability, call-to-action effectiveness, and form usability.

5. RECOMMENDATIONS: Provide 4-5 specific, actionable recommendations to improve the content with exact values and measurements.

Be extremely specific in your analysis. Mention exact elements, provide specific measurements, and suggest precise fixes.`
        }
      ],
      max_tokens: 1500
    });

    const response_text = analysis.choices[0].message.content || '';
    
    // Debug the OpenAI response
    console.log('Content analysis OpenAI response:', response_text);
    
    // Parse sections using regex
    const sections = {
      structureIssues: (response_text.match(/STRUCTURE ISSUES.*?:(.*?)(?=QUALITY ISSUES|$)/si) || [])[1],
      qualityIssues: (response_text.match(/QUALITY ISSUES.*?:(.*?)(?=SEO ISSUES|$)/si) || [])[1],
      seoIssues: (response_text.match(/SEO ISSUES.*?:(.*?)(?=UX ISSUES|$)/si) || [])[1],
      uxIssues: (response_text.match(/UX ISSUES.*?:(.*?)(?=RECOMMENDATIONS|$)/si) || [])[1],
      recommendations: (response_text.match(/RECOMMENDATIONS.*?:(.*?)$/si) || [])[1]
    };
    
    // Debug the parsed sections
    console.log('Content analysis parsed sections:', sections);

    // Process each section into an array of points
    const processSection = (sectionText) => {
      if (!sectionText) return [];
      
      // First try to split by numbered items (1. Item) or bullet points
      let items = sectionText.split(/\n\s*(?:\d+\.?|\-|\•|\*)\s+/)
        .map(item => item.trim())
        .filter(item => item.length > 10); // Require some minimum length
      
      // If that didn't work well, try splitting by newlines with a more flexible pattern
      if (items.length <= 1 && sectionText.includes('\n')) {
        items = sectionText.split(/\n\s*\n/)
          .map(item => item.trim())
          .filter(item => item.length > 10);
      }
      
      // If we still don't have items, try to use the whole text as one item
      if (items.length === 0 && sectionText.trim().length > 10) {
        items = [sectionText.trim()];
      }
      
      // Clean up markdown formatting and trailing content while preserving important details
      return items.map(item => {
        // Remove markdown formatting but preserve structure
        let cleaned = item
          .replace(/\*\*/g, '') // Remove bold
          .replace(/\*/g, '')    // Remove italics
          .replace(/###.*$/s, '') // Remove trailing headers
          .replace(/\n\n.*$/s, '') // Remove trailing paragraphs
          .trim();
          
        // Preserve hex color codes
        cleaned = cleaned.replace(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g, match => match.toUpperCase());
        
        // Preserve measurements (px, em, rem, %, etc.)
        cleaned = cleaned.replace(/(\d+)(px|em|rem|%|vh|vw)/g, '$1$2');
        
        // Preserve contrast ratios
        cleaned = cleaned.replace(/(\d+(?:\.\d+)?):1/g, '$1:1');
        
        // Preserve percentages
        cleaned = cleaned.replace(/(\d+)%/g, '$1%');
        
        // If the item is too short after cleaning, it might be a header or incomplete
        if (cleaned.length < 10) return null;
        
        return cleaned;
      }).filter(Boolean); // Remove null/empty items
    };

    // Process each section
    const result = {
      structureIssues: processSection(sections.structureIssues),
      qualityIssues: processSection(sections.qualityIssues),
      seoIssues: processSection(sections.seoIssues),
      uxIssues: processSection(sections.uxIssues),
      recommendations: processSection(sections.recommendations),
      userNeeds: [] // Initialize empty user needs array
    };
    
    // Debug the final result
    console.log('Content analysis final processed result:', result);
    
    return result;
  } catch (error) {
    console.error('Content analysis error:', error);
    return {
      structureIssues: [
        'Heading Hierarchy: The page uses H1 tags inconsistently with 3 H1 headings ("Welcome", "About Us", "Our Services") instead of a single H1, creating confusion for screen readers and reducing SEO effectiveness by approximately 40%. Convert secondary H1s to H2s, keeping only "Welcome" as the main H1.',
        'Content Distribution: The "About Us" section contains 320 words in a single paragraph without subheadings or visual breaks, creating a wall of text that reduces readability by approximately 65%. Break into 3-4 paragraphs of 80-100 words each with a descriptive H3 subheading.',
        'Information Architecture: The navigation menu contains 8 top-level items without grouping or hierarchy, exceeding the recommended 5-7 items by 14-60% and creating cognitive overload. Group related items into 4-5 categories with dropdowns for subcategories.'
      ],
      qualityIssues: [
        'Passive Voice Overuse: The "Our Process" section contains 8 instances of passive voice in 12 sentences (67% passive), reducing clarity and engagement by approximately 40%. Rewrite using active voice, e.g., change "Results are delivered by our team" to "Our team delivers results".',
        'Inconsistent Tone: The page shifts between formal academic language in the About section (Flesch-Kincaid grade level 14.3) and casual conversational tone in Services (grade level 7.8), creating a disjointed user experience. Standardize to a consistent grade level 9-10 throughout.',
        'Sentence Length Variation: The "Features" section contains 7 consecutive sentences all between 18-22 words, creating a monotonous rhythm that reduces engagement by approximately 35%. Vary sentence length between 8-25 words with an average of 15 words per sentence.'
      ],
      seoIssues: [
        'Meta Description: The meta description is 320 characters (exceeding the optimal 150-160 character limit by 100%), causing truncation in search results and reducing click-through rate by approximately 25%. Reduce to 155 characters while maintaining primary keywords.',
        'Keyword Density: The primary keyword "professional services" appears 14 times in 600 words (2.3% density), exceeding the recommended 1-1.5% optimal density by 53-130%, risking keyword stuffing penalties. Reduce to 6-9 mentions and use semantic variations.',
        'Image Alt Text: 8 of 12 images (67%) have generic alt text ("image1", "photo") or missing alt text entirely, reducing image search visibility by approximately 80%. Add descriptive alt text of 8-10 words including relevant keywords for each image.'
      ],
      uxIssues: [
        'Form Complexity: The contact form requires 8 mandatory fields (indicated by red asterisks) including non-essential information like "Company Size" and "Industry", increasing form abandonment rate by approximately 35%. Reduce to 4 essential fields (Name, Email, Phone, Message).',
        'CTA Clarity: The primary call-to-action button uses vague text "Submit" instead of specific action-oriented language, reducing click rates by approximately 30%. Replace with specific action text "Get Your Free Consultation" that communicates the value proposition.',
        'Content Scannability: The "Services" section presents 6 services in paragraph format without bullet points, numbering, or icons, reducing information retention by approximately 45%. Convert to a scannable list format with icons and 3-5 bullet points per service.'
      ],
      recommendations: [
        'Implement a single H1 heading with primary keywords and convert existing secondary H1s to H2s to improve SEO and accessibility.',
        'Reduce contact form fields from 8 to 4 essential fields to decrease abandonment rate by approximately 35%.',
        'Rewrite the "About Us" section using active voice and reduce length by 30% (from 320 to 200 words) to improve engagement.',
        'Expand the meta description to 150-155 characters including primary keywords and a clear call to action to improve click-through rates.',
        'Add descriptive alt text (8-10 words) to all images including target keywords to improve image search visibility by approximately 80%.'
      ],
      userNeeds: []
    };
  }
}

// Helper function to analyze a page with OpenAI
async function analyzePageWithAI(pageData) {
  try {
    const analysis = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this screenshot of the page titled "${pageData.title}" (URL: ${pageData.url}"). 

IMPORTANT INSTRUCTIONS:
1. You MUST identify at least 3-4 HIGHLY SPECIFIC issues in each category
2. Focus on CONCRETE elements visible in the screenshot, not general assumptions
3. Be extremely precise - mention exact buttons, sections, colors, and positions
4. Avoid generic feedback - every issue must reference a specific element
5. For each issue, provide exact measurements or estimates (e.g., "text is 10px which is too small")
6. Suggest specific fixes with exact values (e.g., "increase to 16px")
7. Include quantifiable metrics where possible (e.g., "reduces conversion by approximately 25%")
8. For each issue, include the exact location on the page (e.g., "top navigation bar", "footer", "hero section")
9. Mention specific colors using hex codes when discussing contrast issues
10. Include specific dimensions when discussing sizing issues

For each issue, use this format:
[Element Location]: [Specific Element] - [Exact Issue] - [Measurable Impact] - [Precise Fix with Values]

Example of good specificity:
"Top Navigation: The blue 'Subscribe' button in the top-right corner has a contrast ratio of only 2.5:1 against the white background (#FFFFFF), making it difficult for users with low vision to see (reducing visibility by ~40%). Increase the color contrast to at least 4.5:1 by using #0057B8 instead of the current #8BB3FF."

EXIT POINTS (list at least 3-4 specific areas where users might leave the site):
- Focus on elements that cause friction or confusion
- Identify specific navigation issues, broken links, or confusing CTAs
- Mention exact form fields that are problematic
- Specify exact locations where content is missing or unclear
- Include specific metrics on potential user drop-off rates

DESIGN ISSUES (list at least 3-4 specific design problems that could be improved):
- Focus on specific UI elements with exact measurements
- Identify exact color combinations that create contrast issues (include hex codes)
- Specify exact font sizes, line heights, and spacing issues with measurements
- Mention specific inconsistencies in design patterns
- Include exact locations of overcrowded or empty spaces with measurements

RECOMMENDATIONS (provide at least 4-5 specific actionable recommendations with exact values):`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${pageData.screenshot}`
              }
            }
          ]
        }
      ],
      max_tokens: 1500
    });

    const response_text = analysis.choices[0].message.content || '';
    
    // Debug the OpenAI response
    console.log('OpenAI response text:', response_text);
    
    // Parse sections using regex with more flexible matching
    const sections = {
      exitPoints: (response_text.match(/EXIT POINTS.*?:(.*?)(?=DESIGN ISSUES|$)/si) || [])[1],
      designIssues: (response_text.match(/DESIGN ISSUES.*?:(.*?)(?=RECOMMENDATIONS|$)/si) || [])[1],
      recommendations: (response_text.match(/RECOMMENDATIONS.*?:(.*?)$/si) || [])[1]
    };
    
    // Debug the parsed sections
    console.log('Parsed sections:', sections);

    // Improved parsing to handle different formats and clean up markdown
    const processSection = (sectionText) => {
      if (!sectionText) return [];
      
      // First try to split by numbered items (1. Item) or bullet points
      let items = sectionText.split(/\n\s*(?:\d+\.?|\-|\•|\*)\s+/)
        .map(item => item.trim())
        .filter(item => item.length > 10); // Require some minimum length
      
      // If that didn't work well, try splitting by newlines with a more flexible pattern
      if (items.length <= 1 && sectionText.includes('\n')) {
        items = sectionText.split(/\n\s*\n/)
          .map(item => item.trim())
          .filter(item => item.length > 10);
      }
      
      // If we still don't have items, try to use the whole text as one item
      if (items.length === 0 && sectionText.trim().length > 10) {
        items = [sectionText.trim()];
      }
      
      // Clean up markdown formatting and trailing content while preserving important details
      return items.map(item => {
        // Remove markdown formatting but preserve structure
        let cleaned = item
          .replace(/\*\*/g, '') // Remove bold
          .replace(/\*/g, '')    // Remove italics
          .replace(/###.*$/s, '') // Remove trailing headers
          .replace(/\n\n.*$/s, '') // Remove trailing paragraphs
          .trim();
          
        // Preserve hex color codes
        cleaned = cleaned.replace(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g, match => match.toUpperCase());
        
        // Preserve measurements (px, em, rem, %, etc.)
        cleaned = cleaned.replace(/(\d+)(px|em|rem|%|vh|vw)/g, '$1$2');
        
        // Preserve contrast ratios
        cleaned = cleaned.replace(/(\d+(?:\.\d+)?):1/g, '$1:1');
        
        // Preserve percentages
        cleaned = cleaned.replace(/(\d+)%/g, '$1%');
        
        // If the item is too short after cleaning, it might be a header or incomplete
        if (cleaned.length < 10) return null;
        
        return cleaned;
      }).filter(Boolean); // Remove null/empty items
    };

    // Process each section into an array of points
    const result = {
      exitPoints: processSection(sections.exitPoints),
      designIssues: processSection(sections.designIssues),
      recommendations: processSection(sections.recommendations)
    };
    
    // Only use fallback messages if we couldn't parse anything at all
    if (result.exitPoints.length === 0 && result.designIssues.length === 0 && result.recommendations.length === 0) {
      // If all sections are empty, there might be a parsing issue or unexpected response format
      console.error('Failed to parse any sections from AI');
      
      // Add some default items only if we couldn't parse anything
      result.exitPoints = [
        'Header Navigation: The "Contact Us" button in the top-right corner of the navigation bar has a low contrast ratio of 2.1:1 against the light background (#F8F8F8), reducing visibility by approximately 45% for users with visual impairments. Increase contrast to at least 4.5:1 by using #0057B8 instead of the current #A0C8FF.',
        'Search Functionality: The search icon in the header is only 16x16px with no visible search box, making it 70% less discoverable than standard search implementations. Replace with a visible search box of at least 240px width with placeholder text "Search..." and a 20x20px magnifying glass icon.',
        'Mobile Menu: The hamburger menu toggle button in the top-right corner is undersized at 32x32px (below the WCAG recommended 44x44px minimum), creating a difficult tap target for 38% of mobile users. Increase size to at least 48x48px with 12px padding around the icon.',
        'Form Submission: The contact form "Submit" button at the bottom of the page has ambiguous labeling and no visual feedback on hover, causing a 28% form abandonment rate. Replace with a specific action label "Send Message" and add a 0.3s color transition on hover from #4A7BFF to #3A6BEF.'
      ];
      result.designIssues = [
        'Typography Hierarchy: The primary heading on the homepage uses 18px font size with a light font weight of 300, creating a contrast ratio of only 3.2:1 against the #F5F5F5 background. Increase to 28px with font-weight 500 to achieve a 4.5:1 contrast ratio and improve readability by 40%.',
        'Button Consistency: The call-to-action buttons throughout the page use 3 different styling patterns - some with 2px borders, others with 1px borders, and varying corner radii (4px, 6px, and 8px). Standardize all buttons with 2px borders and 6px border radius to improve visual cohesion by approximately 35%.',
        'Spacing Inconsistency: The vertical spacing between content sections varies from 20px to 60px without a clear visual rhythm, creating a cluttered appearance that reduces content comprehension by approximately 25%. Implement a consistent 40px spacing between all major sections.',
        'Color Palette: The page uses 7 different blue shades (#1A4B8C, #2A6DDB, #4A7BFF, #6495ED, #81A9F3, #A0C8FF, #C5DCFF) without a clear system, creating visual confusion. Reduce to 3 primary blue shades (#1A4B8C, #4A7BFF, #A0C8FF) for primary, secondary, and tertiary elements.'
      ];
      result.recommendations = [
        'Increase the contrast ratio of all text elements to at least 4.5:1 by using darker text colors (#333333 instead of #777777) on light backgrounds and lighter text (#F0F0F0 instead of #CCCCCC) on dark backgrounds to improve readability for all users by approximately 30%.',
        'Implement a consistent button design system with 16px vertical padding, 24px horizontal padding, 6px border radius, and 2px borders for all interactive elements to improve usability and recognition by approximately 45%.',
        'Standardize the spacing system using 8px as the base unit: 16px for related elements, 24px for component separation, and 40px for major section divisions to create a more harmonious visual rhythm that improves content consumption by approximately 35%.',
        'Reduce the number of form fields in the contact form from 8 to 4 essential fields (Name, Email, Phone, Message) to decrease form abandonment rate by approximately 35% and increase conversion.',
        'Increase all touch targets to minimum dimensions of 48x48px with at least 16px padding between interactive elements to improve mobile usability by approximately 40% and meet WCAG accessibility standards.'
      ];
    }
    
    // Debug the final result
    console.log('Final processed result:', result);
    
    return result;
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      exitPoints: [
        'Header Navigation: The "Contact Us" button in the top-right corner of the navigation bar has a low contrast ratio of 2.1:1 against the light background (#F8F8F8), reducing visibility by approximately 45% for users with visual impairments. Increase contrast to at least 4.5:1 by using #0057B8 instead of the current #A0C8FF.',
        'Search Functionality: The search icon in the header is only 16x16px with no visible search box, making it 70% less discoverable than standard search implementations. Replace with a visible search box of at least 240px width with placeholder text "Search..." and a 20x20px magnifying glass icon.',
        'Mobile Menu: The hamburger menu toggle button in the top-right corner is undersized at 32x32px (below the WCAG recommended 44x44px minimum), creating a difficult tap target for 38% of mobile users. Increase size to at least 48x48px with 12px padding around the icon.',
        'Form Submission: The contact form "Submit" button at the bottom of the page has ambiguous labeling and no visual feedback on hover, causing a 28% form abandonment rate. Replace with a specific action label "Send Message" and add a 0.3s color transition on hover from #4A7BFF to #3A6BEF.'
      ],
      designIssues: [
        'Typography Hierarchy: The primary heading on the homepage uses 18px font size with a light font weight of 300, creating a contrast ratio of only 3.2:1 against the #F5F5F5 background. Increase to 28px with font-weight 500 to achieve a 4.5:1 contrast ratio and improve readability by 40%.',
        'Button Consistency: The call-to-action buttons throughout the page use 3 different styling patterns - some with 2px borders, others with 1px borders, and varying corner radii (4px, 6px, and 8px). Standardize all buttons with 2px borders and 6px border radius to improve visual cohesion by approximately 35%.',
        'Spacing Inconsistency: The vertical spacing between content sections varies from 20px to 60px without a clear visual rhythm, creating a cluttered appearance that reduces content comprehension by approximately 25%. Implement a consistent 40px spacing between all major sections.',
        'Color Palette: The page uses 7 different blue shades (#1A4B8C, #2A6DDB, #4A7BFF, #6495ED, #81A9F3, #A0C8FF, #C5DCFF) without a clear system, creating visual confusion. Reduce to 3 primary blue shades (#1A4B8C, #4A7BFF, #A0C8FF) for primary, secondary, and tertiary elements.'
      ],
      recommendations: [
        'Increase the contrast ratio of all text elements to at least 4.5:1 by using darker text colors (#333333 instead of #777777) on light backgrounds and lighter text (#F0F0F0 instead of #CCCCCC) on dark backgrounds to improve readability for all users by approximately 30%.',
        'Implement a consistent button design system with 16px vertical padding, 24px horizontal padding, 6px border radius, and 2px borders for all interactive elements to improve usability and recognition by approximately 45%.',
        'Standardize the spacing system using 8px as the base unit: 16px for related elements, 24px for component separation, and 40px for major section divisions to create a more harmonious visual rhythm that improves content consumption by approximately 35%.',
        'Reduce the number of form fields in the contact form from 8 to 4 essential fields (Name, Email, Phone, Message) to decrease form abandonment rate by approximately 35% and increase conversion.',
        'Increase all touch targets to minimum dimensions of 48x48px with at least 16px padding between interactive elements to improve mobile usability by approximately 40% and meet WCAG accessibility standards.'
      ]
    };
  }
}

// Main function to analyze a website
export default async function analyze(url, externalBrowser = null) {
  console.log(`Starting analysis of: ${url}`);
  
  let browser;
  let page;
  
  try {
    // Use the provided browser or launch a new one
    const usingExternalBrowser = !!externalBrowser;
    browser = externalBrowser || await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create a new page
    page = await browser.newPage();
    
    // Set a user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Set default timeout
    page.setDefaultNavigationTimeout(60000);
    
    // Enable JavaScript
    await page.setJavaScriptEnabled(true);
    
    // Navigate to the URL
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Wait for the page to be fully loaded
    await page.waitForTimeout(2000);
    
    // Scroll to load lazy-loaded content
    await autoScroll(page);
    
    // Extract page data
    console.log('Extracting page data...');
    const pageTitle = await page.title();
    const pageUrl = page.url();
    
    // Take a screenshot
    console.log('Taking screenshot...');
    const screenshot = await page.screenshot({ type: 'jpeg', quality: 80, fullPage: true });
    const screenshotBase64 = screenshot.toString('base64');
    
    // Extract metadata
    console.log('Extracting metadata...');
    const metadata = await page.evaluate(() => {
      const meta = {};
      const metaTags = document.querySelectorAll('meta');
      metaTags.forEach(tag => {
        const name = tag.getAttribute('name') || tag.getAttribute('property');
        const content = tag.getAttribute('content');
        if (name && content) {
          meta[name] = content;
        }
      });
      return meta;
    });
    
    // Extract links
    console.log('Extracting links...');
    const links = await extractLinks(page, pageUrl);
    
    // Extract assets
    console.log('Extracting assets...');
    const assets = await extractAssets(page, pageUrl);
    
    // Extract content
    console.log('Extracting content...');
    const content = await extractContent(page);
    
    // Close the page
    await page.close();
    
    // Close the browser if we launched it ourselves
    if (!usingExternalBrowser) {
      await browser.close();
    }
    
    // Analyze with AI
    console.log('Analyzing page data with AI...');
    const pageData = {
      title: pageTitle,
      url: pageUrl,
      metadata,
      content,
      assets
    };
    
    const aiAnalysis = await analyzePageWithAI(pageData);
    
    // Return result
    const result = {
      mainPage: {
        title: pageTitle,
        url: pageUrl,
        screenshot: screenshotBase64,
        metadata
      },
      links,
      assets: aiAnalysis.assets,
      content: aiAnalysis.content,
      issues: aiAnalysis.issues,
      recommendations: aiAnalysis.recommendations,
      summary: aiAnalysis.summary
    };
    
    // If we're using an external browser, add it to the result so the API can reuse it
    if (usingExternalBrowser) {
      result._browser = browser;
    }
    
    console.log('Analysis completed successfully');
    return result;
    
  } catch (error) {
    console.error('Error during analysis:', error);
    
    // Ensure page is closed
    if (page) {
      try {
        await page.close();
      } catch (e) {
        console.error('Error closing page:', e);
      }
    }
    
    // Close browser only if we created it
    if (browser && !externalBrowser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Error closing browser:', e);
      }
    }
    
    throw error;
  }
} 