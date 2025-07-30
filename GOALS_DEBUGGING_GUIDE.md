# Goals API Debugging Guide

## 🐛 Current Issue: 404 Error on GET/POST /api/goals

The goals API endpoints are returning 404 errors. Here's how to diagnose and fix this:

## 🔍 **Diagnosis Steps:**

### 1. **Database Tables**
The most likely issue is that the `goal_targets` and `goal_progress` tables don't exist in your database.

**Check if tables exist:**
```sql
-- Run this in your Supabase SQL editor or database client
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('goal_targets', 'goal_progress');
```

### 2. **Create Tables Manually**
If tables are missing, run this SQL in Supabase:

```sql
-- Create goal_targets table
CREATE TABLE IF NOT EXISTS goal_targets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_type VARCHAR(100) NOT NULL,
  goal_name VARCHAR(255) NOT NULL,
  target_value_primary DECIMAL(10,2) NOT NULL,
  target_unit_primary VARCHAR(50) NOT NULL,
  target_value_secondary DECIMAL(10,2),
  target_unit_secondary VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create goal_progress table
CREATE TABLE IF NOT EXISTS goal_progress (
  id SERIAL PRIMARY KEY,
  goal_target_id INTEGER NOT NULL REFERENCES goal_targets(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  progress_date DATE NOT NULL,
  actual_value_primary DECIMAL(10,2) NOT NULL,
  actual_value_secondary DECIMAL(10,2),
  percentage_achieved DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_goal_targets_user_id ON goal_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_targets_user_active ON goal_targets(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_goal_progress_goal_id ON goal_progress(goal_target_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_user_date ON goal_progress(user_id, progress_date);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_goal_targets_user_type_unique 
ON goal_targets(user_id, goal_type) 
WHERE is_active = true;
```

### 3. **Server Logs**
Check your server deployment logs (Vercel/Railway/etc) for:
- `GET /api/goals` requests
- `POST /api/goals` requests  
- Any compilation errors
- Database connection errors

## 🧪 **Testing Steps:**

### 1. **Test API Endpoints**
After creating tables, test with curl or Postman:

```bash
# Get goals (should return empty array)
curl -X GET "https://your-app.vercel.app/api/goals" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# Create a goal
curl -X POST "https://your-app.vercel.app/api/goals" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "goalType": "sleep",
    "goalName": "Sleep Goal",
    "targetValuePrimary": 8,
    "targetUnitPrimary": "hours",
    "targetValueSecondary": 30,
    "targetUnitSecondary": "minutes"
  }'
```

### 2. **Get Auth Token**
To get an auth token for testing:
1. Login to your app in browser
2. Open Developer Tools → Application → Local Storage
3. Copy the `authToken` value
4. Use it in the Authorization header: `Bearer YOUR_TOKEN`

### 3. **Expected Responses**

**GET /api/goals** (empty):
```json
[]
```

**POST /api/goals** (success):
```json
{
  "id": 1,
  "userId": 1,
  "goalType": "sleep",
  "goalName": "Sleep Goal",
  "targetValuePrimary": "8.00",
  "targetUnitPrimary": "hours",
  "targetValueSecondary": "30.00",
  "targetUnitSecondary": "minutes",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 **Common Fixes:**

### 1. **Redeploy After Schema Changes**
After adding database tables:
```bash
git add .
git commit -m "Fix: Add goal tables to database"
git push origin main
```

### 2. **Verify Deployment**
- Check that new code is deployed
- Verify environment variables are set
- Check build logs for errors

### 3. **Database Connection**
Ensure your `DATABASE_URL` environment variable is correctly set in your deployment platform.

## 🎯 **Test Data for Manual Testing:**

### Sleep Goal:
```json
{
  "goalType": "sleep",
  "goalName": "Daily Sleep Goal",
  "targetValuePrimary": 8,
  "targetUnitPrimary": "hours",
  "targetValueSecondary": 30,
  "targetUnitSecondary": "minutes"
}
```

### Nutrition Goal:
```json
{
  "goalType": "nutrition", 
  "goalName": "Daily Calorie Goal",
  "targetValuePrimary": 2000,
  "targetUnitPrimary": "calories"
}
```

### Daily Move Goal:
```json
{
  "goalType": "daily_move",
  "goalName": "Daily Movement Goal", 
  "targetValuePrimary": 1,
  "targetUnitPrimary": "hours",
  "targetValueSecondary": 30,
  "targetUnitSecondary": "minutes"
}
```

## ✅ **Success Indicators:**

1. **GET /api/goals** returns `[]` (empty array) instead of 404
2. **POST /api/goals** returns goal object with ID instead of 404/error
3. Goals appear in the app UI at `/goals` 
4. "Add New Goal" button works without errors
5. Created goals display with correct values and icons

## 🚨 **If Still Not Working:**

1. **Check Server Logs**: Look for specific error messages
2. **Verify Tables**: Ensure tables were created with correct schema
3. **Test Database**: Try creating a goal directly in database
4. **Clear Cache**: Clear browser cache and redeploy
5. **Check Routes**: Verify API routes are properly registered

The most common cause is missing database tables. Creating them manually should resolve the 404 errors.