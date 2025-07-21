import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  authenticateToken, 
  hashPassword, 
  comparePassword, 
  generateToken, 
  checkRateLimit, 
  clearRateLimit,
  type AuthenticatedRequest 
} from "./auth";
import { 
  loginSchema,
  registerSchema,
  onboardingSchema,
  insertProgressEntrySchema,
  insertPhotoSchema,
  insertActivitySchema,
  insertMacroSchema,
  insertMacroTargetSchema,
  insertMetricsSchema,
  insertCustomMetricFieldSchema,
  type MetricEntry,
  type CustomMetricField
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

export async function registerSecureRoutes(app: Express): Promise<Server> {
  // Public authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid registration data",
          errors: result.error.errors 
        });
      }

      const { username, email, password, firstName, lastName } = result.data;

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
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      
      if (!result.success) {
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
  });

  // Protected routes
  app.get('/api/auth/user', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get profile data
      const profile = await storage.getUserProfile(req.userId!);
      const goals = await storage.getUserGoals(req.userId!);
      
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
  });

  // Complete onboarding
  app.post('/api/onboarding/complete', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
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
        userId: req.userId!,
        gender,
        birthday: birthday || null,
        height,
        weight,
        bodyType,
        onboardingCompleted: true,
      });

      // Clear existing goals and create new ones
      await storage.deleteUserGoals(req.userId!);
      for (const goalType of goals) {
        await storage.createUserGoal({
          userId: req.userId!,
          goalType,
          isActive: true,
        });
      }

      // Create initial progress entries
      for (const [goalType, progressValue] of Object.entries(progress)) {
        if (goals.includes(goalType)) {
          await storage.createProgressEntry({
            userId: req.userId!,
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
  app.get('/api/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const profile = await storage.getUserProfile(req.userId!);
      const goals = await storage.getUserGoals(req.userId!);
      
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
  app.post('/api/progress', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const result = insertProgressEntrySchema.safeParse({
        ...req.body,
        userId: req.userId!,
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
  app.get('/api/progress', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const progress = await storage.getUserProgress(req.userId!);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Upload photos
  app.post('/api/photos', authenticateToken, upload.array('photos', 5), async (req: AuthenticatedRequest, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const dateStr = req.body.date;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No photos uploaded" });
      }

      if (!dateStr) {
        return res.status(400).json({ message: "Date is required" });
      }

      const savedPhotos = [];
      for (const file of files) {
        // Generate thumbnail
        const sharp = require('sharp');
        const thumbnailFilename = `thumb_${file.filename}`;
        const thumbnailPath = path.join(uploadDir, thumbnailFilename);
        
        await sharp(file.path)
          .resize(200, 200, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);

        const photo = await storage.createPhoto({
          userId: req.userId!,
          filename: file.filename,
          originalName: file.originalname,
          thumbnailFilename: thumbnailFilename,
          mimeType: file.mimetype,
          size: file.size,
          date: new Date(dateStr),
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
  app.get('/api/photos', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const photos = await storage.getUserPhotos(req.userId!);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // Get photos by date
  app.get('/api/photos/date/:date', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const date = req.params.date;
      const photos = await storage.getPhotosByDate(req.userId!, date);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos by date:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // Serve uploaded photos with authorization
  app.get('/api/photos/:filename', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const filename = req.params.filename;
      
      // Verify user owns this photo
      const photos = await storage.getUserPhotos(req.userId!);
      const photo = photos.find(p => p.filename === filename);
      
      if (!photo) {
        return res.status(404).json({ message: "Photo not found or access denied" });
      }

      const filePath = path.join(uploadDir, filename);
      
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        res.status(404).json({ message: "Photo file not found" });
      }
    } catch (error) {
      console.error("Error serving photo:", error);
      res.status(500).json({ message: "Failed to serve photo" });
    }
  });

  // Serve thumbnails with authorization
  app.get('/api/photos/thumbnail/:filename', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const filename = req.params.filename;
      
      // Verify user owns this photo
      const photos = await storage.getUserPhotos(req.userId!);
      const photo = photos.find(p => p.thumbnailFilename === filename || p.filename === filename);
      
      if (!photo) {
        return res.status(404).json({ message: "Photo not found or access denied" });
      }

      const filePath = path.join(uploadDir, filename);
      
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        res.status(404).json({ message: "Photo file not found" });
      }
    } catch (error) {
      console.error("Error serving thumbnail:", error);
      res.status(500).json({ message: "Failed to serve thumbnail" });
    }
  });

  // Delete photo
  app.delete('/api/photos/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const photoId = parseInt(req.params.id);
      
      // Get photo details before deletion to clean up files
      const photos = await storage.getUserPhotos(req.userId!);
      const photo = photos.find(p => p.id === photoId);
      
      if (photo) {
        // Delete files from filesystem
        const originalPath = path.join(uploadDir, photo.filename);
        const thumbnailPath = photo.thumbnailFilename ? path.join(uploadDir, photo.thumbnailFilename) : null;
        
        if (fs.existsSync(originalPath)) {
          fs.unlinkSync(originalPath);
        }
        if (thumbnailPath && fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }
      
      await storage.deletePhoto(photoId, req.userId!);
      res.json({ message: "Photo deleted successfully" });
    } catch (error) {
      console.error("Error deleting photo:", error);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  // Activity routes for "My Day" functionality
  app.get('/api/activities/date/:date', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const date = req.params.date;
      const activities = await storage.getActivitiesForDate(userId, date);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities for date:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post('/api/activities', authenticateToken, async (req: AuthenticatedRequest, res) => {
    console.log('=== ACTIVITY CREATION START ===');
    try {
      const userId = req.userId!;
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

  app.delete('/api/activities/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const activityId = parseInt(req.params.id);
      
      await storage.deleteActivity(activityId, userId);
      res.json({ message: "Activity deleted successfully" });
    } catch (error) {
      console.error("Error deleting activity:", error);
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  // Progress by date route
  app.get('/api/progress/date/:date', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const date = req.params.date;
      const progress = await storage.getProgressEntriesForDate(userId, date);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress for date:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Macro routes for nutrition tracking
  app.get('/api/macros/date/:date', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const date = req.params.date;
      const macros = await storage.getMacrosForDate(userId, date);
      res.json(macros);
    } catch (error) {
      console.error("Error fetching macros for date:", error);
      res.status(500).json({ message: "Failed to fetch macros" });
    }
  });

  app.post('/api/macros', authenticateToken, async (req: AuthenticatedRequest, res) => {
    console.log('=== MACRO CREATION START ===');
    try {
      const userId = req.userId!;
      console.log('Creating macro for user:', userId);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const macroData = {
        userId,
        description: req.body.description,
        protein: req.body.protein,
        fats: req.body.fats,
        carbs: req.body.carbs,
        date: new Date(req.body.date),
      };
      
      console.log('Processed macro data:', JSON.stringify(macroData, null, 2));
      
      const result = insertMacroSchema.safeParse(macroData);
      
      if (!result.success) {
        console.log('Validation errors:', JSON.stringify(result.error.errors, null, 2));
        return res.status(400).json({ 
          message: "Invalid macro data",
          errors: result.error.errors 
        });
      }

      console.log('Validated macro data:', JSON.stringify(result.data, null, 2));
      const macro = await storage.createMacro(result.data);
      console.log('Created macro:', JSON.stringify(macro, null, 2));
      res.status(201).json(macro);
    } catch (error) {
      console.error("=== MACRO CREATION ERROR ===");
      console.error("Error creating macro:", error);
      console.error("Error type:", typeof error);
      console.error("Error message:", error instanceof Error ? error.message : JSON.stringify(error));
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack');
      console.error("=== END ERROR ===");
      res.status(500).json({ message: "Failed to create macro", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete('/api/macros/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const macroId = parseInt(req.params.id);
      
      await storage.deleteMacro(macroId, userId);
      res.json({ message: "Macro deleted successfully" });
    } catch (error) {
      console.error("Error deleting macro:", error);
      res.status(500).json({ message: "Failed to delete macro" });
    }
  });

  // Macro targets routes
  app.get('/api/macro-targets', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const targets = await storage.getMacroTargets(userId);
      res.json(targets);
    } catch (error) {
      console.error("Error fetching macro targets:", error);
      res.status(500).json({ message: "Failed to fetch macro targets" });
    }
  });

  // Metrics routes
  app.get('/api/metrics/date/:date', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { date } = req.params;
      const userId = req.userId!;
      
      const metrics = await storage.getMetricsByDate(userId, date);
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      res.status(500).json({ message: 'Failed to fetch metrics' });
    }
  });

  app.post('/api/metrics', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      
      const metricData = {
        userId,
        date: new Date(req.body.date),
        weight: req.body.weight || null,
        customFields: req.body.customFields || {},
      };

      const result = insertMetricsSchema.safeParse(metricData);
      if (!result.success) {
        return res.status(400).json({ 
          message: 'Invalid request body', 
          errors: result.error.issues 
        });
      }

      const metric = await storage.createOrUpdateMetric(result.data);
      res.status(201).json(metric);
    } catch (error) {
      console.error('Error creating/updating metric:', error);
      res.status(500).json({ message: 'Failed to save metric' });
    }
  });

  // Custom metric fields routes
  app.get('/api/custom-metric-fields', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const fields = await storage.getCustomMetricFields(userId);
      res.json(fields);
    } catch (error) {
      console.error('Error fetching custom metric fields:', error);
      res.status(500).json({ message: 'Failed to fetch custom fields' });
    }
  });

  app.post('/api/custom-metric-fields', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      
      const fieldData = {
        userId,
        fieldName: req.body.fieldName,
        unit: req.body.unit,
      };

      const result = insertCustomMetricFieldSchema.safeParse(fieldData);
      if (!result.success) {
        return res.status(400).json({ 
          message: 'Invalid request body', 
          errors: result.error.issues 
        });
      }

      const field = await storage.createCustomMetricField(result.data);
      res.status(201).json(field);
    } catch (error) {
      console.error('Error creating custom metric field:', error);
      res.status(500).json({ message: 'Failed to create custom field' });
    }
  });

  app.delete('/api/custom-metric-fields/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const fieldId = parseInt(req.params.id);
      const userId = req.userId!;
      
      await storage.deleteCustomMetricField(fieldId, userId);
      res.json({ message: 'Custom field deleted successfully' });
    } catch (error) {
      console.error('Error deleting custom metric field:', error);
      res.status(500).json({ message: 'Failed to delete custom field' });
    }
  });

  app.post('/api/macro-targets', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      
      const targetsData = {
        userId,
        proteinTarget: req.body.proteinTarget,
        fatsTarget: req.body.fatsTarget,
        carbsTarget: req.body.carbsTarget,
      };
      
      const result = insertMacroTargetSchema.safeParse(targetsData);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid macro targets data",
          errors: result.error.errors 
        });
      }

      const targets = await storage.upsertMacroTargets(result.data);
      res.json(targets);
    } catch (error) {
      console.error("Error updating macro targets:", error);
      res.status(500).json({ message: "Failed to update macro targets" });
    }
  });

  // Logout endpoint (for client-side logout)
  app.get('/api/logout', (req, res) => {
    // Since we're using JWT tokens stored client-side, 
    // logout is primarily handled by the client removing the token
    res.json({ message: "Logout successful" });
  });

  const httpServer = createServer(app);
  return httpServer;
}