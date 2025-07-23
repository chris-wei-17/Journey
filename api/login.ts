import type { VercelRequest, VercelResponse } from '@vercel/node';
import { comparePassword, generateToken, checkRateLimit, clearRateLimit } from '../server/auth';
import { storage } from '../server/storage';
import { loginSchema } from '../shared/schema';
import { setCorsHeaders, handleOptions } from './_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, 'POST, OPTIONS');

  // Handle preflight requests
  if (handleOptions(req, res)) return;

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('=== LOGIN API ROUTE ===');
    console.log('Method:', req.method);
    console.log('Body:', JSON.stringify(req.body, null, 2));

    const result = loginSchema.safeParse(req.body);
    
    if (!result.success) {
      console.log('Validation failed:', result.error.errors);
      return res.status(400).json({ 
        message: "Invalid login data",
        errors: result.error.errors 
      });
    }

    const { usernameOrEmail, password } = result.data;

    // Rate limiting
    if (!checkRateLimit(usernameOrEmail)) {
      return res.status(429).json({ 
        message: "Too many login attempts. Please try again later." 
      });
    }

    // Find user
    const user = await storage.getUserByUsernameOrEmail(usernameOrEmail);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Clear rate limit on successful login
    clearRateLimit(usernameOrEmail);

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
}