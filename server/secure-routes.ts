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
  insertGoalTargetSchema,
  insertGoalProgressSchema,
  type MetricEntry,
  type CustomMetricField,
  type CustomActivity,
  type GoalTarget,
  type InsertGoalTarget
} from "../shared/schema.js";
import multer from "multer";
import sharp from "sharp";
import { supabase, PHOTOS_BUCKET, generateSignedUrl } from "./supabase-client.js";
import { photoUrlService } from "./photo-url-service.js";

console.log('🎯 ALL IMPORTS SUCCESSFUL - secure-routes.ts loaded');

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
  console.log('🎬 ENTER registerSecureRoutes function');
  
  try {
    // FIRST ROUTE - Test if function is executing at all
    app.get('/api/test-first', (req, res) => {
      console.log('🚀 FIRST ROUTE HIT - registerSecureRoutes is executing');
      res.json({ message: 'Function is executing', timestamp: new Date() });
    });
    console.log('✅ test-first route registered');

  // Health check endpoint for debugging
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      vercel: !!process.env.VERCEL
    });
  });
  console.log('✅ health route registered');

  // Manual analytics trigger (admin only)
  app.post('/api/run_pipeline', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const me = await storage.getUser(userId);
      if (!me || me.username.toLowerCase() !== 'chris') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      const { user_id } = req.query as { user_id?: string };

      const fnUrlEnv = process.env.ANALYTICS_FUNCTION_URL;
      const fnKey = process.env.ANALYTICS_FUNCTION_KEY;
      if (!fnUrlEnv) {
        return res.status(500).json({ message: 'ANALYTICS_FUNCTION_URL not configured' });
      }

      const baseUrl = fnUrlEnv.replace(/\/$/, '');
      const runUrl = /\/run\/?$/.test(baseUrl) ? baseUrl : `${baseUrl}/run`;
      const healthUrl = `${baseUrl}/health`;
      const timeoutMs = Number(process.env.ANALYTICS_FUNCTION_TIMEOUT_MS || 30000);

      const fetchWithTimeout = async (url: string, init?: RequestInit, tmo = timeoutMs) => {
        const ac = new AbortController();
        const id = setTimeout(() => ac.abort(), tmo);
        try {
          const r = await fetch(url, { ...(init || {}), signal: ac.signal });
          return r;
        } finally {
          clearTimeout(id);
        }
      };

      // Best-effort wake-up probe (ignore errors)
      try { await fetchWithTimeout(healthUrl, { method: 'GET' }, 5000); } catch {}

      const runBody = JSON.stringify({ user_id: user_id || null });
      const headers: any = { 'Content-Type': 'application/json', ...(fnKey ? { 'Authorization': `Bearer ${fnKey}` } : {}) };

      let resp = await fetchWithTimeout(runUrl, { method: 'POST', headers, body: runBody });
      if (!resp.ok) {
        // Retry once after brief delay in case of cold start
        await new Promise(r => setTimeout(r, 1000));
        resp = await fetchWithTimeout(runUrl, { method: 'POST', headers, body: runBody });
      }

      let data: any = {};
      try { data = await resp.json(); } catch {}

      if (!resp.ok) {
        return res.status(resp.status >= 500 ? 502 : resp.status).json({
          status: 'error',
          code: resp.status,
          message: data?.message || resp.statusText || 'Upstream error',
          attemptedUrl: runUrl,
        });
      }

      return res.json({ status: 'ok', code: resp.status, attemptedUrl: runUrl, ...data });
    } catch (err: any) {
      console.error('run_pipeline error:', err);
      res.status(502).json({ message: 'Failed to reach analytics service', error: String(err?.message || err) });
    }
  });
  console.log('✅ run_pipeline route registered');

  // ===== ADMIN ANALYTICS ROUTES (chris-only) =====
  app.get('/api/analytics/summary/count', authenticateToken, async (req: any, res) => {
    try {
      const me = await storage.getUser(req.userId!);
      if (!me || me.username.toLowerCase() !== 'chris') return res.status(403).json({ message: 'Forbidden' });
      const { db } = await import('./db.js');
      const { sql } = await import('drizzle-orm');
      const result = await db.execute(sql`SELECT count(*)::int AS count FROM analytics_summary`);
      const count = Array.isArray(result) ? (result[0] as any)?.count : (result as any)?.rows?.[0]?.count || 0;
      res.json({ count: Number(count) || 0 });
    } catch {
      res.json({ count: 0 });
    }
  });

  app.get('/api/analytics/relationships/count', authenticateToken, async (req: any, res) => {
    try {
      const me = await storage.getUser(req.userId!);
      if (!me || me.username.toLowerCase() !== 'chris') return res.status(403).json({ message: 'Forbidden' });
      const { db } = await import('./db.js');
      const { sql } = await import('drizzle-orm');
      const result = await db.execute(sql`SELECT count(*)::int AS count FROM analytics_relationships`);
      const count = Array.isArray(result) ? (result[0] as any)?.count : (result as any)?.rows?.[0]?.count || 0;
      res.json({ count: Number(count) || 0 });
    } catch {
      res.json({ count: 0 });
    }
  });

  app.get('/api/analytics/storage-prefix', authenticateToken, async (req: any, res) => {
    try {
      const me = await storage.getUser(req.userId!);
      if (!me || me.username.toLowerCase() !== 'chris') return res.status(403).json({ message: 'Forbidden' });
      const prefix = process.env.ANALYTICS_STORAGE_PREFIX || '';
      res.json({ prefix });
    } catch {
      res.json({ prefix: '' });
    }
  });

  // Latest run id
  app.get('/api/analytics/runs/latest', authenticateToken, async (req: any, res) => {
    try {
      const me = await storage.getUser(req.userId!);
      if (!me || me.username.toLowerCase() !== 'chris') return res.status(403).json({ message: 'Forbidden' });
      const { db } = await import('./db.js');
      const { sql } = await import('drizzle-orm');
      const result = await db.execute(sql`SELECT batch_id FROM analytics_runs ORDER BY started_at DESC LIMIT 1`);
      const batchId = Array.isArray(result) ? (result[0] as any)?.batch_id : (result as any)?.rows?.[0]?.batch_id || null;
      res.json({ batchId });
    } catch {
      res.json({ batchId: null });
    }
  });

  // Sample rows
  app.get('/api/analytics/summary/sample', authenticateToken, async (req: any, res) => {
    try {
      const me = await storage.getUser(req.userId!);
      if (!me || me.username.toLowerCase() !== 'chris') return res.status(403).json({ message: 'Forbidden' });
      const limit = Math.min(parseInt(String(req.query.limit || '50')), 200);
      const { db } = await import('./db.js');
      const { sql } = await import('drizzle-orm');
      const result = await db.execute(sql`SELECT user_id, batch_id, summary, insights, created_at FROM analytics_summary ORDER BY id DESC LIMIT ${limit}`);
      const rows = Array.isArray(result) ? result : (result as any)?.rows || [];
      res.json({ rows });
    } catch {
      res.json({ rows: [] });
    }
  });

  app.get('/api/analytics/relationships/sample', authenticateToken, async (req: any, res) => {
    try {
      const me = await storage.getUser(req.userId!);
      if (!me || me.username.toLowerCase() !== 'chris') return res.status(403).json({ message: 'Forbidden' });
      const limit = Math.min(parseInt(String(req.query.limit || '100')), 500);
      const { db } = await import('./db.js');
      const { sql } = await import('drizzle-orm');
      const result = await db.execute(sql`SELECT batch_id, user_id, var_x, var_y, metric, value, lag, created_at FROM analytics_relationships ORDER BY id DESC LIMIT ${limit}`);
      const rows = Array.isArray(result) ? result : (result as any)?.rows || [];
      res.json({ rows });
    } catch {
      res.json({ rows: [] });
    }
  });

  // Storage browse
  app.get('/api/analytics/storage/list', authenticateToken, async (req: any, res) => {
    try {
      const me = await storage.getUser(req.userId!);
      if (!me || me.username.toLowerCase() !== 'chris') return res.status(403).json({ message: 'Forbidden' });
      const bucket = process.env.ANALYTICS_STORAGE_BUCKET;
      const prefixBase = process.env.ANALYTICS_STORAGE_PREFIX || '';
      if (!bucket) return res.json({ keys: [] });
      const batchId = String(req.query.batchId || '');
      const prefix = batchId ? `${prefixBase}/${batchId}/metrics` : prefixBase;
      const { supabase } = await import('./supabase-client.js');
      const r = await supabase.storage.from(bucket).list(prefix, { limit: 1000, search: '' });
      const keys = (r.data || []).map((o: any) => `${prefix}/${o.name}`);
      res.json({ keys, prefix });
    } catch {
      res.json({ keys: [] });
    }
  });

  app.get('/api/analytics/storage/signed-url', authenticateToken, async (req: any, res) => {
    try {
      const me = await storage.getUser(req.userId!);
      if (!me || me.username.toLowerCase() !== 'chris') return res.status(403).json({ message: 'Forbidden' });
      const bucket = process.env.ANALYTICS_STORAGE_BUCKET;
      if (!bucket) return res.status(400).json({ message: 'No bucket configured' });
      const key = String(req.query.key || '');
      if (!key) return res.status(400).json({ message: 'key is required' });
      const { supabase } = await import('./supabase-client.js');
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(key, 3600);
      if (error) return res.status(500).json({ message: error.message });
      res.json({ url: data.signedUrl });
    } catch {
      res.status(500).json({ message: 'Failed to sign' });
    }
  });

  // ===== STRIPE PAYMENT ROUTES =====
  console.log('🔧 Registering Stripe payment routes...');
  try {
    const stripeRoutes = await import('./routes/stripe.js');
    app.use('/api/stripe', stripeRoutes.default);
    console.log('✅ Stripe routes registered');
  } catch (error) {
    console.error('❌ Failed to register Stripe routes:', error);
    console.log('⚠️ Continuing without Stripe functionality');
  }

  // ===== JOURNAL ENTRIES ROUTES - SAFE EARLY POSITION =====
  console.log('🔧 Registering journal entry routes...');

  // Get journal entry for a specific date
  app.get('/api/journal-entries/date/:date', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const { date } = req.params;
      
      console.log(`🔍 Fetching journal entry for userId: ${userId}, date: ${date}`);
      
      // Parse the date (now comes as full ISO timestamp from client)
      const queryDate = new Date(date);
      
      // Create date range for the same day (24 hours from query date)
      const nextDay = new Date(queryDate.getTime() + 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', queryDate.toISOString())
        .lt('date', nextDay.toISOString())
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching journal entry:', error);
        throw error;
      }

      console.log(`📖 Found journal entry:`, data);
      res.json(data || null);
    } catch (error) {
      console.error('Error fetching journal entry:', error);
      res.status(500).json({ error: 'Failed to fetch journal entry' });
    }
  });

  // Create or update journal entry
  app.post('/api/journal-entries', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const { content, date, timezone } = req.body;

      console.log(`📝 Saving journal entry for userId: ${userId}, date: ${date}, timezone: ${timezone}`);
      console.log(`Content length: ${content?.length || 0} characters`);

      if (!content || !date) {
        return res.status(400).json({ error: 'Content and date are required' });
      }

      // Parse the date (now comes as full ISO timestamp from client)
      const entryDate = new Date(date);
      
      // Create date range for the same day (24 hours from entry date)
      const nextDay = new Date(entryDate.getTime() + 24 * 60 * 60 * 1000);

      // Check if entry already exists for this date
      const { data: existingEntry } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('user_id', userId)
        .gte('date', entryDate.toISOString())
        .lt('date', nextDay.toISOString())
        .single();

      let result;
      if (existingEntry) {
        // Update existing entry
        console.log(`📝 Updating existing journal entry with id: ${existingEntry.id}`);
        // Create timestamp in user's timezone
        const now = new Date();
        const userTimestamp = timezone ? 
          new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).formatToParts(now).reduce((acc, part) => {
            acc[part.type] = part.value;
            return acc;
          }, {}) : null;

        const userTimestampString = userTimestamp ? 
          `${userTimestamp.year}-${userTimestamp.month}-${userTimestamp.day}T${userTimestamp.hour}:${userTimestamp.minute}:${userTimestamp.second}` : 
          now.toISOString();

        console.log(`📝 Setting updated_at to user local time: ${userTimestampString}`);

        const { data, error } = await supabase
          .from('journal_entries')
          .update({ 
            content,
            updated_at: userTimestampString
          })
          .eq('id', existingEntry.id)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          console.error('Error updating journal entry:', error);
          throw error;
        }
        result = data;
      } else {
        // Create new entry
        console.log(`📝 Creating new journal entry`);
        
        // Create timestamp in user's timezone for new entries too
        const now = new Date();
        const userTimestamp = timezone ? 
          new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).formatToParts(now).reduce((acc, part) => {
            acc[part.type] = part.value;
            return acc;
          }, {}) : null;

        const userTimestampString = userTimestamp ? 
          `${userTimestamp.year}-${userTimestamp.month}-${userTimestamp.day}T${userTimestamp.hour}:${userTimestamp.minute}:${userTimestamp.second}` : 
          now.toISOString();

        console.log(`📝 Setting created_at and updated_at to user local time: ${userTimestampString}`);

        const { data, error } = await supabase
          .from('journal_entries')
          .insert({
            user_id: userId,
            content,
            date: entryDate.toISOString(),
            created_at: userTimestampString,
            updated_at: userTimestampString
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating journal entry:', error);
          throw error;
        }
        result = data;
      }

      console.log(`✅ Journal entry saved successfully:`, result);
      res.json(result);
    } catch (error) {
      console.error('Error saving journal entry:', error);
      res.status(500).json({ error: 'Failed to save journal entry' });
    }
  });

  // Update journal entry
  app.put('/api/journal-entries/:id', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { content } = req.body;

      console.log(`📝 Updating journal entry ${id} for userId: ${userId}`);

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      const { data, error } = await supabase
        .from('journal_entries')
        .update({ 
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating journal entry:', error);
        throw error;
      }

      if (!data) {
        return res.status(404).json({ error: 'Journal entry not found' });
      }

      console.log(`✅ Journal entry updated successfully:`, data);
      res.json(data);
    } catch (error) {
      console.error('Error updating journal entry:', error);
      res.status(500).json({ error: 'Failed to update journal entry' });
    }
  });

  // Delete journal entry
  app.delete('/api/journal-entries/:id', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      console.log(`🗑️ Deleting journal entry ${id} for userId: ${userId}`);

      const { data, error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error deleting journal entry:', error);
        throw error;
      }

      if (!data) {
        return res.status(404).json({ error: 'Journal entry not found' });
      }

      console.log(`✅ Journal entry deleted successfully`);
      res.json({ message: 'Journal entry deleted successfully' });
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      res.status(500).json({ error: 'Failed to delete journal entry' });
    }
  });

  // Get all journal entries for a user (with previews)
  app.get('/api/journal-entries', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId!;
      
      console.log(`📚 Fetching all journal entries for userId: ${userId}`);
      
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, date, content, created_at, updated_at')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching journal entries:', error);
        throw error;
      }

      // Create previews (first 20 words) for each entry
      const entriesWithPreviews = data.map(entry => ({
        ...entry,
        preview: entry.content.split(' ').slice(0, 20).join(' ') + (entry.content.split(' ').length > 20 ? '...' : '')
      }));

      console.log(`📚 Found ${entriesWithPreviews.length} journal entries`);
      res.json(entriesWithPreviews);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      res.status(500).json({ error: 'Failed to fetch journal entries' });
    }
  });

  console.log('✅ Journal entry routes registered successfully');

  // Goals API endpoints - MOVED TO SAFE POSITION
  app.get('/api/goals/test', (req, res) => {
    console.log('🧪 Goals test endpoint hit');
    res.json({ message: 'Goals routes working!', timestamp: new Date() });
  });
  console.log('✅ goals/test route registered');

  app.get('/api/goals', authenticateToken, async (req: any, res) => {
    try {
      console.log('🎯 GET /api/goals - Fetching goals for user:', req.userId);
      const goals = await storage.getUserGoalTargets(req.userId!);
      console.log('✅ Found goals:', goals.length);
      res.json(goals);
    } catch (error) {
      console.error('❌ Get goals error:', error);
      res.status(500).json({ message: 'Failed to fetch goals' });
    }
  });
  console.log('✅ GET /api/goals route registered');

  app.post('/api/goals', authenticateToken, async (req: any, res) => {
    try {
      console.log('Creating goal with data:', req.body);
      const { goalType, goalName, targetValuePrimary, targetUnitPrimary } = req.body;

      if (!goalType || !goalName || !targetValuePrimary || !targetUnitPrimary) {
        return res.status(400).json({
          message: 'Missing required fields: goalType, goalName, targetValuePrimary, targetUnitPrimary'
        });
      }

      const goalData = {
        userId: req.userId!,
        goalType,
        goalName,
        targetValuePrimary: Number(targetValuePrimary),
        targetUnitPrimary,
        targetValueSecondary: req.body.targetValueSecondary ? Number(req.body.targetValueSecondary) : null,
        targetUnitSecondary: req.body.targetUnitSecondary || null,
        isActive: true,
      };

      const newGoal = await storage.createGoalTarget(goalData);
      console.log('Goal created successfully:', newGoal);
      res.status(201).json(newGoal);
    } catch (error) {
      console.error('Create goal error:', error);
      res.status(500).json({ message: 'Failed to create goal' });
    }
  });
  console.log('✅ POST /api/goals route registered');

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
  app.get('/api/availability', async (req, res) => {
    try {
      const { username, email } = req.query as { username?: string; email?: string };
      if (!username && !email) {
        return res.status(400).json({ message: 'username or email is required' });
      }
      const result: any = {};
      if (username) {
        const user = await storage.getUserByUsername(username);
        result.usernameAvailable = !user;
      }
      if (email) {
        const user = await storage.getUserByEmail(email);
        result.emailAvailable = !user;
      }
      return res.json(result);
    } catch (err) {
      console.error('Availability check error:', err);
      return res.status(500).json({ message: 'Failed to check availability' });
    }
  });

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
      // If profileImageUrl is a storage path, generate a signed URL
      let profileImageUrl = user.profileImageUrl;
      try {
        if (profileImageUrl && !/^https?:\/\//i.test(profileImageUrl)) {
          profileImageUrl = await photoUrlService.getSignedUrl(profileImageUrl);
        }
      } catch (e) {
        // ignore signing errors and fall back to stored value
      }
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl,
        photosPin: user.photosPin,
        photosPinEnabled: user.photosPinEnabled,
        membership: user.membership,
        profile,
        goals: goals.map(g => g.goalType),
        onboardingCompleted: profile?.onboardingCompleted || false,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update basic user fields
  app.put('/api/profile/user', authenticateToken, async (req: any, res) => {
    try {
      const { firstName, lastName, username, email } = req.body || {};
      const updated = await storage.updateUser(req.userId!, {
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        username: username ?? undefined,
        email: email ?? undefined,
      });
      res.json(updated);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // Update extended profile fields
  app.put('/api/profile/profile', authenticateToken, async (req: any, res) => {
    try {
      const { gender, birthday, height, weight, bodyType } = req.body || {};
      const profileUpdate: any = {
        userId: req.userId!,
        gender: gender ?? undefined,
        height: height ?? undefined,
        weight: weight ?? undefined,
        bodyType: bodyType ?? undefined,
      };
      if (birthday) {
        try { profileUpdate.birthday = new Date(birthday); } catch {}
      }
      const updated = await storage.updateUserProfile(req.userId!, profileUpdate);
      res.json(updated);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });

  // Upload avatar and update user profileImageUrl
  app.post('/api/profile/avatar', authenticateToken, upload.single('profileImage'), async (req: any, res) => {
    try {
      const file = req.file as Express.Multer.File | undefined;
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      const userId = req.userId!;
      // Build storage path
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
      const filename = `avatar_${timestamp}_${randomSuffix}.${ext}`;
      const folder = `user_${userId}/avatar`;
      const fullPath = `${folder}/${filename}`;

      // Optionally, resize to a reasonable size
      const resized = await sharp(file.buffer)
        .resize(512, 512, { fit: 'cover' })
        .toFormat('jpeg', { quality: 85 })
        .toBuffer();

      const { error: uploadErr } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .upload(fullPath, resized, { contentType: 'image/jpeg', upsert: true });
      if (uploadErr) {
        console.error('Avatar upload error:', uploadErr);
        return res.status(500).json({ message: 'Failed to upload avatar' });
      }

      // Save storage path in DB
      await storage.updateUser(userId, { profileImageUrl: fullPath });

      // Return signed URL for immediate client use
      let signedUrl: string | undefined = undefined;
      try {
        signedUrl = await photoUrlService.getSignedUrl(fullPath);
      } catch (e) {}

      return res.json({ profileImageUrl: signedUrl || fullPath });
    } catch (error) {
      console.error('Error updating avatar:', error);
      return res.status(500).json({ message: 'Failed to update avatar' });
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

  // Get photo dates only (lightweight endpoint for journal history icons)
  app.get('/api/photos/dates', authenticateToken, async (req: any, res) => {
    try {
      const photos = await storage.getUserPhotos(req.userId!);
      console.log(`📅 Found ${photos.length} photos for user ${req.userId}, extracting dates`);
      
      // Return only essential date information, no signed URLs needed
      const photoDates = photos.map(photo => ({
        id: photo.id,
        date: photo.date,
        filename: photo.filename
      }));
      
      console.log(`📅 Returning ${photoDates.length} photo dates`);
      res.json(photoDates);
    } catch (error) {
      console.error("Error fetching photo dates:", error);
      res.status(500).json({ message: "Failed to fetch photo dates" });
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
  
  // Get sleep activities for chart (last 7 days)
  app.get('/api/activities/sleep/chart', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId!;
      
      // Get last 7 days of sleep activities
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6); // 7 days total
      
      console.log('Fetching sleep activities from', startDate.toISOString(), 'to', endDate.toISOString());
      
      const sleepActivities = await storage.getSleepActivitiesForRange(userId, startDate.toISOString(), endDate.toISOString());
      
      // Group by date and calculate total sleep hours per day
      const sleepByDate = sleepActivities.reduce((acc: Record<string, number>, activity) => {
        const date = new Date(activity.date).toISOString().split('T')[0];
        const hours = (activity.durationMinutes || 0) / 60;
        acc[date] = (acc[date] || 0) + hours;
        return acc;
      }, {});
      
      // Convert to chart format - only include days with actual sleep data
      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Only add data point if there's actual sleep logged for this day
        if (sleepByDate[dateStr] && sleepByDate[dateStr] > 0) {
          chartData.push({
            date: dateStr,
            value: sleepByDate[dateStr]
          });
        }
      }
      
      console.log('Sleep chart data:', chartData);
      res.json(chartData);
    } catch (error) {
      console.error('Error fetching sleep chart data:', error);
      res.status(500).json({ message: 'Failed to fetch sleep data' });
    }
  });

  app.get('/api/activities/date/:date', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const date = req.params.date;
      console.log(`🔍🔍🔍 DETAILED ACTIVITY QUERY DEBUG:`);
      console.log(`1. Fetching activities for userId: ${userId}`);
      console.log(`2. Requested date param: ${date}`);
      console.log(`3. typeof date param: ${typeof date}`);
      
      const activities = await storage.getActivitiesForDate(userId, date);
      
      console.log(`4. Found ${activities.length} activities total for user`);
      console.log(`5. Activities details:`, activities.map(a => ({
        id: a.id,
        activityType: a.activityType,
        date: a.date,
        dateToString: new Date(a.date).toString(),
        dateToDateString: new Date(a.date).toDateString(),
        startTime: a.startTime,
        createdAt: a.createdAt
      })));
      
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
      
      console.log('🚀🚀🚀 DETAILED SERVER Activity Creation Debug:');
      console.log('1. Raw req.body.date:', req.body.date);
      console.log('2. typeof req.body.date:', typeof req.body.date);
      
      const parsedDate = new Date(req.body.date);
      console.log('3. Parsed Date Object:', parsedDate);
      console.log('4. Parsed Date toString():', parsedDate.toString());
      console.log('5. Parsed Date toISOString():', parsedDate.toISOString());
      console.log('6. Parsed Date toDateString():', parsedDate.toDateString());
      console.log('7. Parsed Date getDate():', parsedDate.getDate());
      console.log('8. Parsed Date getMonth():', parsedDate.getMonth());
      console.log('9. Parsed Date getFullYear():', parsedDate.getFullYear());
      console.log('10. Parsed Date getTimezoneOffset():', parsedDate.getTimezoneOffset());
      
      const activityData = {
        userId,
        activityType: req.body.activityType,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
        durationMinutes: req.body.durationMinutes,
        date: parsedDate,
      };
      
      console.log('11. Processed activity data:', JSON.stringify(activityData, null, 2));
      console.log('12. Activity data date field:', activityData.date);
      console.log('13. Activity data date toString():', activityData.date.toString());
      console.log('14. Activity data date toISOString():', activityData.date.toISOString());
      
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
  // Get all macros for the user
  app.get('/api/macros', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const macros = await storage.getUserMacros(userId);
      res.json(macros);
    } catch (error) {
      console.error("Error fetching all macros:", error);
      res.status(500).json({ message: "Failed to fetch macros" });
    }
  });

  // Get macros for a specific date
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
      
      // Parse date safely to avoid timezone issues
      const dateStr = req.body.date; // "YYYY-MM-DD" format
      const [year, month, day] = dateStr.split('-').map(Number);
      const macroDate = new Date(year, month - 1, day, 12, 0, 0, 0); // Use noon to avoid timezone edge cases
      
      const macroData: any = {
        userId,
        description: req.body.description,
        protein: req.body.protein,
        fats: req.body.fats,
        carbs: req.body.carbs,
        date: macroDate,
      };
      if (req.body.calories !== undefined && req.body.calories !== null && req.body.calories !== '') {
        macroData.calories = req.body.calories;
      }
      
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

  app.put('/api/macros/:id', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const macroId = parseInt(req.params.id);
      const dateStr = req.body.date;
      const [year, month, day] = dateStr.split('-').map(Number);
      const macroDate = new Date(year, month - 1, day, 12, 0, 0, 0);
      const macroData: any = {
        userId,
        description: req.body.description,
        protein: req.body.protein,
        fats: req.body.fats,
        carbs: req.body.carbs,
        date: macroDate,
      };
      if (req.body.calories !== undefined && req.body.calories !== null && req.body.calories !== '') {
        macroData.calories = req.body.calories;
      }
      const result = insertMacroSchema.safeParse(macroData);
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid macro data', errors: result.error.errors });
      }
      const updated = await storage.updateMacro(macroId, result.data);
      res.json(updated);
    } catch (error) {
      console.error('Error updating macro:', error);
      res.status(500).json({ message: 'Failed to update macro' });
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
      
      console.log('Metrics POST request body:', req.body);
      
      const metricData = {
        userId,
        date: new Date(req.body.date),
        weight: req.body.weight ? req.body.weight.toString() : null,
        customFields: req.body.customFields ? 
          Object.fromEntries(
            Object.entries(req.body.customFields).map(([key, value]) => [key, value?.toString()])
          ) : {},
      };

      console.log('Constructed metricData:', metricData);

      const result = insertMetricsSchema.safeParse(metricData);
      if (!result.success) {
        console.log('Validation failed:', result.error.issues);
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

  // Public: Submit feedback (no authentication required)
  app.post('/api/public-feedback', async (req: any, res) => {
    const { name, email, feedback } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    if (!feedback || typeof feedback !== 'string') {
      return res.status(400).json({ message: "Feedback is required" });
    }

    if (feedback.trim().length < 10) {
      return res.status(400).json({ message: "Feedback must be at least 10 characters long" });
    }

    if (feedback.trim().length > 2000) {
      return res.status(400).json({ message: "Feedback must be less than 2000 characters" });
    }

    // Rate limiting - max 2 feedback submissions per 15 minutes per IP
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const rateLimitKey = `public_feedback_${clientIP}`;
    if (!checkRateLimit(rateLimitKey, 2)) {
      return res.status(429).json({ 
        message: "Too many feedback submissions. Please wait 15 minutes before submitting again."
      });
    }

    try {
      const subject = "Journey App - Public Feedback";
      const emailContent = `
New public feedback received from Journey website:

Name: ${name.trim()}
Email: ${email.trim()}

Feedback:
${feedback.trim()}

----
Submitted at: ${new Date().toISOString()}
IP Address: ${clientIP}
      `.trim();

      await sendEmailFn(
        process.env.SUPPORT_EMAIL || 'support@journey.app', 
        subject, 
        emailContent
      );

      console.log(`✅ Public feedback submitted by ${email.trim()}`);
      res.json({ message: "Feedback submitted successfully" });
    } catch (error) {
      console.error("Public feedback submission error:", error);
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

  console.log('🚀 CHECKPOINT: Just before debug/routes - function still executing');

  console.log('🔍 About to register debug/routes endpoint');
  // Debug route to verify route registration
  app.get('/api/debug/routes', (req, res) => {
    console.log('🧪 Debug route hit - routes are registering correctly');
    res.json({ 
      message: 'Routes are working', 
      timestamp: new Date(),
      totalRoutes: app._router ? app._router.stack.length : 'unknown'
    });
  });
  console.log('✅ debug/routes route registered');

  console.log('🔍 About to register debug/storage endpoint');
  // Test if the issue is with storage import
  app.get('/api/debug/storage', (req, res) => {
    try {
      console.log('🧪 Testing storage import');
      console.log('Storage object exists:', !!storage);
      console.log('Storage methods:', Object.getOwnPropertyNames(storage.__proto__));
      console.log('getUserGoalTargets exists:', typeof storage.getUserGoalTargets);
      
      res.json({ 
        message: 'Storage debug complete',
        storageExists: !!storage,
        hasGoalMethods: typeof storage.getUserGoalTargets === 'function'
      });
    } catch (error) {
      console.error('❌ Storage debug error:', error);
      res.status(500).json({ message: 'Storage error', error: error instanceof Error ? error.message : 'Unknown' });
    }
  });
  console.log('✅ debug/storage route registered');

  // OLD GOALS ROUTES REMOVED - MOVED TO SAFE POSITION AFTER HEALTH CHECK

  console.log('🎉 ALL ROUTES REGISTERED SUCCESSFULLY');
  const httpServer = createServer(app);
  return httpServer;
    
  } catch (error) {
    console.error('💥 CRITICAL ERROR in registerSecureRoutes:');
    console.error('Error message:', error instanceof Error ? error.message : error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error instanceof Error ? error.constructor.name : 'Unknown');
    
    // Still return a server even if routes fail, with at least the test route
    const httpServer = createServer(app);
    return httpServer;
  }
}

// Secure webhook: notify users analytics are ready
app.post('/api/analytics/notify', async (req: any, res) => {
  try {
    const auth = req.headers['authorization'] || '';
    const expected = process.env.ANALYTICS_NOTIFY_KEY ? `Bearer ${process.env.ANALYTICS_NOTIFY_KEY}` : '';
    if (!expected || auth !== expected) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { batchId, userIds } = req.body || {};
    if (!batchId || !Array.isArray(userIds)) {
      return res.status(400).json({ message: 'batchId and userIds[] are required' });
    }

    let sent = 0;
    for (const uid of userIds) {
      try {
        const user = await storage.getUser(parseInt(uid));
        if (!user?.email) continue;
        await sendEmail({
          to: user.email,
          subject: 'Journey Analytics',
          html: `<p>New analytics available.</p><p>Batch: ${batchId}</p>`,
        });
        sent++;
      } catch (e) {
        // continue
      }
    }
    return res.json({ status: 'ok', batchId, notified: sent });
  } catch (e) {
    return res.status(500).json({ message: 'notify failed' });
  }
});


