import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Header, Footer, Table, TableRow, TableCell, WidthType, ShadingType, VerticalAlign, TableLayoutType } from 'docx';
import { saveAs } from 'file-saver';
import { FullAnalysis } from '../types/index';

/**
 * Generates a Word document report from the analysis data
 * @param analysis The full analysis data
 * @param filename The name of the Word file to download
 */
export const generateAnalysisWord = async (analysis: FullAnalysis, filename = 'starweb-analysis-report.docx'): Promise<void> => {
  // Create a new document with headers and footers
  const doc = new Document({
    title: `StarWeb Analysis Report - ${analysis.mainPage.url}`,
    description: 'Website analysis report generated by StarWeb',
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: {
            size: 24,
            font: 'Calibri',
          },
          paragraph: {
            spacing: { line: 360 },
          },
        },
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            size: 36,
            bold: true,
            color: '#4B0082',
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
          },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            size: 30,
            bold: true,
            color: '#800080',
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
          },
        },
        {
          id: 'ListParagraph',
          name: 'List Paragraph',
          basedOn: 'Normal',
          run: {
            size: 24,
          },
          paragraph: {
            spacing: { before: 120, after: 120 },
          },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: "StarWeb Analysis Report",
                  bold: true,
                  color: "#4B0082",
                  size: 24,
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "StarWeb - Product of Stellar Branding",
                  color: "#800080",
                  size: 20,
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Page ",
                  size: 20,
                }),
                new TextRun({
                  text: "X",
                  size: 20,
                }),
                new TextRun({
                  text: " of ",
                  size: 20,
                }),
                new TextRun({
                  text: "Y",
                  size: 20,
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        // Title Page
        new Paragraph({
          text: "Website Analysis Report",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          style: "Heading1",
        }),
        
        // Website URL
        new Paragraph({
          text: analysis.mainPage.url,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          style: "Heading2",
        }),
        
        // Date
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
              size: 24,
              color: "#666666",
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),
        
        // Executive Summary
        new Paragraph({
          text: "Executive Summary",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          pageBreakBefore: true,
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: `This report provides a comprehensive analysis of the website at ${analysis.mainPage.url}. Our analysis has identified several areas for improvement that could enhance user experience, performance, and search engine visibility.`,
              size: 24,
            })
          ],
          spacing: { before: 200, after: 200 }
        }),
        
        // Summary Table
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ 
                    children: [
                      new TextRun({
                        text: "Total Issues",
                        bold: true,
                      })
                    ],
                    alignment: AlignmentType.CENTER 
                  })],
                  verticalAlign: VerticalAlign.CENTER,
                  shading: {
                    fill: "#F0F0F0",
                    type: ShadingType.CLEAR,
                  },
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [
                      new TextRun({
                        text: "Performance Issues",
                        bold: true,
                      })
                    ],
                    alignment: AlignmentType.CENTER 
                  })],
                  verticalAlign: VerticalAlign.CENTER,
                  shading: {
                    fill: "#F0F0F0",
                    type: ShadingType.CLEAR,
                  },
                }),
                new TableCell({
                  children: [new Paragraph({ 
                    children: [
                      new TextRun({
                        text: "Accessibility Issues",
                        bold: true,
                      })
                    ],
                    alignment: AlignmentType.CENTER 
                  })],
                  verticalAlign: VerticalAlign.CENTER,
                  shading: {
                    fill: "#F0F0F0",
                    type: ShadingType.CLEAR,
                  },
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: (
                            analysis.mainPage.analysis.visual.exitPoints.length +
                            analysis.mainPage.analysis.visual.designIssues.length +
                            analysis.mainPage.analysis.assets.performanceIssues.length +
                            analysis.mainPage.analysis.assets.accessibilityIssues.length +
                            analysis.mainPage.analysis.assets.seoIssues.length +
                            analysis.mainPage.analysis.content.structureIssues.length +
                            analysis.mainPage.analysis.content.qualityIssues.length +
                            analysis.mainPage.analysis.content.seoIssues.length +
                            analysis.mainPage.analysis.content.uxIssues.length
                          ).toString(),
                        })
                      ],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: analysis.mainPage.analysis.assets.performanceIssues.length.toString(),
                        })
                      ],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: analysis.mainPage.analysis.assets.accessibilityIssues.length.toString(),
                        })
                      ],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  verticalAlign: VerticalAlign.CENTER,
                }),
              ],
            }),
          ],
        }),
        
        new Paragraph({
          text: "",
          spacing: { after: 200 },
        }),
        
        // Visual Analysis Section
        new Paragraph({
          text: "Visual Analysis",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          pageBreakBefore: true,
        }),
        
        // Exit Points
        new Paragraph({
          text: "Exit Points",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        
        ...analysis.mainPage.analysis.visual.exitPoints.map(point => 
          new Paragraph({
            text: `• ${point}`,
            spacing: { before: 80, after: 80 },
            style: "ListParagraph",
          })
        ),
        
        // Design Issues
        new Paragraph({
          text: "Design Issues",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        
        ...analysis.mainPage.analysis.visual.designIssues.map(issue => 
          new Paragraph({
            text: `• ${issue}`,
            spacing: { before: 80, after: 80 },
            style: "ListParagraph",
          })
        ),
        
        // Recommendations
        new Paragraph({
          text: "Recommendations",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        
        ...analysis.mainPage.analysis.visual.recommendations.map(rec => 
          new Paragraph({
            text: `• ${rec}`,
            spacing: { before: 80, after: 80 },
            style: "ListParagraph",
          })
        ),
        
        // User Needs (if available)
        ...(analysis.mainPage.analysis.visual.userNeeds && analysis.mainPage.analysis.visual.userNeeds.length > 0 ? [
          new Paragraph({
            text: "User's Needs",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          
          ...analysis.mainPage.analysis.visual.userNeeds.map(need => 
            new Paragraph({
              text: `• ${need}`,
              spacing: { before: 80, after: 80 },
              style: "ListParagraph",
            })
          )
        ] : []),
        
        // Assets Analysis Section
        new Paragraph({
          text: "Assets Analysis",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          pageBreakBefore: true,
        }),
        
        // Performance Issues
        new Paragraph({
          text: "Performance Issues",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        
        ...analysis.mainPage.analysis.assets.performanceIssues.map(issue => 
          new Paragraph({
            text: `• ${issue}`,
            spacing: { before: 80, after: 80 },
            style: "ListParagraph",
          })
        ),
        
        // Accessibility Issues
        new Paragraph({
          text: "Accessibility Issues",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        
        ...analysis.mainPage.analysis.assets.accessibilityIssues.map(issue => 
          new Paragraph({
            text: `• ${issue}`,
            spacing: { before: 80, after: 80 },
            style: "ListParagraph",
          })
        ),
        
        // SEO Issues
        new Paragraph({
          text: "SEO Issues",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        
        ...analysis.mainPage.analysis.assets.seoIssues.map(issue => 
          new Paragraph({
            text: `• ${issue}`,
            spacing: { before: 80, after: 80 },
            style: "ListParagraph",
          })
        ),
        
        // Best Practices
        new Paragraph({
          text: "Best Practices",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        
        ...analysis.mainPage.analysis.assets.bestPractices.map(practice => 
          new Paragraph({
            text: `• ${practice}`,
            spacing: { before: 80, after: 80 },
            style: "ListParagraph",
          })
        ),
        
        // Recommendations
        new Paragraph({
          text: "Recommendations",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        
        ...analysis.mainPage.analysis.assets.recommendations.map(rec => 
          new Paragraph({
            text: `• ${rec}`,
            spacing: { before: 80, after: 80 },
            style: "ListParagraph",
          })
        ),
        
        // User Needs (if available)
        ...(analysis.mainPage.analysis.assets.userNeeds && analysis.mainPage.analysis.assets.userNeeds.length > 0 ? [
          new Paragraph({
            text: "User's Needs",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          
          ...analysis.mainPage.analysis.assets.userNeeds.map(need => 
            new Paragraph({
              text: `• ${need}`,
              spacing: { before: 80, after: 80 },
              style: "ListParagraph",
            })
          )
        ] : []),
        
        // Content Analysis Section
        new Paragraph({
          text: "Content Analysis",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          pageBreakBefore: true,
        }),
        
        // Structure Issues
        new Paragraph({
          text: "Structure Issues",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        
        ...analysis.mainPage.analysis.content.structureIssues.map(issue => 
          new Paragraph({
            text: `• ${issue}`,
            spacing: { before: 80, after: 80 },
            style: "ListParagraph",
          })
        ),
        
        // Quality Issues
        new Paragraph({
          text: "Quality Issues",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        
        ...analysis.mainPage.analysis.content.qualityIssues.map(issue => 
          new Paragraph({
            text: `• ${issue}`,
            spacing: { before: 80, after: 80 },
            style: "ListParagraph",
          })
        ),
        
        // SEO Issues
        new Paragraph({
          text: "SEO Issues",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        
        ...analysis.mainPage.analysis.content.seoIssues.map(issue => 
          new Paragraph({
            text: `• ${issue}`,
            spacing: { before: 80, after: 80 },
            style: "ListParagraph",
          })
        ),
        
        // UX Issues
        new Paragraph({
          text: "UX Issues",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        
        ...analysis.mainPage.analysis.content.uxIssues.map(issue => 
          new Paragraph({
            text: `• ${issue}`,
            spacing: { before: 80, after: 80 },
            style: "ListParagraph",
          })
        ),
        
        // Recommendations
        new Paragraph({
          text: "Recommendations",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        
        ...analysis.mainPage.analysis.content.recommendations.map(rec => 
          new Paragraph({
            text: `• ${rec}`,
            spacing: { before: 80, after: 80 },
            style: "ListParagraph",
          })
        ),
        
        // User Needs (if available)
        ...(analysis.mainPage.analysis.content.userNeeds && analysis.mainPage.analysis.content.userNeeds.length > 0 ? [
          new Paragraph({
            text: "User's Needs",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          
          ...analysis.mainPage.analysis.content.userNeeds.map(need => 
            new Paragraph({
              text: `• ${need}`,
              spacing: { before: 80, after: 80 },
              style: "ListParagraph",
            })
          )
        ] : []),
        
        // Conclusion
        new Paragraph({
          text: "Conclusion",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          pageBreakBefore: true,
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: "This analysis has identified several areas where improvements can be made to enhance the website's performance, accessibility, and user experience. By addressing these issues, you can create a more effective online presence that better serves your visitors and achieves your business goals.",
              size: 24,
            })
          ],
          spacing: { before: 200, after: 200 }
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: "For further assistance or to implement these recommendations, please contact the StarWeb team.",
              size: 24,
              bold: true,
              color: "#4B0082",
            })
          ],
          spacing: { before: 200, after: 400 },
          alignment: AlignmentType.CENTER,
        }),
        
        // Branding Footer
        new Paragraph({
          children: [
            new TextRun({
              text: "StarWeb - Product of Stellar Branding",
              color: "#800080",
              size: 24,
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          border: {
            top: { color: "#9E00FF", style: BorderStyle.SINGLE, size: 1 }
          }
        }),
      ]
    }]
  });

  // Generate and save the document
  const buffer = await Packer.toBuffer(doc);
  saveAs(new Blob([buffer]), filename);
}; 