import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  onboardingSchema,
  insertProgressEntrySchema,
  insertPhotoSchema,
  insertActivitySchema
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for photo uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5, // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Also get profile data
      const profile = await storage.getUserProfile(userId);
      const goals = await storage.getUserGoals(userId);
      
      res.json({
        ...user,
        profile,
        goals: goals.map(g => g.goalType),
        onboardingCompleted: profile?.onboardingCompleted || false,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Complete onboarding
  app.post('/api/onboarding/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
        birthday: birthday ? birthday : undefined,
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
  });

  // Get user profile
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId);
      const goals = await storage.getUserGoals(userId);
      
      res.json({
        profile,
        goals: goals.map(g => g.goalType),
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Update progress
  app.post('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = insertProgressEntrySchema.safeParse({
        ...req.body,
        userId,
      });
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid progress data",
          errors: result.error.errors 
        });
      }

      const entry = await storage.createProgressEntry(result.data);
      res.json(entry);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Get user progress
  app.get('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Get progress entries for a specific date
  app.get('/api/progress/date/:date', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = req.params.date;
      const entries = await storage.getProgressEntriesForDate(userId, date);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching progress entries for date:", error);
      res.status(500).json({ message: "Failed to fetch progress entries for date" });
    }
  });

  // Upload photos
  app.post('/api/photos', isAuthenticated, upload.array('photos', 5), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No photos uploaded" });
      }

      const savedPhotos = [];
      for (const file of files) {
        const photo = await storage.createPhoto({
          userId,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        });
        savedPhotos.push(photo);
      }

      res.json(savedPhotos);
    } catch (error) {
      console.error("Error uploading photos:", error);
      res.status(500).json({ message: "Failed to upload photos" });
    }
  });

  // Get user photos
  app.get('/api/photos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const photos = await storage.getUserPhotos(userId);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // Serve uploaded photos
  app.get('/api/photos/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "Photo not found" });
    }
  });

  // Delete photo
  app.delete('/api/photos/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const photoId = parseInt(req.params.id);
      
      await storage.deletePhoto(photoId, userId);
      res.json({ message: "Photo deleted successfully" });
    } catch (error) {
      console.error("Error deleting photo:", error);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  // Activity routes
  
  // Get activities for a specific date
  app.get('/api/activities/date/:date', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = req.params.date;
      const activities = await storage.getActivitiesForDate(userId, date);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities for date:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Create new activity
  app.post('/api/activities', isAuthenticated, async (req: any, res) => {
    console.log('=== ACTIVITY CREATION START ===');
    try {
      const userId = parseInt(req.user.claims.sub);
      console.log('Creating activity for user:', userId);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const activityData = {
        userId,
        activityType: req.body.activityType,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
        date: new Date(req.body.date),
      };
      
      console.log('Processed activity data:', JSON.stringify(activityData, null, 2));
      
      const result = insertActivitySchema.safeParse(activityData);
      
      if (!result.success) {
        console.log('Validation errors:', JSON.stringify(result.error.errors, null, 2));
        return res.status(400).json({ 
          message: "Invalid activity data",
          errors: result.error.errors 
        });
      }

      console.log('Validated activity data:', JSON.stringify(result.data, null, 2));
      const activity = await storage.createActivity(result.data);
      console.log('Created activity:', JSON.stringify(activity, null, 2));
      res.status(201).json(activity);
    } catch (error) {
      console.error("=== ACTIVITY CREATION ERROR ===");
      console.error("Error creating activity:", error);
      console.error("Error type:", typeof error);
      console.error("Error message:", error instanceof Error ? error.message : JSON.stringify(error));
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack');
      console.error("=== END ERROR ===");
      res.status(500).json({ message: "Failed to create activity", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Delete activity
  app.delete('/api/activities/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activityId = parseInt(req.params.id);
      
      await storage.deleteActivity(activityId, userId);
      res.json({ message: "Activity deleted successfully" });
    } catch (error) {
      console.error("Error deleting activity:", error);
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
