export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok', 
    environment: 'vercel',
    timestamp: new Date().toISOString() 
  });
} 