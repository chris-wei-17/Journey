import express, { type Request, Response, NextFunction } from "express";
import { registerSecureRoutes } from "./secure-routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// CORS middleware - Allow all origins for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// Initialize the app for both development and production
async function initializeApp() {
  const server = await registerSecureRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup static serving for production (skip on Vercel)
  if (app.get("env") !== "development" && !process.env.VERCEL) {
    serveStatic(app);
  }

  return { app, server };
}

// For development (local running)
if (process.env.NODE_ENV === "development") {
  (async () => {
    const { app: devApp, server } = await initializeApp();
    
    // Setup Vite in development
    await setupVite(devApp, server);
    
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  })();
}

// For production (Vercel) - cache the initialized app
let prodApp: any = null;

export default async function handler(req: any, res: any) {
  if (!prodApp) {
    const { app } = await initializeApp();
    prodApp = app;
  }
  return prodApp(req, res);
}
