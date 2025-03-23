import React, { useState, useRef, useEffect } from 'react';
import { Scan, AlertCircle, ArrowRight, Star, Link as LinkIcon, ExternalLink, HelpCircle, MapPin, Search, Download, FileText, Code, ClipboardCopy, Share } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { StarsBackground } from './components/ui/stars-background';
import { ShootingStars } from './components/ui/shooting-stars';
import { HowToPopup } from './components/HowToPopup';
import { generateSolution } from './lib/solutions';
import { generateAISolution } from './api/openai';
import { generateAnalysisPDF } from './utils/pdfGenerator';
import { generateAnalysisWord } from './utils/wordGenerator';
import { sendAnalysisEmail } from './utils/emailService.js';
import { LandingPage } from './components/LandingPage';
import './App.css'; // Import the App.css file for modal styles

type AnalysisResult = {
  visual: {
    exitPoints: string[];
    designIssues: string[];
    recommendations: string[];
    userNeeds: string[];
  };
  assets: {
    performanceIssues: string[];
    accessibilityIssues: string[];
    seoIssues: string[];
    bestPractices: string[];
    recommendations: string[];
    userNeeds: string[];
  };
  content: {
    structureIssues: string[];
    qualityIssues: string[];
    seoIssues: string[];
    uxIssues: string[];
    recommendations: string[];
    userNeeds: string[];
  };
};

type Assets = {
  images: Array<{
    type: string;
    src: string;
    alt: string;
    width: number;
    height: number;
    loading: string;
    location: { x: number; y: number; width: number; height: number; };
  }>;
  stylesheets: Array<{
    type: string;
    href: string;
    media: string;
  }>;
  scripts: Array<{
    type: string;
    src: string | null;
    async: boolean;
    defer: boolean;
  }>;
  videos: Array<{
    type: string;
    src: string | null;
    poster: string | null;
    width: number;
    height: number;
    autoplay: boolean;
    controls: boolean;
    location: { x: number; y: number; width: number; height: number; };
  }>;
  fonts: Array<{
    type: string;
    href: string;
    format: string;
  }>;
};

type PageContent = {
  textContent?: {
    headings?: Array<{
      text: string;
      level: number;
      location: { x: number; y: number; width: number; height: number; };
    }>;
    paragraphs?: Array<{
      text: string;
      location: { x: number; y: number; width: number; height: number; };
    }>;
    lists?: Array<{
      items: string[];
      type: string;
      location: { x: number; y: number; width: number; height: number; };
    }>;
  };
  images?: Array<{
    src: string;
    alt: string;
    location: { x: number; y: number; width: number; height: number; };
  }>;
  buttons?: Array<{
    text: string;
    location: { x: number; y: number; width: number; height: number; };
  }>;
  forms?: Array<{
    inputs: Array<{
      type: string;
      placeholder: string;
      required: boolean;
      location: { x: number; y: number; width: number; height: number; };
    }>;
    location: { x: number; y: number; width: number; height: number; };
  }>;
  navigation?: Array<{
    items: Array<{
      text: string;
      url: string;
      location: { x: number; y: number; width: number; height: number; };
    }>;
    location: { x: number; y: number; width: number; height: number; };
  }>;
  footerContent?: {
    text: string;
    links: Array<{
      text: string;
      url: string;
      location: { x: number; y: number; width: number; height: number; };
    }>;
    location: { x: number; y: number; width: number; height: number; };
  } | null;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
};

type PageLink = {
  url: string;
  text: string;
  location: { x: number; y: number; width: number; height: number; };
};

type PageAnalysis = {
  url: string;
  title: string;
  analysis: AnalysisResult;
  screenshot: string;
  content: PageContent;
  assets: Assets;
  links?: PageLink[];
};

type FullAnalysis = {
  mainPage: PageAnalysis;
  additionalPages: PageAnalysis[];
  allLinks: string[];
};

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  const [autoScrolling, setAutoScrolling] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [highlightLocation, setHighlightLocation] = useState<{ x: number; y: number; width: number; height: number; } | null>(null);
  const [showHowToPopup, setShowHowToPopup] = useState(false);
  const [currentIssue, setCurrentIssue] = useState('');
  const [currentSolution, setCurrentSolution] = useState('');
  const [isLoadingSolution, setIsLoadingSolution] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<number | null>(null);
  const [isSearchingElement, setIsSearchingElement] = useState(false);
  const [fallbackHighlight, setFallbackHighlight] = useState<boolean>(false);
  const [showInputSection, setShowInputSection] = useState(false);
  const [newUserNeed, setNewUserNeed] = useState('');
  const [activeUserNeedSection, setActiveUserNeedSection] = useState<'visual' | 'assets' | 'content' | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Auto-scroll preview function
  useEffect(() => {
    let scrollInterval: number | null = null;
    
    if (autoScrolling && previewRef.current) {
      scrollInterval = window.setInterval(() => {
        if (!autoScrolling || !previewRef.current) {
          // If auto-scrolling was disabled or the ref is no longer valid, clear the interval
          if (scrollInterval !== null) {
            window.clearInterval(scrollInterval);
          }
          return;
        }
        
        if (previewRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = previewRef.current;
          
          // If we've reached the bottom, reset to the top
          if (scrollTop + clientHeight >= scrollHeight) {
            previewRef.current.scrollTop = 0;
          } else {
            // Otherwise continue scrolling
            previewRef.current.scrollTop += 2; // Slow scroll speed
          }
        }
      }, 50);
    }
    
    return () => {
      if (scrollInterval !== null) {
        window.clearInterval(scrollInterval);
      }
    };
  }, [autoScrolling]);

  const analyzeWebsite = async () => {
    if (!url) {
      toast.error('Please enter a valid URL');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }
      
      const data = await response.json();
      
      // Debug the data
      console.log('Analysis data received:', data);
      console.log('Visual analysis:', data.mainPage.analysis.visual);
      console.log('Exit Points:', data.mainPage.analysis.visual.exitPoints);
      console.log('Design Issues:', data.mainPage.analysis.visual.designIssues);
      
      // Initialize userNeeds arrays for each section
      if (data && data.mainPage && data.mainPage.analysis) {
        // Initialize userNeeds arrays if they don't exist
        if (!data.mainPage.analysis.visual.userNeeds) {
          data.mainPage.analysis.visual.userNeeds = [];
        }
        if (!data.mainPage.analysis.assets.userNeeds) {
          data.mainPage.analysis.assets.userNeeds = [];
        }
        if (!data.mainPage.analysis.content.userNeeds) {
          data.mainPage.analysis.content.userNeeds = [];
        }
        
        // Do the same for additional pages if they exist
        if (data.additionalPages && data.additionalPages.length > 0) {
          data.additionalPages.forEach((page: PageAnalysis) => {
            if (!page.analysis.visual.userNeeds) {
              page.analysis.visual.userNeeds = [];
            }
            if (!page.analysis.assets.userNeeds) {
              page.analysis.assets.userNeeds = [];
            }
            if (!page.analysis.content.userNeeds) {
              page.analysis.content.userNeeds = [];
            }
          });
        }
      }
      
      setAnalysis(data);
      setActiveTab('main');
      setAnalysisComplete(true);
      setShowInputSection(false);
      toast.success('Analysis completed successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to analyze website');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced function to handle element click with fallback
  const handleElementClick = (location: { x: number; y: number; width: number; height: number; } | undefined) => {
    // First, make sure to stop any ongoing auto-scrolling
    setAutoScrolling(false);
    
    if (!location || !previewRef.current) {
      // If no location is provided, show a fallback highlight in the center of the preview
      if (previewRef.current) {
        const containerWidth = previewRef.current.clientWidth;
    const containerHeight = previewRef.current.clientHeight;
        const scrollTop = previewRef.current.scrollTop;
        
        // Create a fallback location in the center of the visible area
        const fallbackLocation = {
          x: containerWidth / 4,
          y: scrollTop + containerHeight / 3,
          width: containerWidth / 2,
          height: 100
        };
        
        setHighlightLocation(fallbackLocation);
        setFallbackHighlight(true);
        
        // Scroll to the fallback location
    previewRef.current.scrollTo({
          top: Math.max(0, fallbackLocation.y - containerHeight / 3),
      behavior: 'smooth'
    });
      }
      return;
    }

    // Get the preview container's dimensions
    const containerHeight = previewRef.current.clientHeight;
    const containerWidth = previewRef.current.clientWidth;
    
    // Calculate the scroll position to center the element vertically
    // Add a small offset (100px) to ensure the element isn't exactly at the edge
    const verticalOffset = 100;
    const scrollTop = Math.max(
      0,
      location.y - (containerHeight - location.height) / 2 - verticalOffset
    );
    
    // Normal highlight for valid location
    setHighlightLocation({
      ...location,
      // Ensure the highlight stays within the container width
      width: Math.min(location.width, containerWidth - location.x - 20)
    });
    setFallbackHighlight(false);
    
    // First scroll instantly to roughly the right area to prevent long scrolls
    previewRef.current.scrollTop = scrollTop;
    
    // Then do a smooth scroll for final positioning
    setTimeout(() => {
      if (previewRef.current) {
        previewRef.current.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }, 50);
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
      setHighlightLocation(null);
      setActiveHighlight(null);
      setFallbackHighlight(false);
    }, 3000);
  };

  const handleHowToClick = async (issue: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events
    setCurrentIssue(issue);
    setCurrentSolution(''); // Clear previous solution
    setIsLoadingSolution(true);
    setShowHowToPopup(true);
    
    try {
      // Show loading toast
      toast.loading('Generating personalized solution...', { id: 'solution-toast' });
      
      // Get personalized solution using OpenAI
      const solution = await generateAISolution(issue);
      setCurrentSolution(solution);
      
      // Show success toast
      toast.success('Solution generated successfully!', { id: 'solution-toast' });
    } catch (error) {
      console.error('Error getting personalized solution:', error);
      // Fallback to the static solution generator
      const fallbackSolution = generateSolution(issue);
      setCurrentSolution(fallbackSolution);
      
      // Show error toast with retry button
      toast.error(
        (t) => (
          <div className="flex flex-col">
            <div className="mb-2">Could not generate AI solution. Using fallback solution instead.</div>
            <button 
              onClick={() => {
                toast.dismiss(t.id);
                // Retry the AI solution generation
                handleRetryAISolution(issue);
              }}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md self-end hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ),
        { id: 'solution-toast', duration: 5000 }
      );
    } finally {
      setIsLoadingSolution(false);
    }
  };

  const handleRetryAISolution = async (issue: string) => {
    setIsLoadingSolution(true);
    
    try {
      // Show info toast
      toast.loading('Retrying AI solution generation...', { id: 'retry-toast' });
      
      // Get personalized solution using OpenAI
      const solution = await generateAISolution(issue);
      setCurrentSolution(solution);
      
      // Show success toast
      toast.success('AI solution generated successfully!', { id: 'retry-toast' });
    } catch (error) {
      console.error('Error retrying personalized solution:', error);
      toast.error('Failed to generate AI solution again. Please try later.', { id: 'retry-toast' });
    } finally {
      setIsLoadingSolution(false);
    }
  };

  // Improved function to find the best matching element for an issue
  const findElementLocation = (
    issue: string, 
    pageAnalysis: PageAnalysis,
    index: number,
    issueType: 'exitPoint' | 'designIssue' | 'performance' | 'accessibility' | 'seo' | 'content' | 'other'
  ): { x: number; y: number; width: number; height: number; } | undefined => {
    // First, try direct mapping based on issue type and index
    const allImages = pageAnalysis.content?.images || [];
    const allVideos = pageAnalysis.assets?.videos || [];
    const headings = pageAnalysis.content?.textContent?.headings || [];
    const paragraphs = pageAnalysis.content?.textContent?.paragraphs || [];
    const links = pageAnalysis.links || [];
    const forms = pageAnalysis.content?.forms || [];
    const navigation = pageAnalysis.content?.navigation || [];
    const buttons = pageAnalysis.content?.buttons || [];
    const lists = pageAnalysis.content?.textContent?.lists || [];
    
    // Check if we have any elements at all
    const hasElements = 
      allImages.length > 0 || 
      allVideos.length > 0 || 
      headings.length > 0 || 
      paragraphs.length > 0 || 
      links.length > 0 || 
      forms.length > 0 || 
      navigation.length > 0 ||
      buttons.length > 0 ||
      lists.length > 0;
    
    if (!hasElements) {
      console.log('No elements found in page analysis');
      return undefined;
    }
    
    // Log available elements for debugging
    console.log(`Available elements: 
      Images: ${allImages.length}, 
      Videos: ${allVideos.length}, 
      Headings: ${headings.length}, 
      Paragraphs: ${paragraphs.length}, 
      Links: ${links.length}, 
      Forms: ${forms.length}, 
      Navigation: ${navigation.length},
      Buttons: ${buttons.length},
      Lists: ${lists.length}`
    );
    
    // Try to find the most relevant element based on issue description
    const issueLower = issue.toLowerCase();
    let location: { x: number; y: number; width: number; height: number; } | undefined;
    
    // Extract position indicators from the issue text
    const positionMatches = {
      top: issueLower.includes('top') || issueLower.includes('header') || issueLower.includes('above'),
      bottom: issueLower.includes('bottom') || issueLower.includes('footer') || issueLower.includes('below'),
      left: issueLower.includes('left') || issueLower.includes('sidebar'),
      right: issueLower.includes('right'),
      hero: issueLower.includes('hero') || issueLower.includes('banner'),
      navigation: issueLower.includes('nav') || issueLower.includes('menu'),
      form: issueLower.includes('form') || issueLower.includes('input') || issueLower.includes('field'),
      button: issueLower.includes('button') || issueLower.includes('cta'),
      image: issueLower.includes('image') || issueLower.includes('picture') || issueLower.includes('photo'),
      video: issueLower.includes('video'),
      heading: issueLower.includes('heading') || issueLower.includes('title') || issueLower.includes('h1') || issueLower.includes('h2'),
      paragraph: issueLower.includes('paragraph') || issueLower.includes('text content'),
      list: issueLower.includes('list') || issueLower.includes('bullet')
    };
    
    // Extract ordinal indicators (first, second, third, etc.)
    let elementIndex = 0;
    if (issueLower.includes('first') || issueLower.includes('1st')) {
      elementIndex = 0;
    } else if (issueLower.includes('second') || issueLower.includes('2nd')) {
      elementIndex = 1;
    } else if (issueLower.includes('third') || issueLower.includes('3rd')) {
      elementIndex = 2;
    } else if (issueLower.includes('fourth') || issueLower.includes('4th')) {
      elementIndex = 3;
    } else if (issueLower.includes('fifth') || issueLower.includes('5th')) {
      elementIndex = 4;
    } else {
      // Try to find a numeric indicator like "3 images" or "image #2"
      const numericMatch = issueLower.match(/(\d+)(?:st|nd|rd|th)?\s+(\w+)/) || issueLower.match(/(\w+)\s+#?(\d+)/);
      if (numericMatch) {
        const num = parseInt(numericMatch[1], 10);
        if (!isNaN(num) && num > 0) {
          elementIndex = num - 1; // Convert to 0-based index
        }
      }
    }
    
    // Find the most specific element based on the issue description
    if (positionMatches.navigation && navigation.length > 0) {
      const navIndex = Math.min(elementIndex, navigation.length - 1);
      location = navigation[navIndex]?.location;
      console.log(`Found navigation element at index ${navIndex}`);
    } else if (positionMatches.form && forms.length > 0) {
      const formIndex = Math.min(elementIndex, forms.length - 1);
      location = forms[formIndex]?.location;
      console.log(`Found form element at index ${formIndex}`);
    } else if (positionMatches.button && buttons.length > 0) {
      const buttonIndex = Math.min(elementIndex, buttons.length - 1);
      location = buttons[buttonIndex]?.location;
      console.log(`Found button element at index ${buttonIndex}`);
    } else if (positionMatches.image && allImages.length > 0) {
      const imageIndex = Math.min(elementIndex, allImages.length - 1);
      location = allImages[imageIndex]?.location;
      console.log(`Found image element at index ${imageIndex}`);
    } else if (positionMatches.video && allVideos.length > 0) {
      const videoIndex = Math.min(elementIndex, allVideos.length - 1);
      location = allVideos[videoIndex]?.location;
      console.log(`Found video element at index ${videoIndex}`);
    } else if (positionMatches.heading && headings.length > 0) {
      const headingIndex = Math.min(elementIndex, headings.length - 1);
      location = headings[headingIndex]?.location;
      console.log(`Found heading element at index ${headingIndex}`);
    } else if (positionMatches.paragraph && paragraphs.length > 0) {
      const paraIndex = Math.min(elementIndex, paragraphs.length - 1);
      location = paragraphs[paraIndex]?.location;
      console.log(`Found paragraph element at index ${paraIndex}`);
    } else if (positionMatches.list && lists.length > 0) {
      const listIndex = Math.min(elementIndex, lists.length - 1);
      location = lists[listIndex]?.location;
      console.log(`Found list element at index ${listIndex}`);
    } else {
      // If no specific element type is mentioned, fall back to the original logic
      switch (issueType) {
        case 'exitPoint':
          if (links.length > 0) {
            const linkIndex = Math.min(index, links.length - 1);
            location = links[linkIndex]?.location;
            console.log(`Found exit point location at index ${linkIndex}`);
          }
          break;
        
        case 'designIssue':
          if (allImages.length > 0) {
            const imageIndex = Math.min(index, allImages.length - 1);
            location = allImages[imageIndex]?.location;
            console.log(`Found design issue location at image index ${imageIndex}`);
          }
          break;
        
        case 'performance':
          if (issueLower.includes('image') && allImages.length > 0) {
            location = allImages[0]?.location;
            console.log('Found performance issue location for image');
          } else if (issueLower.includes('video') && allVideos.length > 0) {
            location = allVideos[0]?.location;
            console.log('Found performance issue location for video');
          } else if (allImages.length > 0) {
            location = allImages[0]?.location;
            console.log('Found fallback performance issue location');
          }
          break;
        
        case 'accessibility':
          if (issueLower.includes('form') && forms.length > 0) {
            location = forms[0]?.location;
            console.log('Found accessibility issue location for form');
          } else if (issueLower.includes('image') && allImages.length > 0) {
            location = allImages[0]?.location;
            console.log('Found accessibility issue location for image');
          } else if (issueLower.includes('navigation') && navigation.length > 0) {
            location = navigation[0]?.location;
            console.log('Found accessibility issue location for navigation');
          } else if (allImages.length > 0) {
            location = allImages[0]?.location;
            console.log('Found fallback accessibility issue location');
          }
          break;
        
        case 'seo':
          if (issueLower.includes('heading') && headings.length > 0) {
            location = headings[0]?.location;
            console.log('Found SEO issue location for heading');
          } else if (issueLower.includes('content') && paragraphs.length > 0) {
            location = paragraphs[0]?.location;
            console.log('Found SEO issue location for content');
          } else if (headings.length > 0) {
            location = headings[0]?.location;
            console.log('Found fallback SEO issue location');
          }
          break;
        
        case 'content':
          if (paragraphs.length > 0) {
            const paraIndex = Math.min(index, paragraphs.length - 1);
            location = paragraphs[paraIndex]?.location;
            console.log(`Found content issue location at paragraph index ${paraIndex}`);
          } else if (headings.length > 0) {
            const headingIndex = Math.min(index, headings.length - 1);
            location = headings[headingIndex]?.location;
            console.log(`Found content issue location at heading index ${headingIndex}`);
          }
          break;
        
        default:
          // For other issues, try to find any relevant element
          if (issueLower.includes('navigation') && navigation.length > 0) {
            location = navigation[0]?.location;
          } else if (issueLower.includes('image') && allImages.length > 0) {
            location = allImages[0]?.location;
          } else if (issueLower.includes('text') && paragraphs.length > 0) {
            location = paragraphs[0]?.location;
          } else if (issueLower.includes('link') && links.length > 0) {
            location = links[0]?.location;
          }
          break;
      }
    }
    
    // If we found a location, return it
    if (location) {
      return location;
    }
    
    // If no specific match found, return any available element as a fallback
    return (
      allImages[0]?.location ||
      headings[0]?.location ||
      paragraphs[0]?.location ||
      links[0]?.location ||
      forms[0]?.location ||
      navigation[0]?.location ||
      buttons[0]?.location ||
      lists[0]?.location ||
      allVideos[0]?.location
    );
  };

  // Function to locate and highlight an issue with improved feedback
  const handleLocateIssue = (
    index: number, 
    issue: string,
    issueType: 'exitPoint' | 'designIssue' | 'performance' | 'accessibility' | 'seo' | 'content' | 'other',
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Make sure to stop any ongoing auto-scrolling
    setAutoScrolling(false);
    
    if (!analysis?.mainPage) {
      toast.error('Analysis data not available', { id: 'locate-toast' });
      return;
    }
    
    // Show searching indicator
    setIsSearchingElement(true);
    toast.loading('Locating element on the page...', { id: 'locate-toast' });
    
    // Find the best matching location for this issue
    const location = findElementLocation(issue, analysis.mainPage, index, issueType);
    
    setTimeout(() => {
      setIsSearchingElement(false);
      
      if (location) {
        // Set active highlight index
        setActiveHighlight(index);
        
        // Highlight and scroll to the element
        handleElementClick(location);
        
        // Show success toast
        toast.success('Element located on the page', { 
          id: 'locate-toast',
          icon: <MapPin className="w-4 h-4 text-blue-500" />
        });
      } else {
        // Use fallback highlighting in the center of the preview
        setActiveHighlight(index);
        handleElementClick(undefined);
        
        // Show info toast
        toast.success('Showing approximate location on the page', { 
          id: 'locate-toast',
          icon: <Search className="w-4 h-4 text-blue-500" />
        });
      }
    }, 800); // Short delay for better UX
  };

  const renderIssueWithHowTo = (
    issue: string, 
    index: number, 
    iconComponent: React.ReactNode, 
    colorClass: string,
    issueType: 'exitPoint' | 'designIssue' | 'performance' | 'accessibility' | 'seo' | 'content' | 'other'
  ) => {
    // Split the issue into parts if it follows the expected format
    const parts = {
      element: '',
      problem: '',
      impact: ''
    };
    
    // Try to parse the detailed issue format
    const issueParts = issue.split(/:\s+|(?<=\.)(?=\s+)/);
    if (issueParts.length >= 2) {
      parts.element = issueParts[0].trim();
      parts.problem = issueParts[1].trim();
      if (issueParts.length >= 3) {
        parts.impact = issueParts.slice(2).join(' ').trim();
      }
    }
    
    const hasDetailedFormat = parts.element && parts.problem;
    
    return (
      <div 
        key={index}
        className={`group bg-slate-800/50 p-4 rounded-xl border border-slate-700/30 hover:border-${colorClass}/30 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${activeHighlight === index ? `border-${colorClass} ring-2 ring-${colorClass}/50` : ''}`}
      >
        <div className="flex items-start gap-3">
          {iconComponent}
          <div className="text-slate-300 group-hover:text-${colorClass} transition-colors duration-300 flex-grow">
            {hasDetailedFormat ? (
              <>
                <div className="font-semibold">{parts.element}</div>
                <div className="mt-1 text-sm text-slate-400">{parts.problem}</div>
                {parts.impact && (
                  <div className="mt-1 text-xs text-slate-500">{parts.impact}</div>
                )}
              </>
            ) : (
              <span>{issue}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => handleLocateIssue(index, issue, issueType, e)}
              className={`px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1 ${isSearchingElement ? 'opacity-50 cursor-wait' : ''}`}
              disabled={isSearchingElement}
            >
              {isSearchingElement ? (
                <Search className="w-3 h-3 animate-spin" />
              ) : (
                <MapPin className="w-3 h-3" />
              )}
              Locate
            </button>
            <button
              onClick={(e) => handleHowToClick(issue, e)}
              className={`px-2 py-1 rounded text-xs font-medium bg-${colorClass}/10 text-${colorClass} hover:bg-${colorClass}/20 transition-colors flex items-center gap-1`}
            >
              <HelpCircle className="w-3 h-3" />
              How to
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderContentAnalysis = (content?: PageContent) => {
    if (!content || !content.textContent) return null;
    return (
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 transform hover:-translate-y-1">
        <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
          Content Analysis
        </h3>
        <div className="space-y-4">
          {/* Headings Analysis */}
          {content.textContent.headings && (
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                Headings Structure ({content.textContent.headings.length})
              </h4>
              <div className="max-h-[150px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {content.textContent.headings.map((heading, index) => (
                  <div 
                    key={index}
                    className="group flex items-center gap-2 p-2 rounded-lg bg-slate-900/30 hover:bg-slate-800 cursor-pointer transition-all duration-300"
                    onClick={() => handleElementClick(heading.location)}
                  >
                    <div className={`px-2 py-1 rounded text-xs ${
                      heading.level === 1 ? 'bg-blue-500/20 text-blue-400' :
                      heading.level === 2 ? 'bg-purple-500/20 text-purple-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      H{heading.level}
                    </div>
                    <span className="text-sm text-slate-300 group-hover:text-blue-400 transition-colors duration-300 truncate">
                      {heading.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Structure */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <div className="text-2xl font-semibold text-blue-400 mb-1">
                {content.textContent.paragraphs?.length || 0}
              </div>
              <div className="text-sm text-slate-400">Paragraphs</div>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <div className="text-2xl font-semibold text-purple-400 mb-1">
                {content.textContent.lists?.length || 0}
              </div>
              <div className="text-sm text-slate-400">Lists</div>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <div className="text-2xl font-semibold text-emerald-400 mb-1">
                {content.images?.length || 0}
              </div>
              <div className="text-sm text-slate-400">Images</div>
            </div>
          </div>

          {/* Interactive Elements */}
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              Interactive Elements
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 rounded bg-slate-900/30">
                <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400 text-sm">{content.buttons?.length || 0}</span>
                </div>
                <span className="text-sm text-slate-300">Buttons</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-900/30">
                <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center">
                  <span className="text-purple-400 text-sm">{content.forms?.length || 0}</span>
                </div>
                <span className="text-sm text-slate-300">Forms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAssetsAnalysis = (assets?: Assets, analysis?: AnalysisResult['assets']) => {
    if (!assets || !analysis) return null;
    return (
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 transform hover:-translate-y-1">
        <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
          Assets Analysis
        </h3>
        <div className="space-y-4">
          {/* Performance Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/50 p-3 rounded-lg group hover:bg-slate-800 transition-all duration-300 cursor-pointer">
              <div className="text-2xl font-semibold text-blue-400 mb-1 group-hover:scale-110 transition-transform duration-300">
                {assets.images.length}
              </div>
              <div className="text-sm text-slate-400">Images</div>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg group hover:bg-slate-800 transition-all duration-300 cursor-pointer">
              <div className="text-2xl font-semibold text-purple-400 mb-1 group-hover:scale-110 transition-transform duration-300">
                {assets.stylesheets.length}
              </div>
              <div className="text-sm text-slate-400">Stylesheets</div>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg group hover:bg-slate-800 transition-all duration-300 cursor-pointer">
              <div className="text-2xl font-semibold text-emerald-400 mb-1 group-hover:scale-110 transition-transform duration-300">
                {assets.scripts.length}
              </div>
              <div className="text-sm text-slate-400">Scripts</div>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg group hover:bg-slate-800 transition-all duration-300 cursor-pointer">
              <div className="text-2xl font-semibold text-orange-400 mb-1 group-hover:scale-110 transition-transform duration-300">
                {assets.fonts.length}
              </div>
              <div className="text-sm text-slate-400">Fonts</div>
            </div>
          </div>

          {/* Performance Issues */}
          {analysis.performanceIssues.length > 0 && (
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                Performance Issues
              </h4>
              <div className="space-y-2">
                {analysis.performanceIssues.map((issue, index) => (
                  renderIssueWithHowTo(
                    issue, 
                    index + 200, 
                    <AlertCircle className="w-4 h-4 mt-1 text-red-400 flex-shrink-0" />,
                    "red-400",
                    "performance"
                  )
                ))}
              </div>
            </div>
          )}

          {/* Accessibility Issues */}
          {analysis.accessibilityIssues.length > 0 && (
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                Accessibility Issues
              </h4>
              <div className="space-y-2">
                {analysis.accessibilityIssues.map((issue, index) => (
                  renderIssueWithHowTo(
                    issue, 
                    index + 400, 
                    <AlertCircle className="w-4 h-4 mt-1 text-yellow-400 flex-shrink-0" />,
                    "yellow-400",
                    "accessibility"
                  )
                ))}
              </div>
            </div>
          )}

          {/* SEO Issues */}
          {analysis.seoIssues.length > 0 && (
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-orange-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                SEO Issues
              </h4>
              <div className="space-y-2">
                {analysis.seoIssues.map((issue, index) => (
                  renderIssueWithHowTo(
                    issue, 
                    index + 600, 
                    <AlertCircle className="w-4 h-4 mt-1 text-orange-400 flex-shrink-0" />,
                    "orange-400",
                    "seo"
                  )
                ))}
              </div>
            </div>
          )}

          {/* Best Practices */}
          {analysis.bestPractices.length > 0 && (
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Best Practices
              </h4>
              <div className="space-y-2">
                {analysis.bestPractices.map((practice, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 rounded bg-slate-900/30">
                    <ArrowRight className="w-4 h-4 mt-1 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm text-slate-300">{practice}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* User Needs Section */}
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              User's Needs
            </h4>
            
            {/* Display existing user needs */}
            <div className="space-y-2 mb-3">
              {analysis.userNeeds && analysis.userNeeds.map((need, index) => (
                <div key={index} className="flex items-start justify-between gap-2 p-2 rounded bg-slate-900/30">
                  <div className="flex items-start gap-2">
                    <Star className="w-4 h-4 mt-1 text-purple-400 flex-shrink-0" />
                    <span className="text-sm text-slate-300">{need}</span>
                  </div>
                  <button 
                    onClick={() => removeUserNeed('assets', index)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <AlertCircle className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Add new user need */}
            <div className="flex gap-2">
              <input
                type="text"
                value={activeUserNeedSection === 'assets' ? newUserNeed : ''}
                onChange={(e) => {
                  setNewUserNeed(e.target.value);
                  setActiveUserNeedSection('assets');
                }}
                placeholder="Add a user need or recommendation..."
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-slate-800/80 border border-slate-700/50 focus:border-purple-500/50 focus:outline-none transition-all"
              />
              <button
                onClick={() => addUserNeed('assets')}
                disabled={activeUserNeedSection !== 'assets' || !newUserNeed.trim()}
                className="px-3 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium transition-all disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContentAnalysisResults = (contentAnalysis: AnalysisResult['content']) => {
    return (
      <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
        <h3 className="text-lg font-medium mb-3">Content Analysis Results</h3>
        
        {/* Structure Issues */}
        {contentAnalysis.structureIssues.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Structure Issues</h4>
            <div className="space-y-2">
              {contentAnalysis.structureIssues.map((issue, index) => (
                renderIssueWithHowTo(
                  issue, 
                  index + 800, 
                  <AlertCircle className="w-4 h-4 mt-1 text-red-400 flex-shrink-0" />,
                  "red-400",
                  "content"
                )
              ))}
            </div>
          </div>
        )}
        
        {/* Quality Issues */}
        {contentAnalysis.qualityIssues.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Quality Issues</h4>
            <div className="space-y-2">
              {contentAnalysis.qualityIssues.map((issue, index) => (
                renderIssueWithHowTo(
                  issue, 
                  index + 1000, 
                  <AlertCircle className="w-4 h-4 mt-1 text-yellow-400 flex-shrink-0" />,
                  "yellow-400",
                  "content"
                )
              ))}
            </div>
          </div>
        )}
        
        {/* UX Issues */}
        {contentAnalysis.uxIssues.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-300 mb-2">UX Issues</h4>
            <div className="space-y-2">
              {contentAnalysis.uxIssues.map((issue, index) => (
                renderIssueWithHowTo(
                  issue, 
                  index + 1200, 
                  <AlertCircle className="w-4 h-4 mt-1 text-orange-400 flex-shrink-0" />,
                  "orange-400",
                  "content"
                )
              ))}
            </div>
          </div>
        )}
        
        {/* SEO Issues */}
        {contentAnalysis.seoIssues.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-300 mb-2">SEO Issues</h4>
            <div className="space-y-2">
              {contentAnalysis.seoIssues.map((issue, index) => (
                renderIssueWithHowTo(
                  issue, 
                  index + 1400, 
                  <AlertCircle className="w-4 h-4 mt-1 text-blue-400 flex-shrink-0" />,
                  "blue-400",
                  "content"
                )
              ))}
            </div>
          </div>
        )}
        
        {/* User Needs Section */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            User's Needs
          </h4>
          
          {/* Display existing user needs */}
          <div className="space-y-2 mb-3">
            {contentAnalysis.userNeeds && contentAnalysis.userNeeds.map((need, index) => (
              <div key={index} className="flex items-start justify-between gap-2 p-2 rounded bg-slate-800/50">
                <div className="flex items-start gap-2">
                  <Star className="w-4 h-4 mt-1 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{need}</span>
                </div>
                <button 
                  onClick={() => removeUserNeed('content', index)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                >
                  <AlertCircle className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          
          {/* Add new user need */}
          <div className="flex gap-2">
            <input
              type="text"
              value={activeUserNeedSection === 'content' ? newUserNeed : ''}
              onChange={(e) => {
                setNewUserNeed(e.target.value);
                setActiveUserNeedSection('content');
              }}
              placeholder="Add a user need or recommendation..."
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-slate-800/80 border border-slate-700/50 focus:border-purple-500/50 focus:outline-none transition-all"
            />
            <button
              onClick={() => addUserNeed('content')}
              disabled={activeUserNeedSection !== 'content' || !newUserNeed.trim()}
              className="px-3 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSEOAnalysis = (pageAnalysis: PageAnalysis) => {
    if (!pageAnalysis.content?.metadata || !pageAnalysis.analysis.assets || !pageAnalysis.analysis.content) return null;
    const { metadata } = pageAnalysis.content;
    const { assets, content } = pageAnalysis.analysis;

    // Combine all SEO-related issues
    const seoIssues = [...(assets.seoIssues || []), ...(content.seoIssues || [])];

    return (
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 transform hover:-translate-y-1">
        <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
          SEO Analysis
        </h3>
        <div className="space-y-4">
          {/* Meta Tags Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-400 mb-3">Title Tag</h4>
                <div className="flex items-start gap-2">
                  <div className="flex-1 p-3 rounded bg-slate-900/30 text-sm text-slate-300">
                    {metadata.title || 'Missing'}
                    {metadata.title && metadata.title.length > 60 && (
                      <div className="mt-2 text-xs text-orange-400">
                        Title is too long ({metadata.title.length} chars). Keep it under 60 characters.
                      </div>
                    )}
                  </div>
                  <div className="w-16 h-16 rounded bg-slate-800 flex items-center justify-center">
                    <span className={`text-2xl font-semibold ${
                      !metadata.title ? 'text-red-400' :
                      metadata.title.length > 60 ? 'text-orange-400' : 'text-emerald-400'
                    }`}>
                      {metadata.title ? Math.min(100, Math.round((60 - (metadata.title.length || 0)) / 60 * 100)) : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-2">
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-purple-400 mb-3">Meta Description</h4>
                <div className="flex items-start gap-2">
                  <div className="flex-1 p-3 rounded bg-slate-900/30 text-sm text-slate-300">
                    {metadata.description || 'Missing'}
                    {metadata.description && metadata.description.length > 160 && (
                      <div className="mt-2 text-xs text-orange-400">
                        Description is too long ({metadata.description.length} chars). Keep it under 160 characters.
                      </div>
                    )}
                  </div>
                  <div className="w-16 h-16 rounded bg-slate-800 flex items-center justify-center">
                    <span className={`text-2xl font-semibold ${
                      !metadata.description ? 'text-red-400' :
                      metadata.description.length > 160 ? 'text-orange-400' : 'text-emerald-400'
                    }`}>
                      {metadata.description ? Math.min(100, Math.round((160 - (metadata.description.length || 0)) / 160 * 100)) : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media Preview */}
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-emerald-400 mb-3">Social Media Preview</h4>
            <div className="space-y-3">
              <div className="p-3 rounded bg-slate-900/30">
                <div className="text-xs text-slate-400 mb-1">Open Graph Title</div>
                <div className="text-sm text-slate-300">{metadata.ogTitle || metadata.title || 'Missing'}</div>
              </div>
              <div className="p-3 rounded bg-slate-900/30">
                <div className="text-xs text-slate-400 mb-1">Open Graph Description</div>
                <div className="text-sm text-slate-300">{metadata.ogDescription || metadata.description || 'Missing'}</div>
              </div>
              {metadata.ogImage && (
                <div className="p-3 rounded bg-slate-900/30">
                  <div className="text-xs text-slate-400 mb-2">Open Graph Image</div>
                  <img 
                    src={metadata.ogImage} 
                    alt="OG Preview" 
                    className="w-full h-32 object-cover rounded"
                  />
                </div>
              )}
            </div>
          </div>

          {/* SEO Issues */}
          {seoIssues.length > 0 && (
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-orange-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                SEO Issues
              </h4>
              <div className="space-y-2">
                {seoIssues.map((issue, index) => (
                  renderIssueWithHowTo(
                    issue, 
                    index + 1600, 
                    <AlertCircle className="w-4 h-4 mt-1 text-orange-400 flex-shrink-0" />,
                    "orange-400",
                    "seo"
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHighlightOverlay = () => {
    if (!highlightLocation) return null;

    return (
      <div 
        className={`element-highlight ${fallbackHighlight ? 'fallback-highlight' : ''}`}
        style={{
          left: `${highlightLocation.x}px`,
          top: `${highlightLocation.y}px`,
          width: `${highlightLocation.width}px`,
          height: `${highlightLocation.height}px`
        }}
      />
    );
  };

  // New function to render issue dots
  const renderIssueDots = (pageAnalysis: PageAnalysis) => {
    const dots: Array<{
      location: { x: number; y: number; width: number; height: number; };
      color: string;
      title: string;
      type: 'exit' | 'design';
    }> = [];

    // Add dots for exit points (red)
    const links = pageAnalysis.links || [];
    if (pageAnalysis.analysis.visual.exitPoints.length > 0 && links.length > 0) {
      links.forEach((link, index) => {
        if (index < pageAnalysis.analysis.visual.exitPoints.length && link.location.y >= 0) {
          dots.push({
            location: link.location,
            color: 'bg-red-500',
            title: pageAnalysis.analysis.visual.exitPoints[index],
            type: 'exit'
          });
          console.log(`Added exit point dot at: `, link.location);
        }
      });
    }

    // Add dots for design issues (orange)
    if (pageAnalysis.analysis.visual.designIssues.length > 0) {
      pageAnalysis.analysis.visual.designIssues.forEach((issue, index) => {
        // Try to find a better location for design issues
        let location;
        
        // First try to find a location from images
        const images = pageAnalysis.content?.images || [];
        if (images.length > 0) {
          // Try to find an image with a valid location
          for (let i = 0; i < images.length; i++) {
            if (images[i]?.location && images[i].location.y > 0 && images[i].location.width > 0) {
              location = images[i].location;
              console.log(`Found design issue location from image ${i}:`, location);
              break;
            }
          }
          
          // If no valid image found, use the first image with fallback positioning
          if (!location && images[0]?.location) {
            location = {
              ...images[0].location,
              // Ensure y is positive
              y: Math.max(100, images[0].location.y)
            };
            console.log(`Using fallback image location for design issue:`, location);
          }
        }
        
        // If no image location found, try to find from headings
        if (!location) {
          const headings = pageAnalysis.content?.textContent?.headings || [];
          if (headings.length > 0) {
            // Try to find a heading with a valid location
            for (let i = 0; i < headings.length; i++) {
              if (headings[i]?.location && headings[i].location.y > 0 && headings[i].location.width > 0) {
                location = headings[i].location;
                console.log(`Found design issue location from heading ${i}:`, location);
                break;
              }
            }
          }
        }
        
        // If still no location, try paragraphs
        if (!location) {
          const paragraphs = pageAnalysis.content?.textContent?.paragraphs || [];
          if (paragraphs.length > 0) {
            // Try to find a paragraph with a valid location
            for (let i = 0; i < paragraphs.length; i++) {
              if (paragraphs[i]?.location && paragraphs[i].location.y > 0 && paragraphs[i].location.width > 0) {
                location = paragraphs[i].location;
                console.log(`Found design issue location from paragraph ${i}:`, location);
                break;
              }
            }
          }
        }
        
        // If still no valid location, create a fallback location based on index
        if (!location) {
          // Create a fallback location that's visible in the viewport
          location = {
            x: 100 + (index * 50), // Spread dots horizontally
            y: 200 + (index * 100), // Position dots down the page with spacing
            width: 100,
            height: 50
          };
          console.log(`Created fallback location for design issue:`, location);
        }

        // Only add the dot if we have a valid location
        if (location) {
          dots.push({
            location,
            color: 'bg-orange-500',
            title: issue,
            type: 'design'
          });
          console.log(`Added design issue dot at:`, location);
        }
      });
    }

    console.log(`Total dots to render: ${dots.length}`);

    // Sort dots by y position to ensure consistent rendering
    dots.sort((a, b) => a.location.y - b.location.y);

    return dots.map((dot, index) => (
      <div
        key={index}
        className={`issue-dot ${dot.color} ${dot.type === 'exit' ? 'scale-125' : ''}`}
        style={{
          position: 'absolute',
          left: `${Math.max(0, dot.location.x + dot.location.width / 2)}px`,
          top: `${Math.max(0, dot.location.y + dot.location.height / 2)}px`,
          zIndex: dot.type === 'exit' ? 1001 : 1000,
          transform: `translate(-50%, -50%) ${dot.type === 'exit' ? 'scale(1.25)' : 'scale(1)'}`,
          willChange: 'transform'
        }}
        data-tooltip={`${dot.type === 'exit' ? '🚪 Exit Point: ' : '🎨 Design Issue: '}${dot.title}`}
        onClick={() => {
          setHighlightLocation(dot.location);
          setFallbackHighlight(false);
          setActiveHighlight(dot.type === 'exit' ? index : index + 100);
          
          // Scroll to the dot location
          if (previewRef.current) {
            const containerHeight = previewRef.current.clientHeight;
            const scrollTop = Math.max(
              0,
              dot.location.y - (containerHeight - dot.location.height) / 2
            );
            
            previewRef.current.scrollTo({
              top: scrollTop,
              behavior: 'smooth'
            });
          }
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            setHighlightLocation(null);
            setActiveHighlight(null);
            setFallbackHighlight(false);
          }, 3000);
        }}
      />
    ));
  };

  const renderAnalysisSection = (pageAnalysis: PageAnalysis) => {
    // Debug the data in the render function
    console.log('Rendering analysis section with data:', pageAnalysis);
    console.log('Exit Points in render:', pageAnalysis.analysis.visual.exitPoints);
    console.log('Design Issues in render:', pageAnalysis.analysis.visual.designIssues);
    
    return (
      <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 shadow-lg overflow-hidden">
        {/* Preview Section */}
        <div className="relative w-full max-w-4xl mx-auto p-6">
          <div className="relative rounded-xl overflow-hidden border border-slate-700/50">
            {/* Preview Controls */}
            <div className="absolute top-2 right-2 z-10 flex gap-2">
              <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-700/50">
                {/* Issue Type Legend */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-xs text-slate-300">Exit Points</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></span>
                    <span className="text-xs text-slate-300">Design Issues</span>
                  </div>
                </div>
                <div className="w-px h-6 bg-slate-700"></div>
                <button
                  onClick={() => setAutoScrolling(!autoScrolling)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                    autoScrolling 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={autoScrolling ? "Stop auto-scrolling" : "Start auto-scrolling"}
                >
                  {autoScrolling ? (
                    <>
                      <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                      Stop Scrolling
                    </>
                  ) : (
                    <>Auto-Scroll</>
                  )}
                </button>
              </div>
            </div>
            
            <div 
              ref={previewRef}
              className="h-[500px] overflow-y-auto relative preview-container will-change-transform"
              onScroll={(e) => {
                const container = e.currentTarget;
                if (container.scrollTop < 0) {
                  container.scrollTop = 0;
                }
              }}
            >
              <div className="preview-content will-change-transform">
              <img 
                src={`data:image/png;base64,${pageAnalysis.screenshot}`} 
                alt={`Screenshot of ${pageAnalysis.title}`}
                  className="w-full select-none"
                  loading="eager"
                  decoding="sync"
                />
                
                {/* Render issue dots */}
                {renderIssueDots(pageAnalysis)}
                
                {/* Render highlight overlay */}
                {renderHighlightOverlay()}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Analysis Section */}
        <div className="bg-slate-900/50 border-t border-slate-700/50 p-8">
          <div className="max-w-5xl mx-auto">
            {/* Download Buttons */}
            <div className="flex justify-end mb-6 gap-3">
              <button
                onClick={downloadAnalysisPDF}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/20 pdf-download-btn"
                title="Download Analysis as PDF"
              >
                <Download className="w-4 h-4" />
                <span>PDF Report</span>
              </button>
              
              <button
                onClick={downloadAnalysisWord}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/20 word-download-btn"
                title="Download Analysis as Word Document"
              >
                <FileText className="w-4 h-4" />
                <span>Word Report</span>
              </button>
              
              <button
                onClick={shareAnalysisViaEmail}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/20 share-btn"
                title="Share Analysis via Email"
              >
                <Share className="w-4 h-4" />
                <span>Share Report</span>
              </button>
            </div>
            
            {/* Analysis Timeline */}
            <div className="space-y-12">
              {/* Visual Analysis */}
              <div className="relative">
                <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-blue-500 to-purple-500"></div>
                
                {/* Exit Points */}
                <div className="ml-8 mb-12 relative">
                  <div className="absolute -left-10 top-3 w-4 h-4 rounded-full bg-red-500 shadow-lg shadow-red-500/20 animate-pulse"></div>
                  <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Exit Points</h3>
                  <div className="grid gap-3">
                    {Array.isArray(pageAnalysis.analysis.visual.exitPoints) && pageAnalysis.analysis.visual.exitPoints.length > 0 ? (
                      pageAnalysis.analysis.visual.exitPoints.map((point, index) => (
                        <div 
                          key={index}
                          className={`group bg-slate-800/50 p-4 rounded-xl border border-slate-700/30 hover:border-red-500/30 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${activeHighlight === index ? 'border-red-500 ring-2 ring-red-500/50' : ''}`}
                          onClick={() => handleElementClick(pageAnalysis.links?.[index]?.location)}
                        >
                          <div className="flex items-start gap-3">
                            <ArrowRight className="w-5 h-5 text-red-400 flex-shrink-0 group-hover:rotate-45 transition-transform duration-300" />
                            <span className="text-slate-300 group-hover:text-red-400 transition-colors duration-300 flex-grow">{point}</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => handleLocateIssue(index, point, 'exitPoint', e)}
                                className={`px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1 ${isSearchingElement ? 'opacity-50 cursor-wait' : ''}`}
                                disabled={isSearchingElement}
                              >
                                {isSearchingElement ? (
                                  <Search className="w-3 h-3 animate-spin" />
                                ) : (
                                  <MapPin className="w-3 h-3" />
                                )}
                                Locate
                              </button>
                              <button
                                onClick={(e) => handleHowToClick(point, e)}
                                className="px-2 py-1 rounded text-xs font-medium bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors flex items-center gap-1"
                              >
                                <HelpCircle className="w-3 h-3" />
                                How to
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                        <p className="text-slate-400">No exit points detected. The page appears to have good user retention design.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Design Issues */}
                <div className="ml-8 mb-12 relative">
                  <div className="absolute -left-10 top-3 w-4 h-4 rounded-full bg-orange-500 shadow-lg shadow-orange-500/20 animate-pulse"></div>
                  <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">Design Issues</h3>
                  <div className="grid gap-3">
                    {Array.isArray(pageAnalysis.analysis.visual.designIssues) && pageAnalysis.analysis.visual.designIssues.length > 0 ? (
                      pageAnalysis.analysis.visual.designIssues.map((issue, index) => (
                        <div 
                          key={index}
                          className={`group bg-slate-800/50 p-4 rounded-xl border border-slate-700/30 hover:border-orange-500/30 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${activeHighlight === index + 100 ? 'border-orange-500 ring-2 ring-orange-500/50' : ''}`}
                          onClick={() => handleElementClick(pageAnalysis.content?.images?.[index]?.location)}
                        >
                          <div className="flex items-start gap-3">
                            <ArrowRight className="w-5 h-5 text-orange-400 flex-shrink-0 group-hover:rotate-45 transition-transform duration-300" />
                            <span className="text-slate-300 group-hover:text-orange-400 transition-colors duration-300 flex-grow">{issue}</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => handleLocateIssue(index, issue, 'designIssue', e)}
                                className={`px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1 ${isSearchingElement ? 'opacity-50 cursor-wait' : ''}`}
                                disabled={isSearchingElement}
                              >
                                {isSearchingElement ? (
                                  <Search className="w-3 h-3 animate-spin" />
                                ) : (
                                  <MapPin className="w-3 h-3" />
                                )}
                                Locate
                              </button>
                              <button
                                onClick={(e) => handleHowToClick(issue, e)}
                                className="px-2 py-1 rounded text-xs font-medium bg-orange-400/10 text-orange-400 hover:bg-orange-400/20 transition-colors flex items-center gap-1"
                              >
                                <HelpCircle className="w-3 h-3" />
                                How to
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                        <p className="text-slate-400">No significant design issues detected. The page has a clean design.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="ml-8 relative">
                  <div className="absolute -left-10 top-3 w-4 h-4 rounded-full bg-green-500 shadow-lg shadow-green-500/20 animate-pulse"></div>
                  <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Recommendations</h3>
                  <div className="grid gap-3">
                    {pageAnalysis.analysis.visual.recommendations.map((rec, index) => (
                      <div 
                        key={index}
                        className="group bg-slate-800/50 p-4 rounded-xl border border-slate-700/30 hover:border-green-500/30 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                        onMouseEnter={() => handleElementClick(pageAnalysis.content?.textContent?.headings?.[index]?.location)}
                      >
                        <div className="flex items-start gap-3">
                          <ArrowRight className="w-5 h-5 text-green-400 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-300" />
                          <span className="text-slate-300 group-hover:text-green-400 transition-colors duration-300">{rec}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* User Needs Section */}
                <div className="ml-8 mt-12 relative">
                  <div className="absolute -left-10 top-3 w-4 h-4 rounded-full bg-purple-500 shadow-lg shadow-purple-500/20 animate-pulse"></div>
                  <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">User's Needs</h3>
                  
                  {/* Display existing user needs */}
                  <div className="grid gap-3 mb-4">
                    {pageAnalysis.analysis.visual.userNeeds && pageAnalysis.analysis.visual.userNeeds.map((need, index) => (
                      <div 
                        key={index}
                        className="group bg-slate-800/50 p-4 rounded-xl border border-slate-700/30 hover:border-purple-500/30 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <Star className="w-5 h-5 text-purple-400 flex-shrink-0" />
                            <span className="text-slate-300">{need}</span>
                          </div>
                          <button 
                            onClick={() => removeUserNeed('visual', index)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Add new user need */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={activeUserNeedSection === 'visual' ? newUserNeed : ''}
                      onChange={(e) => {
                        setNewUserNeed(e.target.value);
                        setActiveUserNeedSection('visual');
                      }}
                      placeholder="Add a user need or recommendation..."
                      className="flex-1 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 focus:border-purple-500/50 focus:outline-none transition-all"
                    />
                    <button
                      onClick={() => addUserNeed('visual')}
                      disabled={activeUserNeedSection !== 'visual' || !newUserNeed.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium transition-all disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Additional Analysis Sections */}
              <div className="ml-8 relative">
                <div className="absolute -left-10 top-3 w-4 h-4 rounded-full bg-blue-500 shadow-lg shadow-blue-500/20 animate-pulse"></div>
                <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Additional Insights</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {renderContentAnalysis(pageAnalysis.content)}
                  {renderAssetsAnalysis(pageAnalysis.assets, pageAnalysis.analysis.assets)}
                  {renderContentAnalysisResults(pageAnalysis.analysis.content)}
                  {renderSEOAnalysis(pageAnalysis)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const downloadAnalysisPDF = () => {
    if (!analysis) {
      toast.error('Analysis data not available');
      return;
    }

    try {
      toast.success('Generating PDF...');
      generateAnalysisPDF(analysis, `analysis_${analysis.mainPage.title.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      toast.error('Failed to download analysis PDF');
      console.error('Error downloading analysis PDF:', error);
    }
  };

  const downloadAnalysisWord = async () => {
    if (!analysis) {
      toast.error('Analysis data not available');
      return;
    }

    try {
      toast.success('Generating Word document...');
      await generateAnalysisWord(analysis, `analysis_${analysis.mainPage.title.replace(/\s+/g, '_')}.docx`);
    } catch (error) {
      toast.error('Failed to download Word document');
      console.error('Error downloading Word document:', error);
    }
  };

  const shareAnalysisViaEmail = async () => {
    console.log('Share button clicked');
    
    if (!analysis) {
      console.error('Analysis data not available');
      toast.error('Analysis data not available');
      return;
    }

    console.log('Setting showEmailModal to true');
    setShowEmailModal(true);
    console.log('showEmailModal set to:', true);
  };

  const handleSendEmail = async () => {
    console.log('handleSendEmail called');
    
    if (!analysis) {
      console.error('Analysis data not available');
      toast.error('Analysis data not available');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      console.error('Invalid email address:', emailAddress);
      toast.error('Please enter a valid email address');
      return;
    }

    console.log('Sending email to:', emailAddress);
    setIsSendingEmail(true);
    try {
      console.log('Calling sendAnalysisEmail');
      const response = await sendAnalysisEmail(analysis, emailAddress);
      console.log('Email sent successfully:', response);
      toast.success(`Analysis report sent to ${emailAddress}`);
      setShowEmailModal(false);
      setEmailAddress('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleGetStarted = () => {
    console.log('handleGetStarted called');
    setShowInputSection(true);
    setAnalysis(null);
    setLoading(false);
    setActiveTab('main');
    setAnalysisComplete(false);
    
    setTimeout(() => {
      const urlInput = document.querySelector('input[type="url"]') as HTMLInputElement;
      if (urlInput) {
        urlInput.focus();
      }
    }, 100);
  };

  // Add new function to generate optimized prompt
  const generateOptimizedPrompt = (analysis: FullAnalysis): string => {
    const {
      visual,
      assets,
      content
    } = analysis.mainPage.analysis;

    // Extract key issues and requirements
    const designIssues = visual.designIssues;
    const performanceIssues = assets.performanceIssues;
    const accessibilityIssues = assets.accessibilityIssues;
    const seoIssues = [...assets.seoIssues, ...content.seoIssues];
    const contentIssues = [...content.structureIssues, ...content.qualityIssues];
    const uxIssues = content.uxIssues;

    // Build the optimized prompt
    return `Create a modern, high-performance website with the following specifications:

Key Requirements:
${[
  // Design Requirements
  designIssues.length > 0 ? `Design Focus:
- Implement a clean, modern design that addresses these issues:
  ${designIssues.map(issue => `- ${issue}`).join('\n  ')}
- Use a cohesive color scheme and typography system
- Ensure visual hierarchy and balanced layout` : '',

  // Performance Requirements
  performanceIssues.length > 0 ? `Performance Optimization:
- Build with performance-first approach addressing:
  ${performanceIssues.map(issue => `- ${issue}`).join('\n  ')}
- Implement lazy loading and code splitting
- Optimize all assets and implement caching strategies` : '',

  // Accessibility Requirements
  accessibilityIssues.length > 0 ? `Accessibility Standards:
- Ensure WCAG 2.1 AA compliance addressing:
  ${accessibilityIssues.map(issue => `- ${issue}`).join('\n  ')}
- Implement proper ARIA labels and keyboard navigation
- Ensure proper color contrast and text scaling` : '',

  // SEO Requirements
  seoIssues.length > 0 ? `SEO Optimization:
- Implement SEO best practices addressing:
  ${seoIssues.map(issue => `- ${issue}`).join('\n  ')}
- Use semantic HTML structure
- Implement proper meta tags and structured data` : '',

  // Content Structure
  contentIssues.length > 0 ? `Content Structure:
- Organize content effectively addressing:
  ${contentIssues.map(issue => `- ${issue}`).join('\n  ')}
- Implement clear information hierarchy
- Use engaging and readable typography` : '',

  // UX Improvements
  uxIssues.length > 0 ? `User Experience:
- Enhance user experience addressing:
  ${uxIssues.map(issue => `- ${issue}`).join('\n  ')}
- Create intuitive navigation
- Implement smooth transitions and feedback` : '',

  // Technical Requirements
  `Technical Specifications:
- Use modern frontend framework (React/Next.js)
- Implement responsive design (mobile-first approach)
- Ensure cross-browser compatibility
- Set up proper error handling and loading states
- Implement analytics and monitoring
- Use modern build tools and optimization techniques`,

  // Best Practices
  `Best Practices:
- Follow clean code principles and maintainable architecture
- Implement proper security measures
- Use modern CSS practices (Flexbox/Grid, CSS Variables)
- Ensure proper form validation and error handling
- Implement proper testing (unit, integration, e2e)
- Use proper version control and documentation`
].filter(Boolean).join('\n\n')}

Additional Considerations:
- Ensure the website loads under 3 seconds
- Achieve 90+ scores in Lighthouse for all categories
- Implement proper CI/CD pipeline
- Use environment variables for sensitive data
- Follow proper Git workflow and branching strategy

The website should not only fix the existing issues but set a new standard for web development best practices, creating an exceptional user experience while maintaining high performance and accessibility standards.`;
  };

  // Add a function to handle adding user needs
  const addUserNeed = (section: 'visual' | 'assets' | 'content', pageIndex: number = 0) => {
    if (!analysis || !newUserNeed.trim()) return;
    
    setAnalysis(prevAnalysis => {
      if (!prevAnalysis) return null;
      
      const updatedAnalysis = {...prevAnalysis};
      
      if (pageIndex === 0) {
        // Add to main page
        updatedAnalysis.mainPage.analysis[section].userNeeds = [
          ...updatedAnalysis.mainPage.analysis[section].userNeeds,
          newUserNeed.trim()
        ];
      } else if (updatedAnalysis.additionalPages && updatedAnalysis.additionalPages.length >= pageIndex) {
        // Add to additional page
        const pageIdx = pageIndex - 1;
        updatedAnalysis.additionalPages[pageIdx].analysis[section].userNeeds = [
          ...updatedAnalysis.additionalPages[pageIdx].analysis[section].userNeeds,
          newUserNeed.trim()
        ];
      }
      
      return updatedAnalysis;
    });
    
    setNewUserNeed('');
    toast.success('User need added successfully!');
  };

  // Add a function to remove user needs
  const removeUserNeed = (section: 'visual' | 'assets' | 'content', index: number, pageIndex: number = 0) => {
    if (!analysis) return;
    
    setAnalysis(prevAnalysis => {
      if (!prevAnalysis) return null;
      
      const updatedAnalysis = {...prevAnalysis};
      
      if (pageIndex === 0) {
        // Remove from main page
        updatedAnalysis.mainPage.analysis[section].userNeeds = 
          updatedAnalysis.mainPage.analysis[section].userNeeds.filter((_, i) => i !== index);
      } else if (updatedAnalysis.additionalPages && updatedAnalysis.additionalPages.length >= pageIndex) {
        // Remove from additional page
        const pageIdx = pageIndex - 1;
        updatedAnalysis.additionalPages[pageIdx].analysis[section].userNeeds = 
          updatedAnalysis.additionalPages[pageIdx].analysis[section].userNeeds.filter((_, i) => i !== index);
      }
      
      return updatedAnalysis;
    });
    
    toast.success('User need removed successfully!');
  };

  // Add useEffect to check modal rendering
  useEffect(() => {
    if (showEmailModal) {
      console.log('Modal state changed to:', showEmailModal);
      // Check if modal is in DOM
      setTimeout(() => {
        const modalElement = document.querySelector('.modal-overlay');
        console.log('Modal element exists in DOM:', !!modalElement);
        if (modalElement) {
          console.log('Modal element style:', window.getComputedStyle(modalElement));
          console.log('Modal z-index:', window.getComputedStyle(modalElement).zIndex);
        }
      }, 100);
    }
  }, [showEmailModal]);

  return (
    <div className={`min-h-screen bg-slate-950 text-white relative ${analysisComplete ? 'analysis-complete' : ''}`}>
      {/* Background components */}
      <StarsBackground
        starDensity={0.0001}
        minTwinkleSpeed={2}
        maxTwinkleSpeed={4}
        className="z-0"
      />
      <ShootingStars
        starColor="#9E00FF"
        trailColor="#2EB9DF"
        minDelay={2000}
        maxDelay={5000}
        className="z-10"
      />

      <Toaster position="top-right" />
      
      {/* Show Landing Page when no analysis is started and input section is not shown */}
      {!loading && !analysis && !showInputSection && (
        <div className="relative z-20">
          <LandingPage onGetStarted={handleGetStarted} />
        </div>
      )}
      
      {/* Header with cosmic gradient */}
      {(showInputSection || loading || analysis) && (
        <header className="relative pt-24 pb-16 px-4 text-center overflow-hidden z-20">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F3F]/20 via-[#4B0082]/20 to-[#800080]/20 animate-gradient-x"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-6 animate-fade-in cosmic-pulse">
              <div className="p-3 bg-[#4B0082]/10 rounded-full backdrop-blur-sm border border-[#800080]/20 shadow-lg relative group cosmic-glow">
                <div className="cosmic-spin">
                  <Star className="w-12 h-12 text-[#9F2B68] animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-full bg-[#4B0082]/30 blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              </div>
              <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#9F2B68] via-[#800080] to-[#4B0082]">
                StarWeb
              </h1>
            </div>
            <div className="text-lg text-[#B19CD9] mb-2 animate-fade-in-delayed">by Stellar</div>
            <p className="text-[#E6E6FA] max-w-2xl mx-auto text-lg leading-relaxed animate-fade-in-delayed">
              Explore the cosmos of web analytics with our AI-powered insights. Navigate through user patterns,
              design elements, and stellar recommendations.
            </p>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 py-8 pb-20 relative z-20 ${analysisComplete ? 'mt-4' : ''}`}>
        {/* URL Input Section - Only show when analysis is not complete and input section is shown */}
        {!analysisComplete && (showInputSection || loading) && !analysis && (
        <div className="bg-[#0F0F3F]/30 p-8 rounded-2xl backdrop-blur-sm border border-[#4B0082]/50 shadow-xl hover:shadow-[#800080]/20 transition-all duration-300 transform hover:-translate-y-1 cosmic-glow">
            <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex-1 relative group">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter website URL (e.g., https://example.com)"
                className="w-full px-6 py-4 rounded-xl bg-[#0F0F3F]/50 border border-[#4B0082]/50 focus:border-[#800080]/50 focus:outline-none transition-all duration-300 group-hover:border-[#9F2B68]/30 text-lg"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#4B0082]/0 via-[#800080]/10 to-[#9F2B68]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            <button
              onClick={analyzeWebsite}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-[#4B0082] to-[#800080] hover:from-[#9F2B68] hover:to-[#4B0082] rounded-xl font-medium flex items-center gap-3 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg hover:shadow-[#800080]/20 cosmic-glow"
            >
              {loading ? (
                <>
                  <Scan className="animate-spin" />
                  <span className="text-lg">Analyzing...</span>
                </>
              ) : (
                <>
                  <Star className="animate-pulse" />
                  <span className="text-lg">Explore</span>
                </>
              )}
            </button>
          </div>
              
              {/* Back to Home button */}
              {!loading && (
                <button
                  onClick={() => setShowInputSection(false)}
                  className="text-slate-400 hover:text-slate-300 transition-colors text-sm flex items-center gap-1 self-start mt-2"
                >
                  <ArrowRight className="w-3 h-3 rotate-180" />
                  <span>Back to Home</span>
                </button>
              )}
        </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className={`${analysisComplete ? 'analysis-section' : 'mt-12'} animate-fade-up`}>
            {/* Navigation Tabs with hover effects */}
            <div className="flex mb-8 border-b border-[#4B0082]/50 gap-2">
              <button
                className={`px-6 py-3 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'main' 
                    ? 'bg-[#4B0082]/20 text-white border-b-2 border-[#800080]' 
                    : 'text-[#B19CD9] hover:bg-[#0F0F3F]/10'
                }`}
                onClick={() => setActiveTab('main')}
              >
                Main Analysis
              </button>
              <button
                className={`px-6 py-3 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'links' 
                    ? 'bg-[#4B0082]/20 text-white border-b-2 border-[#800080]' 
                    : 'text-[#B19CD9] hover:bg-[#0F0F3F]/10'
                }`}
                onClick={() => setActiveTab('links')}
              >
                All Links ({analysis.allLinks?.length || 0})
              </button>
            </div>

            {/* Main Analysis Tab with card effects */}
            {activeTab === 'main' && (
              <div className="space-y-8">
                {/* Main Page Analysis */}
                {renderAnalysisSection(analysis.mainPage)}
                
                {/* Additional Pages Analysis */}
                {analysis.additionalPages && analysis.additionalPages.length > 0 && (
                  <div className="animate-fade-up">
                    <h2 className="text-2xl font-semibold mb-6 mt-12 flex items-center gap-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      <LinkIcon className="text-blue-400" />
                      Additional Pages ({analysis.additionalPages.length})
                    </h2>
                    <div className="space-y-6">
                      {analysis.additionalPages.map((page, index) => (
                        <div key={index} className="transform transition-all duration-300 hover:-translate-y-1">
                          {renderAnalysisSection(page)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Links Tab with hover effects */}
            {activeTab === 'links' && (
              <div className="animate-fade-up">
                <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 shadow-lg p-8">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  <LinkIcon className="text-blue-400" />
                    All Links
                </h2>
                  
                  <div className="space-y-4">
                    {analysis.allLinks?.map((link, index) => (
                      <div 
                      key={index}
                        className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30 hover:border-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-between"
                      >
                        <span className="text-slate-300 truncate">{link}</span>
                        <a 
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
                        >
                          <span>Visit</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI-Optimized Website Prompt Section */}
            <div className="mt-16 bg-slate-800/30 rounded-2xl border border-slate-700/50 shadow-lg p-8 hover:shadow-purple-500/10 transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <Code className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  AI-Optimized Website Prompt
                </h2>
              </div>
              
              <div className="prose prose-invert max-w-none">
                <div className="bg-slate-900/50 rounded-xl p-6 font-mono text-sm whitespace-pre-wrap border border-slate-700/50">
                  {generateOptimizedPrompt(analysis)}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateOptimizedPrompt(analysis));
                    toast.success('Prompt copied to clipboard!');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg text-purple-400 transition-colors duration-300"
                >
                  <ClipboardCopy className="w-4 h-4" />
                  <span>Copy Prompt</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* How To Popup */}
      <HowToPopup
        isOpen={showHowToPopup}
        onClose={() => setShowHowToPopup(false)}
        issue={currentIssue}
        solution={currentSolution}
        isLoading={isLoadingSolution}
      />

      {/* Email Modal */}
      {/* Debug - showEmailModal: {showEmailModal.toString()} */}
      {showEmailModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          {/* Debug - Modal content is rendering */}
          <div style={{
            background: 'linear-gradient(to bottom, #1e293b, #0f172a)',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                margin: 0,
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 600
              }}>Share Analysis Report</h2>
              <button 
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  transition: 'color 0.2s'
                }}
                onClick={() => setShowEmailModal(false)}
              >
                &times;
              </button>
            </div>
            <div style={{
              padding: '1.5rem'
            }}>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '1rem'
              }}>Enter an email address to receive the analysis report:</p>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="email@example.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>
            <div style={{
              padding: '1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              <button 
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'transparent',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
                onClick={() => setShowEmailModal(false)}
              >
                Cancel
              </button>
              <button 
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(to right, #4ade80, #14b8a6)',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  opacity: isSendingEmail ? 0.7 : 1
                }}
                onClick={handleSendEmail}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? 'Sending...' : 'Send Report'}
              </button>
              <button 
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 99, 71, 0.2)',
                  color: 'rgba(255, 99, 71, 0.8)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  marginRight: 'auto'
                }}
                onClick={() => {
                  // Test the email functionality
                  fetch('http://localhost:3001/api/send-test-email')
                    .then(response => response.json())
                    .then(data => {
                      console.log('Test email response:', data);
                      if (data.success) {
                        toast.success('Test email sent successfully');
                      } else {
                        toast.error(`Test email failed: ${data.message}`);
                      }
                    })
                    .catch(error => {
                      console.error('Error sending test email:', error);
                      toast.error(`Error: ${error.message}`);
                    });
                }}
              >
                Test Email
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }

        @keyframes cosmic-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .cosmic-pulse {
          animation: float 6s ease-in-out infinite;
        }

        .cosmic-glow {
          box-shadow: 0 0 30px rgba(159, 43, 104, 0.2);
        }

        .cosmic-spin {
          animation: cosmic-spin 20s linear infinite;
        }
        `}
      </style>
    </div>
  );
}

export default App;