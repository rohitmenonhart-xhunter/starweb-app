import axios from 'axios';

/**
 * Sends an email with the analysis report to the specified email address
 * @param {Object} analysis The full analysis data
 * @param {string} email The recipient's email address
 * @returns {Promise<Object>} The response from the server
 */
export const sendAnalysisEmail = async (analysis, email) => {
  console.log('sendAnalysisEmail called with email:', email);
  
  try {
    // Create a simplified HTML version of the report
    console.log('Generating HTML report');
    const htmlReport = generateHtmlReport(analysis);
    console.log('HTML report generated, length:', htmlReport.length);
    
    // Try to send to both possible ports in development
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // In development, try port 3001 first (which is where the server is running)
    // In production, use a relative URL
    const serverUrl = isLocalhost ? `http://${window.location.hostname}:3001` : '';
    
    // Send the email via the server
    console.log('Sending POST request to', `${serverUrl}/api/send-email`);
    try {
      const response = await axios.post(`${serverUrl}/api/send-email`, {
        to: email,
        subject: `StarWeb Analysis Report - ${analysis.mainPage.title}`,
        html: htmlReport,
        siteName: analysis.mainPage.title,
        siteUrl: analysis.mainPage.url
      });
      
      console.log('Email API response:', response.data);
      return response.data;
    } catch (axiosError) {
      console.error('Axios error details:', {
        message: axiosError.message,
        response: axiosError.response ? {
          status: axiosError.response.status,
          data: axiosError.response.data
        } : 'No response',
        request: axiosError.request ? 'Request exists' : 'No request'
      });
      
      // If we're in development and the first attempt failed, try the other port
      if (isLocalhost && axiosError.message && axiosError.message.includes('Network Error')) {
        try {
          console.log('Retrying with port 3002');
          const alternateServerUrl = `http://${window.location.hostname}:3002`;
          
          const response = await axios.post(`${alternateServerUrl}/api/send-email`, {
            to: email,
            subject: `StarWeb Analysis Report - ${analysis.mainPage.title}`,
            html: htmlReport,
            siteName: analysis.mainPage.title,
            siteUrl: analysis.mainPage.url
          });
          
          console.log('Email API response (second attempt):', response.data);
          return response.data;
        } catch (retryError) {
          console.error('Error on retry details:', {
            message: retryError.message,
            response: retryError.response ? {
              status: retryError.response.status,
              data: retryError.response.data
            } : 'No response',
            request: retryError.request ? 'Request exists' : 'No request'
          });
          throw new Error(retryError.message || 'Failed to send analysis email');
        }
      }
      
      throw axiosError;
    }
  } catch (error) {
    console.error('Error sending analysis email:', error);
    throw new Error(error.message || 'Failed to send analysis email');
  }
};

/**
 * Generates an HTML report from the analysis data
 * @param {Object} analysis The full analysis data
 * @returns {string} The HTML report
 */
const generateHtmlReport = (analysis) => {
  // Get the current date and time
  const generatedDate = new Date().toLocaleDateString();
  const generatedTime = new Date().toLocaleTimeString();
  
  // Count total issues
  const totalIssues = 
    analysis.mainPage.analysis.visual.exitPoints.length +
    analysis.mainPage.analysis.visual.designIssues.length +
    analysis.mainPage.analysis.assets.performanceIssues.length +
    analysis.mainPage.analysis.assets.accessibilityIssues.length +
    analysis.mainPage.analysis.assets.seoIssues.length +
    analysis.mainPage.analysis.content.structureIssues.length +
    analysis.mainPage.analysis.content.qualityIssues.length +
    analysis.mainPage.analysis.content.seoIssues.length +
    analysis.mainPage.analysis.content.uxIssues.length;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>StarWeb Analysis Report - ${analysis.mainPage.title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(to right, #4B0082, #9E00FF);
          color: white;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 30px;
          text-align: center;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .tagline {
          font-size: 14px;
          opacity: 0.8;
        }
        .summary {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 30px;
        }
        .stats {
          display: flex;
          justify-content: space-between;
          margin: 20px 0;
          flex-wrap: wrap;
        }
        .stat-box {
          background-color: #f0f0f0;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          width: 30%;
          margin-bottom: 10px;
        }
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #4B0082;
        }
        .stat-label {
          font-size: 14px;
          color: #666;
        }
        .section {
          margin-bottom: 30px;
          background-color: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        h2 {
          color: #4B0082;
          margin-bottom: 15px;
          font-size: 22px;
        }
        h3 {
          margin-bottom: 10px;
          font-size: 18px;
        }
        ul {
          margin-bottom: 0;
          padding-left: 20px;
        }
        li {
          margin-bottom: 8px;
          line-height: 1.5;
        }
        .exit-points h3 {
          color: #FF0000;
        }
        .design-issues h3 {
          color: #FFA500;
        }
        .recommendations h3 {
          color: #008000;
        }
        .performance h3 {
          color: #FF6347;
        }
        .accessibility h3 {
          color: #4682B4;
        }
        .seo h3 {
          color: #9370DB;
        }
        .best-practices h3 {
          color: #20B2AA;
        }
        .structure h3 {
          color: #FF6347;
        }
        .quality h3 {
          color: #4682B4;
        }
        .ux h3 {
          color: #20B2AA;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 14px;
          color: #666;
        }
        .cta {
          background-color: #4B0082;
          color: white;
          padding: 15px 20px;
          text-align: center;
          border-radius: 8px;
          margin: 30px 0;
        }
        .cta a {
          color: white;
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">StarWeb</div>
        <div class="tagline">Product of Stellar</div>
        <h1>Website Analysis Report</h1>
        <h2>${analysis.mainPage.title}</h2>
        <p>Generated on ${generatedDate} at ${generatedTime}</p>
      </div>
      
      <div class="summary">
        <h2>Executive Summary</h2>
        <div class="stats">
          <div class="stat-box">
            <div class="stat-number">${totalIssues}</div>
            <div class="stat-label">Total Issues Found</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${analysis.mainPage.analysis.assets.performanceIssues.length}</div>
            <div class="stat-label">Performance Issues</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${analysis.mainPage.analysis.assets.accessibilityIssues.length}</div>
            <div class="stat-label">Accessibility Issues</div>
          </div>
        </div>
        <p>This report provides a comprehensive analysis of <strong>${analysis.mainPage.title}</strong>. Our analysis has identified several areas for improvement that could enhance user experience, performance, and search engine visibility.</p>
        <p>Review the detailed findings below and implement the recommended solutions to improve your website's overall quality and effectiveness.</p>
      </div>
      
      <div class="section">
        <h2>Visual Analysis</h2>
        
        <div class="exit-points">
          <h3>Exit Points</h3>
          <ul>
            ${analysis.mainPage.analysis.visual.exitPoints.map(point => 
              `<li>${point}</li>`
            ).join('')}
          </ul>
        </div>
        
        <div class="design-issues">
          <h3>Design Issues</h3>
          <ul>
            ${analysis.mainPage.analysis.visual.designIssues.map(issue => 
              `<li>${issue}</li>`
            ).join('')}
          </ul>
        </div>
        
        <div class="recommendations">
          <h3>Recommendations</h3>
          <ul>
            ${analysis.mainPage.analysis.visual.recommendations.map(rec => 
              `<li>${rec}</li>`
            ).join('')}
          </ul>
        </div>
      </div>
      
      <div class="section">
        <h2>Assets Analysis</h2>
        
        <div class="performance">
          <h3>Performance Issues</h3>
          <ul>
            ${analysis.mainPage.analysis.assets.performanceIssues.map(issue => 
              `<li>${issue}</li>`
            ).join('')}
          </ul>
        </div>
        
        <div class="accessibility">
          <h3>Accessibility Issues</h3>
          <ul>
            ${analysis.mainPage.analysis.assets.accessibilityIssues.map(issue => 
              `<li>${issue}</li>`
            ).join('')}
          </ul>
        </div>
        
        <div class="seo">
          <h3>SEO Issues</h3>
          <ul>
            ${analysis.mainPage.analysis.assets.seoIssues.map(issue => 
              `<li>${issue}</li>`
            ).join('')}
          </ul>
        </div>
        
        <div class="best-practices">
          <h3>Best Practices</h3>
          <ul>
            ${analysis.mainPage.analysis.assets.bestPractices.map(practice => 
              `<li>${practice}</li>`
            ).join('')}
          </ul>
        </div>
        
        <div class="recommendations">
          <h3>Recommendations</h3>
          <ul>
            ${analysis.mainPage.analysis.assets.recommendations.map(rec => 
              `<li>${rec}</li>`
            ).join('')}
          </ul>
        </div>
      </div>
      
      <div class="section">
        <h2>Content Analysis</h2>
        
        <div class="structure">
          <h3>Structure Issues</h3>
          <ul>
            ${analysis.mainPage.analysis.content.structureIssues.map(issue => 
              `<li>${issue}</li>`
            ).join('')}
          </ul>
        </div>
        
        <div class="quality">
          <h3>Quality Issues</h3>
          <ul>
            ${analysis.mainPage.analysis.content.qualityIssues.map(issue => 
              `<li>${issue}</li>`
            ).join('')}
          </ul>
        </div>
        
        <div class="seo">
          <h3>SEO Issues</h3>
          <ul>
            ${analysis.mainPage.analysis.content.seoIssues.map(issue => 
              `<li>${issue}</li>`
            ).join('')}
          </ul>
        </div>
        
        <div class="ux">
          <h3>UX Issues</h3>
          <ul>
            ${analysis.mainPage.analysis.content.uxIssues.map(issue => 
              `<li>${issue}</li>`
            ).join('')}
          </ul>
        </div>
        
        <div class="recommendations">
          <h3>Recommendations</h3>
          <ul>
            ${analysis.mainPage.analysis.content.recommendations.map(rec => 
              `<li>${rec}</li>`
            ).join('')}
          </ul>
        </div>
      </div>
      
      <div class="cta">
        <p>Want a more detailed analysis? <a href="https://starweb.app">Visit StarWeb</a> for comprehensive website analysis tools.</p>
      </div>
      
      <div class="footer">
        <p>StarWeb - Product of Stellar Branding</p>
        <p>Comprehensive Website Analysis Tool</p>
      </div>
    </body>
    </html>
  `;
}; 