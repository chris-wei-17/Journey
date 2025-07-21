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
  insertPhotoSchema 
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
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No photos uploaded" });
      }

      const savedPhotos = [];
      for (const file of files) {
        const photo = await storage.createPhoto({
          userId: req.userId!,
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
  app.get('/api/photos', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const photos = await storage.getUserPhotos(req.userId!);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
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

  // Delete photo
  app.delete('/api/photos/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const photoId = parseInt(req.params.id);
      
      await storage.deletePhoto(photoId, req.userId!);
      res.json({ message: "Photo deleted successfully" });
    } catch (error) {
      console.error("Error deleting photo:", error);
      res.status(500).json({ message: "Failed to delete photo" });
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