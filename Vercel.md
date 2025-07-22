# FitJourney - Complete Vercel Deployment Guide

This guide provides step-by-step instructions for deploying the FitJourney fitness tracking application on Vercel with a Supabase database.

## Prerequisites

Before starting, ensure you have:
- A GitHub account (for code deployment)
- A Vercel account (free tier is sufficient)
- A Supabase account (free tier is sufficient)
- Node.js 18+ installed locally (for initial setup)

## Part 1: Database Setup with Supabase

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization (or create one)
4. Fill in project details:
   - **Name**: `fitjourney-app` (or your preferred name)
   - **Database Password**: Create a strong password and save it securely
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait 2-3 minutes for project creation

### Step 2: Get Database Connection String

1. In your Supabase dashboard, click "Connect" in the top toolbar
2. Select "Connection string" → "Transaction pooler"
3. Copy the URI (it looks like: `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres`)
4. Replace `[YOUR-PASSWORD]` with the database password you created
5. Save this connection string - you'll need it for Vercel

### Step 3: Configure Database Schema

1. In Supabase dashboard, go to "SQL Editor"
2. You'll run the database schema setup after deploying to Vercel (using the `npm run db:push` command)

## Part 2: Code Preparation

### Step 1: Prepare Project for Deployment

1. Clone your project to your local machine (or ensure it's already in a Git repository)
2. Create a `vercel.json` configuration file in the project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["dist/**", "uploads/**"]
      }
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/public"
      }
    }
  ],
  "routes": [
    {
      "src": "/uploads/(.*)",
      "dest": "/uploads/$1"
    },
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/public/$1"
    }
  ],
  "functions": {
    "server/index.ts": {
      "maxDuration": 30
    }
  }
}
```

### Step 2: Update Package.json for Vercel

Update your `package.json` scripts section:

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --target=node18",
    "start": "NODE_ENV=production node dist/index.js",
    "vercel-build": "npm run build",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  }
}
```

### Step 3: Create Environment Configuration

Create a `.env.example` file with required environment variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long

# Application Configuration
NODE_ENV=production
```

### Step 4: Update Vite Config for Production

Ensure your `vite.config.ts` excludes Replit-specific plugins in production:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    // Remove Replit-specific plugins for Vercel deployment
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
```

## Part 3: Vercel Deployment

### Step 1: Push Code to GitHub

1. Create a new repository on GitHub
2. Push your code to the repository:

```bash
git init
git add .
git commit -m "Initial commit for Vercel deployment"
git remote add origin https://github.com/yourusername/fitjourney-app.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Other
   - **Root Directory**: `.` (leave as root)
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

### Step 3: Configure Environment Variables

In Vercel project settings → Environment Variables, add:

1. **DATABASE_URL**
   - Value: Your Supabase connection string from Step 2 above
   - Environment: Production, Preview, Development

2. **JWT_SECRET**
   - Value: Generate a secure random string (32+ characters)
   - Use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Environment: Production, Preview, Development

3. **NODE_ENV**
   - Value: `production`
   - Environment: Production

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build completion (2-5 minutes)
3. Your app will be available at `https://your-project-name.vercel.app`

## Part 4: Post-Deployment Setup

### Step 1: Initialize Database Schema

1. In Vercel dashboard, go to your project → Functions
2. Go to your deployment URL and add `/api/health` to test the backend
3. Run database migration by accessing the Vercel CLI or using the following method:

**Method 1: Using Vercel CLI (Recommended)**
```bash
npm install -g vercel
vercel login
vercel link
vercel env pull .env.local
npm run db:push
```

**Method 2: Manual SQL in Supabase**
If you can't use Vercel CLI, go to Supabase SQL Editor and run the schema manually by copying the schema definitions from `shared/schema.ts` and converting them to SQL.

### Step 2: Test Application Features

1. Visit your deployed application
2. Test user registration and login
3. Complete the onboarding process
4. Test photo uploads (they will be stored locally on Vercel's serverless functions)
5. Test progress tracking and goals

### Step 3: Configure Custom Domain (Optional)

1. In Vercel project settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning

## Part 5: Monitoring and Maintenance

### Performance Monitoring

1. **Vercel Analytics**: Enable in project settings
2. **Supabase Monitoring**: Monitor database performance in Supabase dashboard
3. **Error Tracking**: Check Vercel Function logs for errors

### Regular Maintenance

1. **Database Backups**: Supabase automatically handles backups
2. **Security Updates**: Keep dependencies updated
3. **Monitor Usage**: Check Vercel and Supabase usage to avoid limits

### Scaling Considerations

**Free Tier Limits:**
- Vercel: 100GB bandwidth, 100GB-hr compute time
- Supabase: 500MB database, 2GB bandwidth

**When to Upgrade:**
- High user traffic (upgrade Vercel Pro)
- Large database needs (upgrade Supabase Pro)
- Need for advanced analytics

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in `dependencies` not `devDependencies`
   - Check build logs in Vercel dashboard

2. **Database Connection Issues**
   - Verify DATABASE_URL environment variable
   - Check Supabase project status
   - Ensure connection string includes correct password

3. **API Errors**
   - Check Function logs in Vercel
   - Verify JWT_SECRET is set correctly
   - Test API endpoints individually

4. **Photo Upload Issues**
   - Note: Vercel's serverless functions have limited file storage
   - Consider using Supabase Storage or Cloudinary for production photo storage

### Getting Help

1. **Vercel Support**: Check Vercel documentation and community forums
2. **Supabase Support**: Use Supabase documentation and Discord community
3. **Application Issues**: Check browser console and Vercel Function logs

## Security Checklist

- [ ] JWT_SECRET is properly set and secure (32+ characters)
- [ ] Database connection uses SSL (Supabase default)
- [ ] Environment variables are not exposed to client
- [ ] API endpoints have proper authentication
- [ ] Photo access is restricted to authorized users
- [ ] Input validation is in place for all forms

## Performance Optimization

1. **Frontend**
   - React Query caching is already implemented
   - Consider implementing service workers for offline functionality
   - Optimize images using Vercel's image optimization

2. **Backend**
   - Database queries are optimized with Drizzle ORM
   - Consider implementing rate limiting for production
   - Monitor function execution time in Vercel dashboard

3. **Database**
   - Supabase provides automatic query optimization
   - Monitor slow queries in Supabase dashboard
   - Consider adding database indexes for frequently queried fields

## Backup and Disaster Recovery

1. **Code**: Stored in GitHub with version history
2. **Database**: Supabase provides automatic daily backups
3. **Environment Variables**: Document and store securely
4. **Uploaded Files**: Consider implementing cloud storage backup

---

## Quick Reference

**Important URLs:**
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard
- Your App: https://your-project-name.vercel.app

**Key Commands:**
- Deploy: `git push` (triggers auto-deploy)
- Database Push: `npm run db:push`
- Local Development: `npm run dev`
- Build: `npm run build`

**Support:**
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Project Issues: Check Function logs in Vercel dashboard

This deployment guide ensures your FitJourney application runs reliably on Vercel with Supabase, providing a scalable foundation for your fitness tracking app.