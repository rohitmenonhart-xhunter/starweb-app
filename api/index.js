// This file serves as an index for the API routes
// Vercel will automatically detect these routes

// Combined endpoints (to reduce serverless function count)
export { default as utils } from './combined-utils.js';
export { default as analysis } from './combined-analysis.js';
export { default as email } from './email-handler.js';

// Essential endpoints that need their own functions
export { default as analyze } from './analyze-lightweight.js'; 