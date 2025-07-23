import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "fitjourney-development-secret-key";

export interface AuthenticatedRequest extends VercelRequest {
  userId: number;
}

export function authenticate(req: VercelRequest): { success: false; error: { status: number; message: string } } | { success: true; userId: number } {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return { success: false, error: { status: 401, message: "Access token required" } };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return { success: true, userId: decoded.userId };
  } catch (error) {
    return { success: false, error: { status: 401, message: "Invalid or expired token" } };
  }
}

export function setCorsHeaders(res: VercelResponse, methods: string = 'GET, POST, PUT, DELETE, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
}

export function handleOptions(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}