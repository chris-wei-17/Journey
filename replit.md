# FitJourney - Fitness Tracking Application

## Overview

FitJourney is a full-stack fitness tracking application built with React (frontend) and Express.js (backend). The application allows users to track their fitness progress, set goals, upload photos, and monitor their journey through an intuitive mobile-first interface. It features Replit authentication integration and uses PostgreSQL with Drizzle ORM for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS with shadcn/ui components for consistent design
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Connection**: Neon serverless database with connection pooling
- **Authentication**: Replit OpenID Connect (OIDC) with Passport.js
- **Session Management**: Express sessions with PostgreSQL storage
- **File Uploads**: Multer for handling image uploads

### Design System
- **Component Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom color variables
- **Theme**: "New York" style variant with neutral base colors
- **Icons**: Font Awesome and Lucide React icons

## Key Components

### Authentication System
- **Provider**: Replit OIDC authentication
- **Session Storage**: PostgreSQL-backed sessions with 1-week TTL
- **User Management**: Automatic user creation/update on login
- **Protected Routes**: Middleware-based route protection

### Database Schema
- **Users Table**: Core user information (required for Replit Auth)
- **User Profiles**: Extended fitness-specific user data
- **User Goals**: Fitness goals tracking
- **Progress Entries**: Timestamped progress measurements
- **Photos**: Image uploads with metadata
- **Sessions**: Authentication session storage

### File Upload System
- **Storage**: Local filesystem with configurable upload directory
- **Validation**: Image file type validation with 5MB size limit
- **Security**: File type filtering and size restrictions

### UI Components
- **Onboarding Flow**: Multi-step user profile creation
- **Progress Tracking**: Goal-based progress entry with sliders
- **Photo Gallery**: Image upload and display functionality
- **Mobile-First Design**: Responsive layout optimized for mobile devices

## Data Flow

### User Authentication Flow
1. User accesses application
2. Redirected to Replit OIDC for authentication
3. User data stored/updated in database
4. Session created with PostgreSQL storage
5. User redirected to appropriate page based on onboarding status

### Onboarding Flow
1. Profile creation (username, demographics, body metrics)
2. Goal selection (fitness objectives)
3. Initial progress entry with photo uploads
4. Completion triggers onboarding flag update

### Progress Tracking Flow
1. User submits progress data for selected goals
2. Data validated and stored with timestamps
3. Photos processed and stored with metadata
4. UI updated with new progress information

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless database hosting
- **Connection**: Environment variable `DATABASE_URL` required

### Authentication
- **Replit OIDC**: Integrated authentication service
- **Required Environment Variables**:
  - `REPLIT_DOMAINS`: Allowed domains for authentication
  - `SESSION_SECRET`: Session encryption secret
  - `ISSUER_URL`: OIDC issuer URL (defaults to Replit)
  - `REPL_ID`: Replit application identifier

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Font Awesome**: Icon library for UI elements

## Deployment Strategy

### Development
- **Dev Server**: Vite development server with HMR
- **Backend**: tsx for TypeScript execution
- **Database**: Drizzle Kit for schema management and migrations

### Production Build
- **Frontend**: Vite build process generating static assets
- **Backend**: esbuild bundling for Node.js deployment
- **Assets**: Static files served from dist/public directory

### Environment Configuration
- **Development**: NODE_ENV=development with Vite middleware
- **Production**: NODE_ENV=production with static file serving
- **Database**: Automatic migration support with Drizzle Kit

### Replit Integration
- **Development Tools**: Cartographer plugin for Replit environment
- **Error Handling**: Runtime error overlay for development
- **Banner**: Development mode indicators for external access

The application follows a monorepo structure with shared types and schemas, enabling type safety across the full stack while maintaining clear separation between client and server concerns.

## Recent Changes

### July 21, 2025
- Implemented "My Day" activity tracking functionality
- Created activity selection flow with comprehensive activity list (walking, running, cycling, etc.)
- Added activity creation page with time selection (start/end times)
- Removed location and date fields - date auto-populates from selected calendar date
- Added X button to activity creation page for easy dismissal
- Fixed activity schema validation by removing optional fields from validation
- Enhanced debug logging for activity creation to identify backend errors
- Database connection confirmed working properly

## Current Issues
- Activity creation still failing despite schema fixes and database connectivity
- Debug logs added to identify exact error in activity creation flow
- Issue appears to be in backend validation or storage layer