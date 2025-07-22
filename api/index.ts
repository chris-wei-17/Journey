// Main Vercel API handler - handles all API routes
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../server/index';

export default async function(req: VercelRequest, res: VercelResponse) {
  try {
    // Log for debugging
    console.log('Vercel API - URL:', req.url);
    console.log('Vercel API - Method:', req.method);
    
    // Ensure URL starts with /api
    if (!req.url?.startsWith('/api')) {
      req.url = `/api${req.url}`;
    }
    
    console.log('Vercel API - Final URL:', req.url);
    
    return await handler(req, res);
  } catch (error) {
    console.error('Vercel API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}