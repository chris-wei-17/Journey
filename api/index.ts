// Main Vercel API handler - handles all API routes
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../server/index.js';

export default async function(req: VercelRequest, res: VercelResponse) {
  try {
    // Log for debugging
    console.log('=== Vercel API Handler ===');
    console.log('Original URL:', req.url);
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', req.body);
    
    // Set CORS headers for all API requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request');
      return res.status(200).end();
    }
    
    // Ensure URL starts with /api for proper routing
    if (req.url && !req.url.startsWith('/api')) {
      req.url = `/api${req.url}`;
    }
    
    console.log('Final URL:', req.url);
    console.log('Calling Express handler...');
    
    // Call the Express app handler with proper promise handling
    await handler(req, res);
    
    console.log('Express handler completed');
    
  } catch (error) {
    console.error('Vercel API Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Only send response if not already sent
    if (!res.headersSent) {
      return res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}