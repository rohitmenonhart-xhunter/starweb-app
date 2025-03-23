import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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