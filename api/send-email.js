import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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