// Main Vercel API handler - handles all API routes
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express, { type Request, Response, NextFunction } from "express";

// Import only what we need for API routes, avoiding Vite dependencies
const app = express();

// Simple logging function
function log(message: string, source = "api") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({
  verify: (req: any, _res, buf) => {
    try {
      req.rawBody = buf;
    } catch {}
  }
}));
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize routes without Vite dependencies
let routesInitialized = false;
async function initializeRoutes() {
  if (routesInitialized) {
    console.log('🔄 Routes already initialized');
    return;
  }
  
  try {
    console.log('📥 Importing secure-routes...');
    const { registerSecureRoutes } = await import("../server/secure-routes.js");
    console.log('✅ Secure-routes imported successfully');
    
    console.log('🔧 Registering routes...');
    await registerSecureRoutes(app);
    console.log('✅ Routes registered successfully');
    
    // Debug: Log registered routes
    console.log('📋 Total registered routes:', app._router ? app._router.stack.length : 'No router');
    if (app._router && app._router.stack.length > 0) {
      console.log('🛤️  First few routes:');
      app._router.stack.slice(0, 5).forEach((layer: any, index: number) => {
        if (layer.route) {
          console.log(`  ${index + 1}. ${Object.keys(layer.route.methods)[0]?.toUpperCase()} ${layer.route.path}`);
        }
      });
    }
    
    routesInitialized = true;
  } catch (error) {
    console.error('❌ Route initialization failed:', error);
    console.error('Error details:', error instanceof Error ? error.stack : 'No stack trace');
    throw error; // Re-throw to prevent silent failures
  }
}

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error('Express error:', err);
});

export default async function(req: VercelRequest, res: VercelResponse) {
  try {
    // Log for debugging
    console.log('=== Vercel API Handler ===');
    console.log('Original URL:', req.url);
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', req.body);
    
    // Set CORS headers for all API requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request');
      return res.status(200).end();
    }
    
    // Ensure URL starts with /api for proper routing
    if (req.url && !req.url.startsWith('/api')) {
      req.url = `/api${req.url}`;
    }
    
    console.log('Final URL:', req.url);
    console.log('Initializing routes...');
    
    // Initialize routes on first request
    await initializeRoutes();
    
    console.log('Calling Express handler...');
    
    // Call the Express app handler with proper promise handling
    return new Promise((resolve, reject) => {
      app(req, res, (err: any) => {
        if (err) {
          console.error('Express handler error:', err);
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });
    
  } catch (error) {
    console.error('Vercel API Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Only send response if not already sent
    if (!res.headersSent) {
      return res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}