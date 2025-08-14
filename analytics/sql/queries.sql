-- User profile metadata
-- Expected columns: user_id, username, email, gender, birthday, height, weight, created_at
SELECT u.id AS user_id,
       u.username,
       u.email,
       up.gender,
       up.birthday,
       up.height,
       up.weight,
       u.created_at
FROM users u
LEFT JOIN user_profiles up ON up.user_id = u.id;

-- Time series: activities (exercise)
-- Expected columns: user_id, activity_type, date, start_time, end_time, duration_minutes
SELECT a.user_id,
       a.activity_type,
       a.date,
       a.start_time,
       a.end_time,
       a.duration_minutes
FROM activities a;

-- Time series: macros/nutrition
-- Expected columns: user_id, date, protein, fats, carbs, calories
SELECT m.user_id,
       m.date,
       m.protein,
       m.fats,
       m.carbs,
       m.calories
FROM macros m;

-- Time series: metrics (e.g., weight)
-- Expected columns: user_id, date, weight
SELECT me.user_id,
       me.date,
       me.weight
FROM metrics me;

-- Derived metrics example: BMI (if weight and height available)
-- This is a placeholder; compute in Python for better unit handling.