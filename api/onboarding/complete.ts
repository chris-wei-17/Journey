import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';
import { onboardingSchema } from '../../shared/schema';
import { authenticate, setCorsHeaders, handleOptions } from '../_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, 'POST, OPTIONS');

  // Handle preflight requests
  if (handleOptions(req, res)) return;

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('=== ONBOARDING COMPLETE API ROUTE ===');

    // Authenticate user
    const authResult = authenticate(req);
    if (!authResult.success) {
      return res.status(authResult.error.status).json({ message: authResult.error.message });
    }

    const userId = authResult.userId;

    const result = onboardingSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: "Invalid onboarding data",
        errors: result.error.errors 
      });
    }

    const { gender, birthday, height, weight, bodyType, goals, progress } = result.data;

    // Create user profile
    const profile = await storage.createUserProfile({
      userId,
      gender,
      birthday: birthday || null,
      height,
      weight,
      bodyType,
      onboardingCompleted: true,
    });

    // Clear existing goals and create new ones
    await storage.deleteUserGoals(userId);
    for (const goalType of goals) {
      await storage.createUserGoal({
        userId,
        goalType,
        isActive: true,
      });
    }

    // Create initial progress entries
    for (const [goalType, progressValue] of Object.entries(progress)) {
      if (goals.includes(goalType)) {
        await storage.createProgressEntry({
          userId,
          goalType,
          progressValue: Number(progressValue),
        });
      }
    }

    res.json({ 
      message: "Onboarding completed successfully",
      profile,
    });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    res.status(500).json({ message: "Failed to complete onboarding" });
  }
}