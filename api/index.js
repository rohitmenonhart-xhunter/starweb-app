// This file serves as an index for the API routes
// Vercel will automatically detect these routes

export { default as analyze } from './analyze-lightweight.js';
export { default as originalAnalyze } from './analyze.js';
export { default as analyzeUrl } from './analyze-url/index.js';
export { default as generateSolution } from './generate-solution.js';
export { default as sendEmail } from './send-email.js';
export { default as testEmailConfig } from './test-email-config.js';
export { default as health } from './health.js';
export { default as browserCheck } from './browser-check.js'; 