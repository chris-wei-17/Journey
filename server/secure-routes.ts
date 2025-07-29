import type { Express } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
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
  JWT_SECRET,
  type AuthenticatedRequest 
} from "./auth.js";

import { 
  resetPasswordWhileLoggedIn, 
  sendForgotPasswordEmail, 
  resetPasswordWithToken 
} from "./auth.js";

import { sendEmail } from "./mail.js";

import { 
  loginSchema,
  registerSchema,
  onboardingSchema,
  insertProgressEntrySchema,
  insertPhotoSchema,
  insertActivitySchema,
  insertCustomActivitySchema,
  insertMacroSchema,
  insertMacroTargetSchema,
  insertMetricsSchema,
  insertCustomMetricFieldSchema,
  type MetricEntry,
  type CustomMetricField,
  type CustomActivity
} from "../shared/schema.js";
import multer from "multer";
import sharp from "sharp";
import { supabase, PHOTOS_BUCKET, generateSignedUrl } from "./supabase-client.js";
import { photoUrlService } from "./photo-url-service.js";

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
        photosPin: user.photosPin,
        photosPinEnabled: user.photosPinEnabled,
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

        // Save photo metadata to database with file paths (not URLs for security)
        const photo = await storage.createPhoto({
          userId: req.userId!,
          filename: filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          imagePath: fullImagePath,
          thumbnailPath: thumbnailPath,
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

  // Get user photos with signed URLs for secure access
  app.get('/api/photos', authenticateToken, async (req: any, res) => {
    try {
      const photos = await storage.getUserPhotos(req.userId!);
      console.log(`📋 Found ${photos.length} photos for user ${req.userId}`);
      
      // Generate signed URLs for each photo using the service (with caching)
      const filePaths = photos.flatMap(photo => [photo.imagePath, photo.thumbnailPath]);
      console.log(`🔗 Generating signed URLs for ${filePaths.length} file paths`);
      
      const signedUrls = await photoUrlService.getSignedUrls(filePaths);
      console.log(`🔗 Signed URLs result:`, Object.keys(signedUrls).length, 'URLs generated');
      
      const photosWithUrls = photos.map(photo => {
        const imageUrl = signedUrls[photo.imagePath] || null;
        const thumbnailUrl = signedUrls[photo.thumbnailPath] || null;
        
        

        
        return {
          ...photo,
          imageUrl,
          thumbnailUrl,
          // Remove internal paths from response for security
          imagePath: undefined,
          thumbnailPath: undefined,
        };
      });
      

      res.json(photosWithUrls);
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // Get photos by date with signed URLs for secure access
  app.get('/api/photos/date/:date', authenticateToken, async (req: any, res) => {
    try {
      const date = req.params.date;
      const photos = await storage.getPhotosByDate(req.userId!, date);
      
      // Generate signed URLs for each photo using the service (with caching)
      const filePaths = photos.flatMap(photo => [photo.imagePath, photo.thumbnailPath]);
      const signedUrls = await photoUrlService.getSignedUrls(filePaths);
      
      const photosWithUrls = photos.map(photo => ({
        ...photo,
        imageUrl: signedUrls[photo.imagePath] || null,
        thumbnailUrl: signedUrls[photo.thumbnailPath] || null,
        // Remove internal paths from response for security
        imagePath: undefined,
        thumbnailPath: undefined,
      }));
      
      res.json(photosWithUrls);
    } catch (error) {
      console.error("Error fetching photos by date:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // Legacy photo URL route - for backward compatibility
  app.get('/api/photos/:filename', async (req: any, res) => {
    try {
      const filename = req.params.filename;
      const token = req.query.token as string;
      const thumbnail = req.query.thumbnail === 'true';
      
      console.log(`🔍 Legacy photo route accessed: ${filename}, thumbnail: ${thumbnail}`);
      
      if (!token) {
        console.log('❌ No token provided');
        return res.status(401).json({ message: "Access token required" });
      }
      
      // Verify token and get user ID - try photo token first, then regular auth token
      let userId = verifyPhotoToken(token);
      if (!userId) {
        // Try regular auth token as fallback
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
          userId = decoded.userId;
          console.log(`✅ Using regular auth token for user ${userId}`);
        } catch (error) {
          console.log('❌ Invalid token (neither photo nor auth token)');
          return res.status(401).json({ message: "Invalid or expired token" });
        }
      } else {
        console.log(`✅ Using photo token for user ${userId}`);
      }
      
      console.log(`👤 User ${userId} requesting photo ${filename}`);
      
      // Verify user owns this photo
      const photos = await storage.getUserPhotos(userId);
      const photo = photos.find(p => p.filename === filename);
      
      if (!photo) {
        console.log('❌ Photo not found or access denied');
        console.log('Available photos:', photos.map(p => p.filename));
        return res.status(404).json({ message: "Photo not found or access denied" });
      }

      console.log(`✅ Photo found: ${photo.filename}`);
      console.log(`📁 Image path: ${photo.imagePath}`);
      console.log(`📁 Thumbnail path: ${photo.thumbnailPath}`);

      // Generate signed URL for secure access to private bucket (with caching)
      const filePath = thumbnail ? photo.thumbnailPath : photo.imagePath;
      console.log(`🔗 Generating signed URL for: ${filePath}`);
      
      const signedUrl = await photoUrlService.getSignedUrl(filePath);
      console.log(`✅ Signed URL generated: ${signedUrl.substring(0, 100)}...`);
      
      res.redirect(signedUrl);
    } catch (error) {
      console.error("Error serving photo:", error);
      res.status(500).json({ message: "Failed to serve photo" });
    }
  });



  // Refresh photo URLs (useful for client-side caching)
  app.post('/api/photos/refresh-urls', authenticateToken, async (req: any, res) => {
    try {
      const { filePaths } = req.body;
      
      if (!filePaths || !Array.isArray(filePaths)) {
        return res.status(400).json({ message: "filePaths array is required" });
      }
      
      // Verify user owns these photos (security check)
      const userPhotos = await storage.getUserPhotos(req.userId!);
      const userFilePaths = userPhotos.flatMap(photo => [photo.imagePath, photo.thumbnailPath]);
      
      const validFilePaths = filePaths.filter(path => userFilePaths.includes(path));
      
      if (validFilePaths.length === 0) {
        return res.status(403).json({ message: "No valid file paths found" });
      }
      
      // Generate fresh signed URLs
      const refreshedUrls = await photoUrlService.getSignedUrls(validFilePaths);
      
      res.json({ urls: refreshedUrls });
    } catch (error) {
      console.error("Error refreshing photo URLs:", error);
      res.status(500).json({ message: "Failed to refresh URLs" });
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
        // Clear URLs from cache
        photoUrlService.clearCacheForFile(photo.imagePath);
        photoUrlService.clearCacheForFile(photo.thumbnailPath);
        
        // Delete files from Supabase Storage
        const filesToDelete = [photo.imagePath, photo.thumbnailPath];
        
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
        durationMinutes: req.body.durationMinutes,
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

  app.put('/api/activities/:id', authenticateToken, async (req: any, res) => {
    console.log('=== ACTIVITY UPDATE START ===');
    try {
      const userId = req.userId!;
      const activityId = parseInt(req.params.id);
      console.log('Updating activity:', activityId, 'for user:', userId);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const activityData = {
        userId,
        activityType: req.body.activityType,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
        durationMinutes: req.body.durationMinutes,
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
      const activity = await storage.updateActivity(activityId, result.data);
      console.log('Updated activity:', JSON.stringify(activity, null, 2));
      res.json(activity);
    } catch (error) {
      console.error("=== ACTIVITY UPDATE ERROR ===");
      console.error("Error updating activity:", error);
      console.error("Error type:", typeof error);
      console.error("Error message:", error instanceof Error ? error.message : JSON.stringify(error));
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack');
      console.error("=== END ERROR ===");
      res.status(500).json({ message: "Failed to update activity", error: error instanceof Error ? error.message : 'Unknown error' });
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

  // Custom activity routes
  app.get('/api/custom-activities', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const customActivities = await storage.getUserCustomActivities(userId);
      res.json(customActivities);
    } catch (error) {
      console.error("Error fetching custom activities:", error);
      res.status(500).json({ message: "Failed to fetch custom activities" });
    }
  });

  app.post('/api/custom-activities', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const customActivityData = {
        userId,
        name: req.body.name,
        category: req.body.category || 'STRAIN',
        icon: req.body.icon || 'fa-dumbbell',
      };
      
      const result = insertCustomActivitySchema.safeParse(customActivityData);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid custom activity data",
          errors: result.error.errors 
        });
      }

      // Check if activity with same name already exists for this user
      const existingActivities = await storage.getUserCustomActivities(userId);
      const normalizedName = result.data.name.toLowerCase().trim();
      const existingActivity = existingActivities.find(
        activity => activity.name.toLowerCase().trim() === normalizedName
      );
      
      if (existingActivity) {
        return res.status(409).json({ 
          message: "Activity with this name already exists",
          activity: existingActivity 
        });
      }

      const customActivity = await storage.createCustomActivity(result.data);
      res.status(201).json(customActivity);
    } catch (error) {
      console.error("Error creating custom activity:", error);
      res.status(500).json({ message: "Failed to create custom activity" });
    }
  });

  app.delete('/api/custom-activities/:id', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const activityId = parseInt(req.params.id);
      
      await storage.deleteCustomActivity(activityId, userId);
      res.json({ message: "Custom activity deleted successfully" });
    } catch (error) {
      console.error("Error deleting custom activity:", error);
      res.status(500).json({ message: "Failed to delete custom activity" });
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
  app.post('/api/logout', authenticateToken, (req: any, res) => {
    // Since we're using JWT tokens stored client-side, 
    // logout is primarily handled by the client removing the token
    // This endpoint can be used for server-side cleanup if needed in the future
    
    console.log(`User ${req.userId} logged out`);
    res.json({ 
      message: "Logged out successfully",
      timestamp: new Date().toISOString()
    });
  });

  // Profile management endpoints
  app.get('/api/profile', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const userProfile = await storage.getUserProfile(userId);
      res.json(userProfile || {});
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put('/api/profile/user', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const userData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username: req.body.username,
        email: req.body.email,
        updatedAt: new Date(),
      };

      const updatedUser = await storage.updateUser(userId, userData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user information" });
    }
  });

  app.put('/api/profile/profile', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const profileData = {
        gender: req.body.gender,
        birthday: req.body.birthday,
        height: req.body.height,
        weight: req.body.weight,
        bodyType: req.body.bodyType,
        updatedAt: new Date(),
      };

      // Check if profile exists
      const existingProfile = await storage.getUserProfile(userId);
      
      let updatedProfile;
      if (existingProfile) {
        // Update existing profile
        updatedProfile = await storage.updateUserProfile(userId, profileData);
      } else {
        // Create new profile
        updatedProfile = await storage.createUserProfile({
          userId,
          ...profileData,
          onboardingCompleted: true,
        });
      }
      
      res.json(updatedProfile);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile information" });
    }
  });

  app.post('/api/profile/avatar', authenticateToken, upload.single('profileImage'), async (req: any, res) => {
    try {
      const userId = req.userId!;
      
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Create unique filename
      const fileExtension = req.file.originalname.split('.').pop();
      const fileName = `avatar-${userId}-${Date.now()}.${fileExtension}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return res.status(500).json({ message: "Failed to upload avatar" });
      }

      // Generate signed URL for avatar (avatars can be public)
      const profileImageUrl = await generateSignedUrl(filePath, 365 * 24 * 3600); // 1 year expiry

      // Update user with new profile image URL
      const updatedUser = await storage.updateUser(userId, { 
        profileImageUrl,
        updatedAt: new Date()
      });

      res.json({ 
        message: "Avatar updated successfully",
        profileImageUrl,
        user: updatedUser
      });
    } catch (error) {
      console.error("Error updating avatar:", error);
      res.status(500).json({ message: "Failed to update avatar" });
    }
  });

  // Keep GET endpoint for backward compatibility (will be removed)
  app.get('/api/logout', (req, res) => {
    res.json({ 
      message: "Logged out successfully", 
      note: "Please use POST /api/logout instead"
    });
  });

  // Helper function for sending emails
  const sendEmailFn = async (
    to: string,
    subject: string,
    html: string
  ): Promise<void> => {
    try {
      await sendEmail({ to, subject, html });
    } catch (error) {
      console.error("Failed to send email:", error);
      throw error;
    }
  };

  // Authenticated: Submit feedback
  app.post('/api/feedback', authenticateToken, async (req: any, res) => {
    const { feedback } = req.body;
    const userId = req.userId;

    if (!feedback || typeof feedback !== 'string') {
      return res.status(400).json({ message: "Feedback is required" });
    }

    if (feedback.trim().length < 10) {
      return res.status(400).json({ message: "Feedback must be at least 10 characters long" });
    }

    if (feedback.trim().length > 2000) {
      return res.status(400).json({ message: "Feedback must be less than 2000 characters" });
    }

    // Rate limiting - max 3 feedback submissions per 15 minutes per user
    const rateLimitKey = `feedback_${userId}`;
    if (!checkRateLimit(rateLimitKey, 3)) {
      return res.status(429).json({ 
        message: "Too many feedback submissions. Please wait 15 minutes before submitting again." 
      });
    }

    try {
      // Get user info for context
      const user = await storage.getUser(userId);
      const userProfile = await storage.getUserProfile(userId);
      
      const userContext = user ? `
User: ${user.firstName || 'Unknown'} ${user.lastName || ''} (${user.username})
Email: ${user.email}
User ID: ${userId}
Profile: ${userProfile ? `${userProfile.gender || 'N/A'}, ${userProfile.bodyType || 'N/A'}` : 'No profile'}
      `.trim() : `User ID: ${userId}`;

      const subject = "Journey App - User Feedback";
      const emailContent = `
New feedback received from Journey app:

${userContext}

Feedback:
${feedback.trim()}

---
Submitted at: ${new Date().toISOString()}
      `.trim();

      await sendEmailFn(
        process.env.SUPPORT_EMAIL || 'support@journey.app', 
        subject, 
        emailContent
      );

      console.log(`✅ Feedback submitted by user ${userId}`);
      res.json({ message: "Feedback submitted successfully" });
    } catch (error) {
      console.error("Feedback submission error:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  // Photos PIN protection routes
  app.put('/api/user/photos-pin', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const { pin, enabled } = req.body;

      const hashedPin = pin ? await bcrypt.hash(pin, 10) : null;
      
      await storage.updateUserPinSettings(userId, hashedPin, enabled);
      res.json({ message: "PIN settings updated successfully" });
    } catch (error) {
      console.error("Error updating PIN settings:", error);
      res.status(500).json({ message: "Failed to update PIN settings" });
    }
  });

  app.post('/api/user/verify-photos-pin', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const { pin } = req.body;

      const user = await storage.getUserById(userId);
      if (!user || !user.photosPin) {
        return res.status(400).json({ message: "No PIN set" });
      }

      const isValid = await bcrypt.compare(pin, user.photosPin);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid PIN" });
      }

      res.json({ message: "PIN verified successfully" });
    } catch (error) {
      console.error("Error verifying PIN:", error);
      res.status(500).json({ message: "Failed to verify PIN" });
    }
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

// Authenticated: Reset password while logged in
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  await resetPasswordWhileLoggedIn(req as AuthenticatedRequest, res);
});

// Public: Request password reset email
app.post('/api/auth/request-password-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  // Rate limiting - max 3 requests per 15 minutes per email
  const rateLimitKey = `pwd_reset_${email}`;
  if (!checkRateLimit(rateLimitKey, 3)) {
    return res.status(429).json({ 
      message: "Too many password reset requests. Please wait 15 minutes before trying again." 
    });
  }

  try {
    await sendForgotPasswordEmail(email, sendEmailFn);
    res.json({ message: "If the email is registered, a reset link has been sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to send reset link" });
  }
});

// Public: Reset password with token
app.post('/api/auth/reset-password', async (req, res) => {
  await resetPasswordWithToken(req, res);
});

  const httpServer = createServer(app);
  return httpServer;
}

