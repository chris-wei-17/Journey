import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hashPassword, generateToken } from '../server/auth';
import { storage } from '../server/storage';
import { registerSchema } from '../shared/schema';
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
    console.log('=== REGISTER API ROUTE ===');
    console.log('Method:', req.method);
    console.log('Body:', JSON.stringify(req.body, null, 2));

    const result = registerSchema.safeParse(req.body);
    
    if (!result.success) {
      console.log('Validation failed:', result.error.errors);
      return res.status(400).json({ 
        message: "Invalid registration data",
        errors: result.error.errors 
      });
    }

    const { username, email, password, firstName, lastName } = result.data;
    console.log('Registration attempt for username:', username, 'email:', email);

    // Check if user already exists
    const existingUser = await storage.getUserByUsernameOrEmail(username);
    if (existingUser) {
      return res.status(409).json({ message: "Username or email already exists" });
    }

    const existingEmail = await storage.getUserByUsernameOrEmail(email);
    if (existingEmail) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await storage.createUser({
      username,
      email,
      passwordHash,
      firstName,
      lastName,
      isEmailVerified: false,
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: "User created successfully",
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
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
}