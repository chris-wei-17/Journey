# Custom Activities Implementation

## Overview
This implementation adds support for user-defined custom activities in the Journey fitness app. Users can now add their own workout activities that will persist across sessions and be available in the activity selection list.

## Features Implemented

### 1. Database Schema
- **New Table**: `custom_activities`
  - `id`: Primary key
  - `user_id`: Foreign key to users table
  - `name`: Activity name (automatically formatted with proper capitalization)
  - `category`: Activity category (STRAIN, RECOVERY, SLEEP)
  - `icon`: FontAwesome icon class (defaults to 'fa-dumbbell')
  - `created_at`: Timestamp
  - **Unique constraint**: Prevents duplicate activity names per user

### 2. API Endpoints
- `GET /api/custom-activities` - Fetch user's custom activities
- `POST /api/custom-activities` - Create new custom activity
- `DELETE /api/custom-activities/:id` - Delete custom activity

### 3. Frontend Features
- **Recent Activities Display**:
  - Shows 3 most recent activities by default (starts with walking, running, cycling)
  - Updates recent list when activities are selected
  - Cached for quick loading
  
- **Smart Search with Add Option**:
  - Real-time search through all available activities
  - When searching, shows "Add [SEARCH TERM] to activities" with ADD button
  - Search term updates dynamically with every keystroke
  - Custom activities are marked with "Custom" label
  
- **Smart Activity Input**:
  - Automatic formatting to ALL CAPS
  - Duplicate prevention
  - Category assignment based on selected filter

- **Caching System**:
  - Custom activities cached in localStorage for 24 hours
  - Cache invalidation on new activity creation
  - Graceful fallback to API if cache fails

### 4. Updated Add Activity Page
- Seamlessly integrates custom activities with default ones
- Proper activity type handling for database storage
- Maintains existing functionality for default activities

## Files Modified

### Backend
1. `shared/schema.ts` - Added custom activities table definition and types
2. `server/storage.ts` - Added custom activity CRUD operations with automatic name formatting
3. `server/secure-routes.ts` - Added API endpoints with duplicate prevention

### Frontend
4. `client/src/pages/select-activity.tsx` - Complete rewrite with custom activity support
5. `client/src/pages/add-activity.tsx` - Updated to handle custom activities

### Database
6. `supabase-setup.sql` - Added custom_activities table creation
7. `supabase-migration-custom-activities.sql` - Standalone migration file

## Setup Instructions

### 1. Database Setup
Run the following SQL in your database to create the custom_activities table:

```sql
-- Custom Activities Table for user-defined workout activities
CREATE TABLE IF NOT EXISTS custom_activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  category VARCHAR NOT NULL DEFAULT 'STRAIN',
  icon VARCHAR DEFAULT 'fa-dumbbell',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name) -- Prevent duplicate activity names per user
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_custom_activities_user_id ON custom_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_activities_name ON custom_activities(name);

-- Enable RLS on custom_activities table
ALTER TABLE custom_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for custom_activities - users can only see their own
CREATE POLICY custom_activities_user_policy ON custom_activities
  FOR ALL USING (auth.uid()::text = user_id::text);
```

### 2. Alternative Setup Methods

#### Method A: Using the updated supabase-setup.sql
The main setup file has been updated to include the custom_activities table. If setting up from scratch, just run the complete `supabase-setup.sql` file.

#### Method B: Using the migration file
Run the standalone migration file: `supabase-migration-custom-activities.sql`

#### Method C: Using Drizzle Kit (if DATABASE_URL is available)
```bash
npm install drizzle-kit --save-dev
npx drizzle-kit push
```

## How It Works

### User Flow
1. User navigates to "Select Activity" page
2. User sees 3 most recent activities (initially: Walking, Running, Cycling)
3. User can search for activities (searches through all available activities)
4. When typing, if search doesn't match existing activities, "Add [SEARCH TERM] to activities" appears with ADD button
5. User clicks ADD button to create custom activity
6. Activity is saved to database in ALL CAPS format
7. Activity is added to recent activities list and appears immediately
8. Custom activity is available in future sessions and search results

### Technical Flow
1. **Page Load**: 
   - Loads recent activities from cache (or defaults)
   - Fetches custom activities from cache/API
2. **No Search**: Shows recent activities filtered by category
3. **With Search**: Searches through all available activities
4. **Add Activity**: 
   - Validates search input
   - Checks for duplicates
   - Formats name to ALL CAPS
   - Saves to database
   - Updates recent activities cache (adds to front)
   - Updates custom activities cache
   - Provides immediate feedback
5. **Activity Selection**: Updates recent activities and navigates to add-activity page

## Error Handling
- Duplicate activity names are prevented with user-friendly error messages
- Cache corruption is handled gracefully with automatic cleanup
- API failures show appropriate error messages
- Input validation prevents empty or invalid activity names

## Performance Optimizations
- **Caching**: 24-hour localStorage cache reduces API calls
- **Database Indexes**: Optimized queries for user_id and name
- **Unique Constraints**: Database-level duplicate prevention
- **RLS Policies**: Secure, user-specific data access

## Security Features
- **Row Level Security**: Users can only access their own custom activities
- **Input Sanitization**: Activity names are properly formatted and validated
- **Duplicate Prevention**: Both frontend and backend validation
- **User Authentication**: All endpoints require valid authentication

## Future Enhancements
- Custom activity icons selection
- Activity categories management
- Export/import custom activities
- Activity usage statistics
- Sharing custom activities between users

## Testing
To test the implementation:
1. Ensure database table is created
2. Start the development server
3. Navigate to the Select Activity page
4. Try searching for a non-existent activity
5. Add the custom activity using the quick-add or manual form
6. Verify the activity appears in the list
7. Test that the activity persists after page refresh
8. Verify the activity works in the Add Activity flow

## Notes
- Custom activities are stored in ALL CAPS in the database
- Recent activities list maintains the 3 most recently used activities
- The search is case-insensitive
- Both recent activities and custom activities caches expire after 24 hours
- All custom activities default to the 'STRAIN' category unless specified otherwise
- When a user selects an activity, it moves to the front of the recent activities list