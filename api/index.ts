// Main Vercel API handler - handles all API routes
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../server/index';

export default async function(req: VercelRequest, res: VercelResponse) {
  try {
    // Log for debugging
    console.log('Vercel API - Original URL:', req.url);
    console.log('Vercel API - Method:', req.method);
    console.log('Vercel API - Headers:', req.headers);
    
    // The Vercel rewrite already prefixes with /api, so we need to handle it properly
    // If URL doesn't start with /api, prepend it
    if (req.url && !req.url.startsWith('/api')) {
      req.url = `/api${req.url}`;
    }
    
    console.log('Vercel API - Final URL:', req.url);
    
    // Set CORS headers for all API requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    return await handler(req, res);
  } catch (error) {
    console.error('Vercel API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}