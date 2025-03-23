export type AnalysisResult = {
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

export type Location = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Assets = {
  images: Array<{
    type: string;
    src: string;
    alt: string;
    width: number;
    height: number;
    loading: string;
    location: Location;
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
    location: Location;
  }>;
  fonts: Array<{
    type: string;
    href: string;
    format: string;
  }>;
};

export type PageContent = {
  textContent?: {
    headings?: Array<{
      text: string;
      level: number;
      location: Location;
    }>;
    paragraphs?: Array<{
      text: string;
      location: Location;
    }>;
    lists?: Array<{
      items: string[];
      type: string;
      location: Location;
    }>;
  };
  images?: Array<{
    src: string;
    alt: string;
    location: Location;
  }>;
  buttons?: Array<{
    text: string;
    location: Location;
  }>;
  forms?: Array<{
    inputs: Array<{
      type: string;
      placeholder: string;
      required: boolean;
      location: Location;
    }>;
    location: Location;
  }>;
  navigation?: Array<{
    items: Array<{
      text: string;
      url: string;
      location: Location;
    }>;
    location: Location;
  }>;
  footerContent?: {
    text: string;
    links: Array<{
      text: string;
      url: string;
      location: Location;
    }>;
    location: Location;
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

export type PageLink = {
  url: string;
  text: string;
  location: Location;
};

export type PageAnalysis = {
  url: string;
  title: string;
  analysis: AnalysisResult;
  screenshot: string;
  content: PageContent;
  assets: Assets;
  links?: PageLink[];
};

export type FullAnalysis = {
  mainPage: PageAnalysis;
  additionalPages: PageAnalysis[];
  allLinks: string[];
}; 