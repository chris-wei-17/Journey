import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage.js";

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

// Email sender type
export type EmailSender = (to: string, subject: string, html: string) => Promise<void>;

// Add at bottom of your current module

// Password Reset Token (1 hour expiry)
export const generatePasswordResetToken = (userId: number): string => {
  return jwt.sign({ userId, type: "reset" }, JWT_SECRET, { expiresIn: "1h" });
};

export const verifyPasswordResetToken = (token: string): number | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type === "reset" && decoded.userId) {
      return decoded.userId;
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Handles in-app password reset (authenticated route)
 */
export const resetPasswordWhileLoggedIn = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    // Fetch user from database
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password incorrect" });
    }

    const newHash = await hashPassword(newPassword);
    await storage.updateUser(userId, { passwordHash: newHash });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ message: "Error updating password" });
  }
};

/**
 * Sends email with reset token (forgot password)
 */
export const sendForgotPasswordEmail = async (
  email: string,
  sendEmailFn: EmailSender
) => {
  try {
    // Find user by email
    const user = await storage.getUserByUsernameOrEmail(email);

    if (!user) {
      // Don't reveal if email exists for security
      console.log(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    const resetToken = generatePasswordResetToken(user.id);
    
    // Use proper domain from environment or default
    const baseUrl = process.env.FRONTEND_URL || process.env.VERCEL_URL || 'http://localhost:5173';
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    const subject = "Reset Your Journey Password";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Reset Your Password</h2>
        <p>Hi ${user.firstName || 'there'},</p>
        <p>You requested to reset your password for your Journey fitness account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6366f1;">${resetLink}</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Journey Fitness App<br>
          This is an automated message, please do not reply.
        </p>
      </div>
    `;

    await sendEmailFn(email, subject, html);
    console.log(`✅ Password reset email sent to: ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Handles reset using token (unauthenticated route)
 */
export const resetPasswordWithToken = async (
  req: Request,
  res: Response
) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const userId = verifyPasswordResetToken(token);

  if (!userId) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  try {
    const newHash = await hashPassword(newPassword);
    await storage.updateUser(userId, { passwordHash: newHash });

    console.log(`✅ Password reset successfully for user ID: ${userId}`);
    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
};