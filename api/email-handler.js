import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default async function handler(req, res) {
  // Parse the endpoint from the path
  const { endpoint } = req.query;
  
  console.log(`Processing email handler request for endpoint: ${endpoint}`);
  
  switch (endpoint) {
    case 'send-email':
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      return handleSendEmail(req, res);
    case 'test-config':
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      return handleTestEmailConfig(req, res);
    case 'test-send':
      if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      return handleTestSend(req, res);
    default:
      return res.status(404).json({ error: 'Endpoint not found' });
  }
}

/**
 * Handler for sending emails
 */
async function handleSendEmail(req, res) {
  console.log('Email endpoint called with data:', req.body);
  
  try {
    const { to, subject, html, siteName, siteUrl } = req.body;
    
    // Validate email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error('Invalid email address:', to);
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }
    
    // Create a transporter
    console.log('Creating nodemailer transporter with config:', {
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 5) + '...' : undefined,
        pass: process.env.EMAIL_PASS ? '********' : undefined
      }
    });
    
    // Check if email credentials are available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email credentials are missing in environment variables');
      return res.status(500).json({ 
        success: false, 
        message: 'Email configuration is incomplete', 
        error: 'Missing email credentials' 
      });
    }
    
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Email options
    console.log('Setting up email options');
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
      attachments: []
    };
    
    // Send the email
    console.log('Sending email');
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully with info:', info);
      
      res.json({ 
        success: true, 
        message: `Analysis report for ${siteName} has been sent to ${to}` 
      });
    } catch (emailError) {
      console.error('Error in transporter.sendMail:', emailError);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send email', 
        error: emailError.message,
        stack: emailError.stack
      });
    }
  } catch (error) {
    console.error('Error in email endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email', 
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Handler for testing email configuration
 */
function handleTestEmailConfig(req, res) {
  console.log('Testing email configuration');
  
  const emailConfig = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER ? process.env.EMAIL_USER : 'Not configured',
    passConfigured: process.env.EMAIL_PASS ? true : false
  };
  
  console.log('Email configuration:', {
    service: emailConfig.service,
    user: emailConfig.user.substring(0, 5) + '...',
    passConfigured: emailConfig.passConfigured
  });
  
  res.status(200).json({
    success: true,
    config: {
      service: emailConfig.service,
      user: emailConfig.user.substring(0, 5) + '...',
      passConfigured: emailConfig.passConfigured
    }
  });
}

/**
 * Handler for testing email sending
 */
async function handleTestSend(req, res) {
  console.log('Test email sending endpoint called');
  
  try {
    // Create a test email recipient - either from query param or a default
    const to = req.query.email || req.body?.email || 'test@example.com';
    
    // Validate email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error('Invalid email address:', to);
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }
    
    // Check if email credentials are available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email credentials are missing in environment variables');
      return res.status(500).json({ 
        success: false, 
        message: 'Email configuration is incomplete', 
        error: 'Missing email credentials' 
      });
    }
    
    // Create a simple HTML test email
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4B0082; color: white; padding: 10px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>StarWeb Test Email</h1>
          </div>
          <div class="content">
            <p>This is a test email from the StarWeb application.</p>
            <p>If you're receiving this, it means the email functionality is working correctly!</p>
            <p>Server time: ${new Date().toISOString()}</p>
            <p>Environment: ${process.env.VERCEL ? 'Vercel' : 'Development'}</p>
          </div>
          <div class="footer">
            <p>StarWeb - Website Analysis Tool</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Create a transporter
    console.log('Creating nodemailer transporter for test email');
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'StarWeb Test Email',
      html,
      attachments: []
    };
    
    // Send the email
    console.log(`Sending test email to ${to}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully with info:', info);
    
    return res.status(200).json({ 
      success: true, 
      message: `Test email sent to ${to}`,
      emailInfo: {
        messageId: info.messageId,
        response: info.response
      }
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send test email', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 