import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, handleOptions } from './_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, 'GET, POST, OPTIONS');

  // Handle preflight requests
  if (handleOptions(req, res)) return;

  // Allow both GET and POST for testing
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  res.json({
    message: 'API test successful',
    method: req.method,
    url: req.url,
    body: req.body,
    timestamp: new Date().toISOString(),
    vercel: !!process.env.VERCEL
  });
}