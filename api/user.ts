import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';
import { authenticate, setCorsHeaders, handleOptions } from './_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, 'GET, OPTIONS');

  // Handle preflight requests
  if (handleOptions(req, res)) return;

  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('=== USER API ROUTE ===');

    // Authenticate user
    const authResult = authenticate(req);
    if (!authResult.success) {
      return res.status(authResult.error.status).json({ message: authResult.error.message });
    }

    const userId = authResult.userId;
    console.log('Getting user info for userId:', userId);

    // Get user data
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get profile data
    const profile = await storage.getUserProfile(userId);
    const goals = await storage.getUserGoals(userId);
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      profile,
      goals: goals.map(g => g.goalType),
      onboardingCompleted: profile?.onboardingCompleted || false,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
}