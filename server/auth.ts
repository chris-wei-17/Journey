import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

// JWT secret - use environment variable in production
export const JWT_SECRET = process.env.JWT_SECRET || "fitjourney-development-secret-key";

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface AuthenticatedRequest extends Request {
  userId?: number;
}

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (userId: number): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

// Generate short-lived photo access token
export const generatePhotoToken = (userId: number): string => {
  return jwt.sign({ userId, type: 'photo' }, JWT_SECRET, { expiresIn: '1h' });
};

// Verify photo access token and return user ID
export const verifyPhotoToken = (token: string): number | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type === 'photo' && decoded.userId) {
      return decoded.userId;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    (req as AuthenticatedRequest).userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const checkRateLimit = (identifier: string, maxRequests = 5): boolean => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

export const clearRateLimit = (identifier: string): void => {
  rateLimitStore.delete(identifier);
};