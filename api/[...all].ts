// Vercel API route handler - catches all API routes and serves them through Express
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../server/index';

export default async function(req: VercelRequest, res: VercelResponse) {
  try {
    // Debug logging for Vercel
    console.log('Vercel API Handler - URL:', req.url);
    console.log('Vercel API Handler - Method:', req.method);
    console.log('Vercel API Handler - Query:', req.query);
    
    // Extract the API path from Vercel's catch-all routing
    const catchAllPath = req.query?.all;
    if (Array.isArray(catchAllPath)) {
      // Reconstruct the original API path
      req.url = `/api/${catchAllPath.join('/')}`;
    } else if (typeof catchAllPath === 'string') {
      req.url = `/api/${catchAllPath}`;
    }
    
    console.log('Vercel API Handler - Processed URL:', req.url);
    
    return await handler(req, res);
  } catch (error) {
    console.error('Vercel API Handler Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}