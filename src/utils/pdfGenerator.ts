import html2pdf from 'html2pdf.js';
import { FullAnalysis } from '../types/index';

/**
 * Generates a PDF report from the analysis data
 * @param analysis The full analysis data
 * @param filename The name of the PDF file to download
 */
export const generateAnalysisPDF = (analysis: FullAnalysis, filename = 'starweb-analysis-report.pdf'): void => {
  // Create a container for the PDF content
  const reportContainer = document.createElement('div');
  reportContainer.className = 'pdf-report';
  reportContainer.style.padding = '20px';
  reportContainer.style.fontFamily = 'Arial, sans-serif';
  reportContainer.style.color = '#333';
  reportContainer.style.backgroundColor = '#FAFAFA';
  
  // Add report header with StarWeb branding
  const header = document.createElement('div');
  header.style.marginBottom = '30px';
  header.style.padding = '20px';
  header.style.backgroundColor = '#030014';
  header.style.borderRadius = '10px';
  header.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  header.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
      <img src="/favicon.svg" alt="StarWeb Logo" style="height: 60px;" />
      <div style="text-align: right; color: #FFFFFF;">
        <div style="font-size: 12px; opacity: 0.8;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
      </div>
    </div>
    <h1 style="color: #FFFFFF; text-align: center; margin-bottom: 10px; font-size: 28px;">Website Analysis Report</h1>
    <h2 style="color: #9E00FF; text-align: center; margin-bottom: 10px; font-size: 20px;">${analysis.mainPage.url}</h2>
  `;
  reportContainer.appendChild(header);
  
  // Add executive summary section
  const summarySection = document.createElement('div');
  summarySection.style.marginBottom = '30px';
  summarySection.style.padding = '20px';
  summarySection.style.backgroundColor = '#FFFFFF';
  summarySection.style.borderRadius = '10px';
  summarySection.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
  
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
  
  summarySection.innerHTML = `
    <h2 style="color: #4B0082; margin-bottom: 15px; font-size: 22px;">Executive Summary</h2>
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <div style="text-align: center; padding: 15px; background-color: #F0F0F0; border-radius: 8px; width: 30%;">
        <div style="font-size: 24px; font-weight: bold; color: #4B0082;">${totalIssues}</div>
        <div style="font-size: 14px; color: #666;">Total Issues Found</div>
      </div>
      <div style="text-align: center; padding: 15px; background-color: #F0F0F0; border-radius: 8px; width: 30%;">
        <div style="font-size: 24px; font-weight: bold; color: #FF6347;">${analysis.mainPage.analysis.assets.performanceIssues.length}</div>
        <div style="font-size: 14px; color: #666;">Performance Issues</div>
      </div>
      <div style="text-align: center; padding: 15px; background-color: #F0F0F0; border-radius: 8px; width: 30%;">
        <div style="font-size: 24px; font-weight: bold; color: #4682B4;">${analysis.mainPage.analysis.assets.accessibilityIssues.length}</div>
        <div style="font-size: 14px; color: #666;">Accessibility Issues</div>
      </div>
    </div>
    <p style="margin-bottom: 10px; line-height: 1.5;">This report provides a comprehensive analysis of <strong>${analysis.mainPage.title}</strong>. Our analysis has identified several areas for improvement that could enhance user experience, performance, and search engine visibility.</p>
    <p style="line-height: 1.5;">Review the detailed findings below and implement the recommended solutions to improve your website's overall quality and effectiveness.</p>
  `;
  reportContainer.appendChild(summarySection);
  
  // Add screenshot section
  const screenshotSection = document.createElement('div');
  screenshotSection.style.marginBottom = '30px';
  screenshotSection.style.padding = '20px';
  screenshotSection.style.backgroundColor = '#FFFFFF';
  screenshotSection.style.borderRadius = '10px';
  screenshotSection.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
  screenshotSection.innerHTML = `
    <h2 style="color: #4B0082; margin-bottom: 15px; font-size: 22px;">Website Screenshot</h2>
    <div style="text-align: center; margin-bottom: 10px;">
      <img 
        src="data:image/png;base64,${analysis.mainPage.screenshot}" 
        alt="Screenshot of ${analysis.mainPage.title}" 
        style="max-width: 100%; border: 1px solid #ddd; border-radius: 5px;"
      />
    </div>
    <p style="font-size: 12px; color: #666; text-align: center;">Full page screenshot of ${analysis.mainPage.url}</p>
  `;
  reportContainer.appendChild(screenshotSection);
  
  // Add visual analysis section
  const visualSection = document.createElement('div');
  visualSection.style.marginBottom = '30px';
  visualSection.style.padding = '20px';
  visualSection.style.backgroundColor = '#FFFFFF';
  visualSection.style.borderRadius = '10px';
  visualSection.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
  visualSection.innerHTML = `
    <h2 style="color: #4B0082; margin-bottom: 15px; font-size: 22px;">Visual Analysis</h2>
    
    <div style="margin-bottom: 20px; padding: 15px; background-color: #FFF0F0; border-left: 4px solid #FF0000; border-radius: 4px;">
      <h3 style="color: #FF0000; margin-bottom: 10px; font-size: 18px;">Exit Points</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        ${analysis.mainPage.analysis.visual.exitPoints.map((point: string) => 
          `<li style="margin-bottom: 8px; line-height: 1.5;">${point}</li>`
        ).join('')}
      </ul>
    </div>
    
    <div style="margin-bottom: 20px; padding: 15px; background-color: #FFF8F0; border-left: 4px solid #FFA500; border-radius: 4px;">
      <h3 style="color: #FFA500; margin-bottom: 10px; font-size: 18px;">Design Issues</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        ${analysis.mainPage.analysis.visual.designIssues.map((issue: string) => 
          `<li style="margin-bottom: 8px; line-height: 1.5;">${issue}</li>`
        ).join('')}
      </ul>
    </div>
    
    <div style="margin-bottom: 20px; padding: 15px; background-color: #F0FFF0; border-left: 4px solid #008000; border-radius: 4px;">
      <h3 style="color: #008000; margin-bottom: 10px; font-size: 18px;">Recommendations</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        ${analysis.mainPage.analysis.visual.recommendations.map((rec: string) => 
          `<li style="margin-bottom: 8px; line-height: 1.5;">${rec}</li>`
        ).join('')}
      </ul>
    </div>
    
    ${analysis.mainPage.analysis.visual.userNeeds && analysis.mainPage.analysis.visual.userNeeds.length > 0 ? `
    <div style="margin-bottom: 0; padding: 15px; background-color: #F8F0FF; border-left: 4px solid #800080; border-radius: 4px;">
      <h3 style="color: #800080; margin-bottom: 10px; font-size: 18px;">User's Needs</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        ${analysis.mainPage.analysis.visual.userNeeds.map((need: string) => 
          `<li style="margin-bottom: 8px; line-height: 1.5;">${need}</li>`
        ).join('')}
      </ul>
    </div>
    ` : ''}
  `;
  reportContainer.appendChild(visualSection);
  
  // Add assets analysis section
  const assetsSection = document.createElement('div');
  assetsSection.style.marginBottom = '30px';
  assetsSection.style.padding = '20px';
  assetsSection.style.backgroundColor = '#FFFFFF';
  assetsSection.style.borderRadius = '10px';
  assetsSection.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
  assetsSection.innerHTML = `
    <h2 style="color: #4B0082; margin-bottom: 15px; font-size: 22px;">Assets Analysis</h2>
    
    <div style="margin-bottom: 20px; padding: 15px; background-color: #FFF0F0; border-left: 4px solid #FF6347; border-radius: 4px;">
      <h3 style="color: #FF6347; margin-bottom: 10px; font-size: 18px;">Performance Issues</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        ${analysis.mainPage.analysis.assets.performanceIssues.map((issue: string) => 
          `<li style="margin-bottom: 8px; line-height: 1.5;">${issue}</li>`
        ).join('')}
      </ul>
    </div>
    
    <div style="margin-bottom: 20px; padding: 15px; background-color: #F0F8FF; border-left: 4px solid #4682B4; border-radius: 4px;">
      <h3 style="color: #4682B4; margin-bottom: 10px; font-size: 18px;">Accessibility Issues</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        ${analysis.mainPage.analysis.assets.accessibilityIssues.map((issue: string) => 
          `<li style="margin-bottom: 8px; line-height: 1.5;">${issue}</li>`
        ).join('')}
      </ul>
    </div>
    
    <div style="margin-bottom: 20px; padding: 15px; background-color: #F8F0FF; border-left: 4px solid #9370DB; border-radius: 4px;">
      <h3 style="color: #9370DB; margin-bottom: 10px; font-size: 18px;">SEO Issues</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        ${analysis.mainPage.analysis.assets.seoIssues.map((issue: string) => 
          `<li style="margin-bottom: 8px; line-height: 1.5;">${issue}</li>`
        ).join('')}
      </ul>
    </div>
    
    <div style="margin-bottom: 20px; padding: 15px; background-color: #F0FFFF; border-left: 4px solid #20B2AA; border-radius: 4px;">
      <h3 style="color: #20B2AA; margin-bottom: 10px; font-size: 18px;">Best Practices</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        ${analysis.mainPage.analysis.assets.bestPractices.map((practice: string) => 
          `<li style="margin-bottom: 8px; line-height: 1.5;">${practice}</li>`
        ).join('')}
      </ul>
    </div>
    
    <div style="margin-bottom: ${analysis.mainPage.analysis.assets.userNeeds && analysis.mainPage.analysis.assets.userNeeds.length > 0 ? '20px' : '0'}; padding: 15px; background-color: #F0FFF0; border-left: 4px solid #008000; border-radius: 4px;">
      <h3 style="color: #008000; margin-bottom: 10px; font-size: 18px;">Recommendations</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        ${analysis.mainPage.analysis.assets.recommendations.map((rec: string) => 
          `<li style="margin-bottom: 8px; line-height: 1.5;">${rec}</li>`
        ).join('')}
      </ul>
    </div>
    
    ${analysis.mainPage.analysis.assets.userNeeds && analysis.mainPage.analysis.assets.userNeeds.length > 0 ? `
    <div style="margin-bottom: 0; padding: 15px; background-color: #F8F0FF; border-left: 4px solid #800080; border-radius: 4px;">
      <h3 style="color: #800080; margin-bottom: 10px; font-size: 18px;">User's Needs</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        ${analysis.mainPage.analysis.assets.userNeeds.map((need: string) => 
          `<li style="margin-bottom: 8px; line-height: 1.5;">${need}</li>`
        ).join('')}
      </ul>
    </div>
    ` : ''}
  `;
  reportContainer.appendChild(assetsSection);
  
  // Add content analysis section
  const contentSection = document.createElement('div');
  contentSection.style.marginBottom = '30px';
  contentSection.style.padding = '20px';
  contentSection.style.backgroundColor = '#FFFFFF';
  contentSection.style.borderRadius = '10px';
  contentSection.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
  contentSection.innerHTML = `
    <h2 style="color: #4B0082; margin-bottom: 15px; font-size: 22px;">Content Analysis</h2>
    
    <div style="margin-bottom: 20px; padding: 15px; background-color: #FFF0F0; border-left: 4px solid #FF6347; border-radius: 4px;">
      <h3 style="color: #FF6347; margin-bottom: 10px; font-size: 18px;">Structure Issues</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        ${analysis.mainPage.analysis.content.structureIssues.map((issue: string) => 
          `<li style="margin-bottom: 8px; line-height: 1.5;">${issue}</li>`
        ).join('')}
      </ul>
    </div>
    
    <div style="margin-bottom: 20px; padding: 15px; background-color: #F0F8FF; border-left: 4px solid #4682B4; border-radius: 4px;">
      <h3 style="color: #4682B4; margin-bottom: 10px; font-size: 18px;">Quality Issues</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        ${analysis.mainPage.analysis.content.qualityIssues.map((issue: string) => 
          `<li style="margin-bottom: 8px; line-height: 1.5;">${issue}</li>`
        ).join('')}
      </ul>
    </div>
    
    <div style="margin-bottom: 20px; padding: 15px; background-color: #F8F0FF; border-left: 4px solid #9370DB; border-radius: 4px;">
      <h3 style="color: #9370DB; margin-bottom: 10px; font-size: 18px;">SEO Issues</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        ${analysis.mainPage.analysis.content.seoIssues.map((issue: string) => 
          `<li style="margin-bottom: 8px; line-height: 1.5;">${issue}</li>`
        ).join('')}
      </ul>
    </div>
    
    <div style="margin-bottom: 20px; padding: 15px; background-color: #F0FFFF; border-left: 4px solid #20B2AA; border-radius: 4px;">
      <h3 style="color: #20B2AA; margin-bottom: 10px; font-size: 18px;">UX Issues</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        ${analysis.mainPage.analysis.content.uxIssues.map((issue: string) => 
          `<li style="margin-bottom: 8px; line-height: 1.5;">${issue}</li>`
        ).join('')}
      </ul>
    </div>
    
    <div style="margin-bottom: ${analysis.mainPage.analysis.content.userNeeds && analysis.mainPage.analysis.content.userNeeds.length > 0 ? '20px' : '0'}; padding: 15px; background-color: #F0FFF0; border-left: 4px solid #008000; border-radius: 4px;">
      <h3 style="color: #008000; margin-bottom: 10px; font-size: 18px;">Recommendations</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        ${analysis.mainPage.analysis.content.recommendations.map((rec: string) => 
          `<li style="margin-bottom: 8px; line-height: 1.5;">${rec}</li>`
        ).join('')}
      </ul>
    </div>
    
    ${analysis.mainPage.analysis.content.userNeeds && analysis.mainPage.analysis.content.userNeeds.length > 0 ? `
    <div style="margin-bottom: 0; padding: 15px; background-color: #F8F0FF; border-left: 4px solid #800080; border-radius: 4px;">
      <h3 style="color: #800080; margin-bottom: 10px; font-size: 18px;">User's Needs</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        ${analysis.mainPage.analysis.content.userNeeds.map((need: string) => 
          `<li style="margin-bottom: 8px; line-height: 1.5;">${need}</li>`
        ).join('')}
      </ul>
    </div>
    ` : ''}
  `;
  reportContainer.appendChild(contentSection);
  
  // Add footer with StarWeb branding
  const footer = document.createElement('div');
  footer.style.padding = '20px';
  footer.style.backgroundColor = '#030014';
  footer.style.borderRadius = '10px';
  footer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  footer.style.textAlign = 'center';
  footer.innerHTML = `
    <div style="margin-bottom: 10px;">
      <img src="/favicon.svg" alt="StarWeb Logo" style="height: 40px;" />
    </div>
    <p style="color: #FFFFFF; margin-bottom: 5px; font-size: 14px;">
      StarWeb - Product of Stellar
    </p>
    <p style="color: #9E00FF; font-size: 12px;">
      Comprehensive Website Analysis Tool
    </p>
  `;
  reportContainer.appendChild(footer);
  
  // Temporarily append to document to render (will be removed after PDF generation)
  document.body.appendChild(reportContainer);
  
  // Configure PDF options
  const options = {
    margin: [10, 10] as [number, number],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
  };
  
  // Generate and download PDF
  html2pdf().from(reportContainer).set(options).save().then(() => {
    // Remove the temporary container after PDF generation
    document.body.removeChild(reportContainer);
  });
}; 