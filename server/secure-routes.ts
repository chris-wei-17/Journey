import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { 
  authenticateToken, 
  hashPassword, 
  comparePassword, 
  generateToken,
  generatePhotoToken,
  verifyPhotoToken,
  checkRateLimit, 
  clearRateLimit,
  type AuthenticatedRequest 
} from "./auth.js";
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
} from "../shared/schema.js";
import multer from "multer";
import sharp from "sharp";
import { supabase, PHOTOS_BUCKET } from "./supabase-client.js";

// Configure multer for photo uploads - use memory storage since we're storing in database
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory instead of filesystem
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
  // Health check endpoint for debugging
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      vercel: !!process.env.VERCEL
    });
  });

  // Database connectivity test endpoint
  app.get('/api/debug/db', async (req, res) => {
    try {
      console.log('=== DATABASE DEBUG ENDPOINT ===');
      console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
      console.log('DATABASE_URL preview:', process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 20) + '...' : 'Not set');
      
      // Test basic database query
      const testUser = await storage.getUser(1);
      console.log('Test query result:', testUser ? 'User found' : 'No user found');
      
      res.json({
        status: 'Database connection successful',
        hasDatabase: !!process.env.DATABASE_URL,
        testQuery: testUser ? 'success' : 'no_data',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Database debug error:', error);
      res.status(500).json({
        status: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        hasDatabase: !!process.env.DATABASE_URL,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Test POST endpoint for debugging
  app.post('/api/test', (req, res) => {
    console.log('=== TEST POST ROUTE CALLED ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Body:', req.body);
    res.json({ 
      message: 'POST test successful',
      body: req.body,
      method: req.method,
      url: req.url
    });
  });

  // Public authentication routes
  app.post('/api/register', async (req, res) => {
    try {
      console.log('=== REGISTER ROUTE CALLED ===');
      console.log('Method:', req.method);
      console.log('URL:', req.url);
      console.log('Body:', JSON.stringify(req.body, null, 2));
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
      console.log('Environment check:');
      console.log('  NODE_ENV:', process.env.NODE_ENV);
      console.log('  VERCEL:', process.env.VERCEL);
      console.log('  DATABASE_URL present:', !!process.env.DATABASE_URL);
      
      // Test database connection first
      try {
        console.log('Testing database connection...');
        console.log('DATABASE_URL format:', process.env.DATABASE_URL ? 
          'postgres://' + process.env.DATABASE_URL.split('@')[1] : 'Not set');
        
        // Test raw database connection first
        console.log('Testing raw database connection...');
        const { db } = await import("./db.js");
        
        // Use sql template for raw query
        const { sql } = await import("drizzle-orm");
        const rawResult = await db.execute(sql`SELECT 1 as test`);
        console.log('Raw database query successful:', rawResult);
        
        // Then test through storage layer
        console.log('Testing storage layer...');
        const testResult = await storage.getUser(1);
        console.log('Storage layer test successful, query returned:', testResult ? 'user found' : 'no user found');
      } catch (dbError) {
        console.error('Database connection failed:', dbError);
        console.error('Error type:', typeof dbError);
        console.error('Error constructor:', dbError?.constructor?.name);
        console.error('Error keys:', Object.keys(dbError || {}));
        console.error('Full error object:', JSON.stringify(dbError, null, 2));
        
        // Try to extract meaningful error information
        let errorMessage = 'Unknown database error';
        let errorDetails = {};
        
        if (dbError instanceof Error) {
          errorMessage = dbError.message;
          errorDetails = {
            name: dbError.name,
            stack: dbError.stack,
            cause: dbError.cause
          };
        } else if (dbError && typeof dbError === 'object') {
          // Handle non-Error objects
          errorMessage = dbError.message || dbError.error || dbError.toString() || 'Unknown database error';
          errorDetails = dbError;
        } else {
          errorMessage = String(dbError);
        }
        
        console.error('Processed error message:', errorMessage);
        console.error('Processed error details:', errorDetails);
        
        // Specific handling for authentication errors
        let specificMessage = "Database connection failed";
        let troubleshooting = undefined;
        
        if (errorMessage.includes('SASL') || errorMessage.includes('SCRAM')) {
          specificMessage = "Database authentication failed - please check your connection string credentials";
          console.error('🔴 AUTHENTICATION ERROR: This suggests the username/password in DATABASE_URL is incorrect');
          console.error('Please verify:');
          console.error('1. The password in your DATABASE_URL is correct');
          console.error('2. You are using the pooler connection string (not direct connection)');
          console.error('3. The username format matches your Supabase project');
          troubleshooting = {
            issue: "Authentication failed",
            solution: "Check your DATABASE_URL password and ensure you're using the pooler connection string"
          };
        } else if (errorMessage.includes('ENOTFOUND')) {
          specificMessage = "Database host not found - please check your connection string";
        } else if (errorMessage.includes('timeout')) {
          specificMessage = "Database connection timeout - please try again";
        }
        
        return res.status(500).json({ 
          message: specificMessage,
          error: errorMessage,
          errorType: dbError?.constructor?.name || typeof dbError,
          troubleshooting,
          details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        });
      }
      
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
      console.log('Checking for existing user...');
      const existingUser = await storage.getUserByUsernameOrEmail(username);
      if (existingUser) {
        console.log('Username already exists');
        return res.status(409).json({ message: "Username or email already exists" });
      }

      console.log('Checking for existing email...');
      const existingEmail = await storage.getUserByUsernameOrEmail(email);
      if (existingEmail) {
        console.log('Email already exists');
        return res.status(409).json({ message: "Email already exists" });
      }

      // Hash password and create user
      console.log('Hashing password...');
      const passwordHash = await hashPassword(password);
      
      console.log('Creating user...');
      const user = await storage.createUser({
        username,
        email,
        passwordHash,
        firstName,
        lastName,
        isEmailVerified: false,
      });
      console.log('User created successfully with ID:', user.id);

      // Generate token
      console.log('Generating token...');
      const token = generateToken(user.id);

      console.log('Registration completed successfully');
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
      console.error("Registration error details:");
      console.error("Error message:", error instanceof Error ? error.message : 'Unknown error');
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      console.error("Error type:", typeof error);
      console.error("Full error object:", error);
      
      res.status(500).json({ 
        message: "Registration failed",
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  app.post('/api/login', async (req, res) => {
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
  app.get('/api/user', authenticateToken, async (req: any, res) => {
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
  app.post('/api/onboarding/complete', authenticateToken, async (req: any, res) => {
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
  app.get('/api/profile', authenticateToken, async (req: any, res) => {
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
  app.post('/api/progress', authenticateToken, async (req: any, res) => {
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
  app.get('/api/progress', authenticateToken, async (req: any, res) => {
    try {
      const progress = await storage.getUserProgress(req.userId!);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Upload photos - store in Supabase Storage
  app.post('/api/photos', authenticateToken, upload.array('photos', 5), async (req: any, res) => {
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
        // File is already in memory with multer.memoryStorage()
        const imageBuffer = file.buffer;
        
        // Generate thumbnail using Sharp
        const thumbnailBuffer = await sharp(imageBuffer)
          .resize(200, 200, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer();
        
        // Generate unique filename and paths
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileExtension = file.originalname.split('.').pop() || 'jpg';
        const baseFilename = `${timestamp}_${randomSuffix}`;
        const filename = `${baseFilename}.${fileExtension}`;
        const thumbnailFilename = `${baseFilename}_thumb.jpg`;
        
        // Create paths in storage bucket (organized by user and date)
        const userFolder = `user_${req.userId}`;
        const dateFolder = new Date(dateStr).toISOString().split('T')[0];
        const bucketPath = `${userFolder}/${dateFolder}`;
        const fullImagePath = `${bucketPath}/${filename}`;
        const thumbnailPath = `${bucketPath}/${thumbnailFilename}`;

        // Upload full image to Supabase Storage
        const { data: imageUpload, error: imageError } = await supabase.storage
          .from(PHOTOS_BUCKET)
          .upload(fullImagePath, imageBuffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (imageError) {
          console.error('Error uploading image:', imageError);
          throw new Error(`Failed to upload image: ${imageError.message}`);
        }

        // Upload thumbnail to Supabase Storage
        const { data: thumbnailUpload, error: thumbnailError } = await supabase.storage
          .from(PHOTOS_BUCKET)
          .upload(thumbnailPath, thumbnailBuffer, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (thumbnailError) {
          console.error('Error uploading thumbnail:', thumbnailError);
          // Try to clean up the uploaded image
          await supabase.storage.from(PHOTOS_BUCKET).remove([fullImagePath]);
          throw new Error(`Failed to upload thumbnail: ${thumbnailError.message}`);
        }

        // Get public URLs for the uploaded files
        const { data: imageUrlData } = supabase.storage
          .from(PHOTOS_BUCKET)
          .getPublicUrl(fullImagePath);
          
        const { data: thumbnailUrlData } = supabase.storage
          .from(PHOTOS_BUCKET)
          .getPublicUrl(thumbnailPath);

        // Save photo metadata to database
        const photo = await storage.createPhoto({
          userId: req.userId!,
          filename: filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          imageUrl: imageUrlData.publicUrl,
          thumbnailUrl: thumbnailUrlData.publicUrl,
          bucketPath: bucketPath,
          date: new Date(dateStr),
        });
        
        savedPhotos.push(photo);
      }

      res.json(savedPhotos);
    } catch (error) {
      console.error("Error uploading photos:", error);
      res.status(500).json({ message: "Failed to upload photos", error: error.message });
    }
  });

  // Get user photos
  app.get('/api/photos', authenticateToken, async (req: any, res) => {
    try {
      const photos = await storage.getUserPhotos(req.userId!);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // Get photos by date with signed URLs
  app.get('/api/photos/date/:date', authenticateToken, async (req: any, res) => {
    try {
      const date = req.params.date;
      const photos = await storage.getPhotosByDate(req.userId!, date);
      
      // Add signed URLs to photos
      const photoToken = generatePhotoToken(req.userId!);
      const photosWithUrls = photos.map(photo => ({
        ...photo,
        url: `/api/photos/${photo.filename}?token=${photoToken}`,
        thumbnailUrl: `/api/photos/thumbnail/${photo.thumbnailFilename}?token=${photoToken}`
      }));
      
      res.json(photosWithUrls);
    } catch (error) {
      console.error("Error fetching photos by date:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // Get photo URL with authentication
  app.get('/api/photos/:filename', async (req: any, res) => {
    try {
      const filename = req.params.filename;
      const token = req.query.token as string;
      const thumbnail = req.query.thumbnail === 'true';
      
      if (!token) {
        return res.status(401).json({ message: "Access token required" });
      }
      
      // Verify token and get user ID
      const userId = verifyPhotoToken(token);
      if (!userId) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
      
      // Verify user owns this photo
      const photos = await storage.getUserPhotos(userId);
      const photo = photos.find(p => p.filename === filename);
      
      if (!photo) {
        return res.status(404).json({ message: "Photo not found or access denied" });
      }

      // Redirect to the appropriate Supabase Storage URL
      const redirectUrl = thumbnail ? photo.thumbnailUrl : photo.imageUrl;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Error serving photo:", error);
      res.status(500).json({ message: "Failed to serve photo" });
    }
  });

  // Note: Thumbnails are now served via the main photo route with ?thumbnail=true parameter

  // Delete photo
  app.delete('/api/photos/:id', authenticateToken, async (req: any, res) => {
    try {
      const photoId = parseInt(req.params.id);
      
      // Get photo details before deletion to clean up storage files
      const photos = await storage.getUserPhotos(req.userId!);
      const photo = photos.find(p => p.id === photoId);
      
      if (photo) {
        // Delete files from Supabase Storage
        const filesToDelete = [
          `${photo.bucketPath}/${photo.filename}`,
          `${photo.bucketPath}/${photo.filename.replace(/\.[^/.]+$/, '_thumb.jpg')}`
        ];
        
        const { error: storageError } = await supabase.storage
          .from(PHOTOS_BUCKET)
          .remove(filesToDelete);
          
        if (storageError) {
          console.error('Error deleting files from storage:', storageError);
          // Continue with database deletion even if storage cleanup fails
        }
      }
      
      // Delete from database
      await storage.deletePhoto(photoId, req.userId!);
      res.json({ message: "Photo deleted successfully" });
    } catch (error) {
      console.error("Error deleting photo:", error);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  // Activity routes for "My Day" functionality
  app.get('/api/activities/date/:date', authenticateToken, async (req: any, res) => {
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

  app.post('/api/activities', authenticateToken, async (req: any, res) => {
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

  app.delete('/api/activities/:id', authenticateToken, async (req: any, res) => {
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
  app.get('/api/progress/date/:date', authenticateToken, async (req: any, res) => {
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
  app.get('/api/macros/date/:date', authenticateToken, async (req: any, res) => {
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

  app.post('/api/macros', authenticateToken, async (req: any, res) => {
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

  app.delete('/api/macros/:id', authenticateToken, async (req: any, res) => {
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
  app.get('/api/macro-targets', authenticateToken, async (req: any, res) => {
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
  app.get('/api/metrics/date/:date', authenticateToken, async (req: any, res) => {
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

  app.post('/api/metrics', authenticateToken, async (req: any, res) => {
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
  app.get('/api/custom-metric-fields', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const fields = await storage.getCustomMetricFields(userId);
      res.json(fields);
    } catch (error) {
      console.error('Error fetching custom metric fields:', error);
      res.status(500).json({ message: 'Failed to fetch custom fields' });
    }
  });

  app.post('/api/custom-metric-fields', authenticateToken, async (req: any, res) => {
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

  app.delete('/api/custom-metric-fields/:id', authenticateToken, async (req: any, res) => {
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

  app.post('/api/macro-targets', authenticateToken, async (req: any, res) => {
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
    res.json({ message: "Logged out successfully" });
  });

  // Debug catch-all route for API
  app.all('/api/*', (req, res) => {
    console.log('=== UNMATCHED API ROUTE ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Path:', req.path);
    console.log('Original URL:', req.originalUrl);
    res.status(404).json({ 
      message: 'API route not found', 
      method: req.method,
      url: req.url,
      path: req.path,
      originalUrl: req.originalUrl
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}

