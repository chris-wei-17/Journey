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
    // Fetch user from Supabase
    const { data: user, error } = await supabase
      .from("users")
      .select("id, password")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password incorrect" });
    }

    const newHash = await hashPassword(newPassword);
    await supabase.from("users").update({ password: newHash }).eq("id", userId);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
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
  const { data: user, error } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (error || !user) return;

  const resetToken = generatePasswordResetToken(user.id);
  const resetLink = `https://yourdomain.com/reset-password?token=${resetToken}`;

  const subject = "Reset Your Password";
  const html = `<p>Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`;

  await sendEmailFn(email, subject, html);
};

/**
 * Handles reset using token (unauthenticated route)
 */
export const resetPasswordWithToken = async (
  req: Request,
  res: Response
) => {
  const { token, newPassword } = req.body;
  const userId = verifyPasswordResetToken(token);

  if (!userId) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  const newHash = await hashPassword(newPassword);

  const { error } = await supabase
    .from("users")
    .update({ password: newHash })
    .eq("id", userId);

  if (error) {
    return res.status(500).json({ message: "Error resetting password" });
  }

  res.json({ message: "Password has been reset successfully" });
};