# FitJourney - Fitness Tracking App

A comprehensive fitness tracking application built with React, Express, and PostgreSQL.

## 🚀 Quick Start

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `NODE_ENV`: Set to "production" for production builds

### Development

```bash
npm install
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## 📦 Deployment

### Vercel Deployment

1. **Database Setup**: Create a PostgreSQL database (recommended: Supabase or Neon)

2. **Environment Variables**: Set the following in your Vercel project:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A secure random string for JWT signing
   - `NODE_ENV`: Set to "production"

3. **Deploy**: Connect your GitHub repository to Vercel

4. **Database Migration**: After deployment, run:
   ```bash
   npm run db:push
   ```

### Platform-Agnostic Fixes Applied

This version includes fixes for common deployment issues:

- ✅ **Node.js Compatibility**: Replaced `import.meta.dirname` with cross-platform equivalent
- ✅ **API Routing**: Fixed Vercel serverless function routing
- ✅ **CORS Configuration**: Proper CORS headers for all environments
- ✅ **Static File Serving**: SPA fallback routing for client-side navigation
- ✅ **Database Connections**: WebSocket fallback for serverless environments
- ✅ **Build Configuration**: Optimized for both development and production

### Troubleshooting

If you encounter 405 errors (Method Not Allowed):

1. **Test the API routing**: Check `https://yourdomain.com/api/health` (GET request)
2. **Test POST functionality**: Try `https://yourdomain.com/api/test` with a POST request
3. **Check the logs**: Look at the Vercel function logs for detailed error information
4. **Verify environment variables**: Ensure all required environment variables are set

If you encounter other issues:

1. Check the health endpoint: `https://yourdomain.com/api/health`
2. Verify environment variables are set correctly
3. Ensure database is accessible from your deployment platform
4. Check the browser console and network tab for detailed error messages

### Debug Endpoints

The following endpoints are available for debugging:

- `GET /api/health` - Health check and environment info
- `POST /api/test` - Simple POST test to verify routing works

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based
- **Deployment**: Vercel-ready with serverless functions

## 📝 API Endpoints

- `GET /api/health` - Health check
- `POST /api/register` - User registration
- `POST /api/login` - User authentication
- `GET /api/user` - Get current user (protected)
- `POST /api/onboarding/complete` - Complete user onboarding (protected)

## 🔧 Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run vercel-build` - Vercel-specific build
- `npm run db:push` - Push database schema changes
- `npm run check` - TypeScript type checking