import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  date,
  numeric,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User storage table - updated for standard JWT authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  username: varchar("username").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(), // Store hashed passwords
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isEmailVerified: boolean("is_email_verified").default(false),
  photosPin: varchar("photos_pin"),
  photosPinEnabled: boolean("photos_pin_enabled"),
  membership: varchar("membership", { length: 20 }).notNull().default("Premium (beta)"), // Free, Ad-free, Premium, Premium (beta)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User profiles table for additional fitness-specific information
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gender: varchar("gender"),
  birthday: date("birthday"),
  height: varchar("height"),
  weight: varchar("weight"),
  bodyType: varchar("body_type"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User goals table
export const userGoals = pgTable("user_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  goalType: varchar("goal_type").notNull(), // general-fitness, cardio, strength, muscle-mass, weight-loss, improve-diet
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Progress tracking table
export const progressEntries = pgTable("progress_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  goalType: varchar("goal_type").notNull(),
  progressValue: integer("progress_value").notNull(), // 0-100
  entryDate: timestamp("entry_date").notNull().defaultNow(), // Date for the progress entry
  createdAt: timestamp("created_at").defaultNow(),
});

// Goal targets table - specific goals with target values
export const goalTargets = pgTable("goal_targets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  goalType: varchar("goal_type", { length: 100 }).notNull(), // 'sleep', 'nutrition', 'daily_move', 'custom'
  goalName: varchar("goal_name", { length: 255 }).notNull(), // Display name for the goal
  targetValuePrimary: decimal("target_value_primary", { precision: 10, scale: 2 }).notNull(), // Main value
  targetUnitPrimary: varchar("target_unit_primary", { length: 50 }).notNull(), // 'hours', 'calories', 'minutes'
  targetValueSecondary: decimal("target_value_secondary", { precision: 10, scale: 2 }), // Optional secondary value
  targetUnitSecondary: varchar("target_unit_secondary", { length: 50 }), // 'minutes', etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Goal progress tracking table
export const goalProgress = pgTable("goal_progress", {
  id: serial("id").primaryKey(),
  goalTargetId: integer("goal_target_id").notNull().references(() => goalTargets.id),
  userId: integer("user_id").notNull().references(() => users.id),
  progressDate: date("progress_date").notNull(),
  actualValuePrimary: decimal("actual_value_primary", { precision: 10, scale: 2 }).notNull(),
  actualValueSecondary: decimal("actual_value_secondary", { precision: 10, scale: 2 }),
  percentageAchieved: decimal("percentage_achieved", { precision: 5, scale: 2 }), // Calculated percentage
  createdAt: timestamp("created_at").defaultNow(),
});

// Photos table - store file paths (not URLs) for private bucket access
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  size: integer("size").notNull(),
  imagePath: varchar("image_path").notNull(), // File path in private Supabase Storage bucket
  thumbnailPath: varchar("thumbnail_path").notNull(), // Thumbnail file path in private bucket
  bucketPath: varchar("bucket_path").notNull(), // Base folder path for organization
  date: timestamp("date").notNull(), // The date this photo was taken/belongs to
  uploadDate: timestamp("upload_date").defaultNow(),
});

// Sessions table for JWT token management
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tokenHash: varchar("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  goals: many(userGoals),
  progressEntries: many(progressEntries),
  photos: many(photos),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const userGoalsRelations = relations(userGoals, ({ one }) => ({
  user: one(users, {
    fields: [userGoals.userId],
    references: [users.id],
  }),
}));

export const progressEntriesRelations = relations(progressEntries, ({ one }) => ({
  user: one(users, {
    fields: [progressEntries.userId],
    references: [users.id],
  }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  user: one(users, {
    fields: [photos.userId],
    references: [users.id],
  }),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;

// Metrics tracking table
export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  weight: numeric("weight", { precision: 5, scale: 2 }),
  customFields: jsonb("custom_fields").$type<Record<string, string>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMetricsSchema = createInsertSchema(metrics).omit({ id: true, createdAt: true });
export type InsertMetric = z.infer<typeof insertMetricsSchema>;
export type MetricEntry = typeof metrics.$inferSelect;

// Custom metric fields table
export const customMetricFields = pgTable("custom_metric_fields", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  fieldName: varchar("field_name").notNull(),
  unit: varchar("unit").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomMetricFieldSchema = createInsertSchema(customMetricFields).omit({ id: true, createdAt: true });
export type InsertCustomMetricField = z.infer<typeof insertCustomMetricFieldSchema>;
export type CustomMetricField = typeof customMetricFields.$inferSelect;

// Activities table for "My Day" tracking
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  activityType: varchar("activity_type").notNull(), // walking, running, cycling, etc.
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  durationMinutes: integer("duration_minutes"), // Duration in minutes for analytics
  date: timestamp("date").notNull(), // The day this activity belongs to
  location: varchar("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
  location: true, // Remove optional location field from validation
  notes: true,    // Remove optional notes field from validation
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Custom activities table for user-defined workout types
export const customActivities = pgTable("custom_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(), // Activity name (formatted with proper capitalization)
  category: varchar("category").notNull().default("STRAIN"), // STRAIN, RECOVERY, SLEEP
  icon: varchar("icon").default("fa-dumbbell"), // FontAwesome icon class
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomActivitySchema = createInsertSchema(customActivities).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomActivity = z.infer<typeof insertCustomActivitySchema>;
export type CustomActivity = typeof customActivities.$inferSelect;

// Macros table for nutrition tracking
export const macros = pgTable("macros", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  description: text("description").notNull(),
  protein: numeric("protein", { precision: 5, scale: 1 }).notNull().$type<string>(), // grams - stored as string
  fats: numeric("fats", { precision: 5, scale: 1 }).notNull().$type<string>(), // grams - stored as string
  carbs: numeric("carbs", { precision: 5, scale: 1 }).notNull().$type<string>(), // grams - stored as string
  calories: numeric("calories", { precision: 6, scale: 1 }).$type<string | null>(), // optional calories entry mode
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMacroSchema = createInsertSchema(macros).omit({
  id: true,
  createdAt: true,
}).extend({
  protein: z.union([z.string(), z.number()]).transform(val => String(val)),
  fats: z.union([z.string(), z.number()]).transform(val => String(val)),
  carbs: z.union([z.string(), z.number()]).transform(val => String(val)),
  calories: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => val === undefined ? undefined : (val === null ? null : String(val))),
});

export type InsertMacro = z.infer<typeof insertMacroSchema>;
export type Macro = typeof macros.$inferSelect;

// Macro targets table for nutrition goals
export const macroTargets = pgTable("macro_targets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  proteinTarget: numeric("protein_target", { precision: 5, scale: 1 }).notNull().default("0").$type<string>(), // grams - stored as string
  fatsTarget: numeric("fats_target", { precision: 5, scale: 1 }).notNull().default("0").$type<string>(), // grams - stored as string
  carbsTarget: numeric("carbs_target", { precision: 5, scale: 1 }).notNull().default("0").$type<string>(), // grams - stored as string
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMacroTargetSchema = createInsertSchema(macroTargets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  proteinTarget: z.union([z.string(), z.number()]).transform(val => String(val)),
  fatsTarget: z.union([z.string(), z.number()]).transform(val => String(val)),
  carbsTarget: z.union([z.string(), z.number()]).transform(val => String(val)),
});

export type InsertMacroTarget = z.infer<typeof insertMacroTargetSchema>;
export type MacroTarget = typeof macroTargets.$inferSelect;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

export type UserGoal = typeof userGoals.$inferSelect;
export type InsertUserGoal = typeof userGoals.$inferInsert;

export type ProgressEntry = typeof progressEntries.$inferSelect;
export type InsertProgressEntry = typeof progressEntries.$inferInsert;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;

export type GoalTarget = typeof goalTargets.$inferSelect;
export type InsertGoalTarget = typeof goalTargets.$inferInsert;

export type GoalProgress = typeof goalProgress.$inferSelect;
export type InsertGoalProgress = typeof goalProgress.$inferInsert;

// Extended types for API responses
export type UserWithProfile = User & {
  profile?: UserProfile;
  goals?: string[];
  onboardingCompleted?: boolean;
};

// Zod schemas for validation
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Remove userSessions reference - not using sessions anymore

export const insertUserGoalSchema = createInsertSchema(userGoals).omit({
  id: true,
  createdAt: true,
});

export const insertProgressEntrySchema = createInsertSchema(progressEntries).omit({
  id: true,
  createdAt: true,
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  uploadDate: true,
});

export const insertGoalTargetSchema = createInsertSchema(goalTargets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGoalProgressSchema = createInsertSchema(goalProgress).omit({
  id: true,
  createdAt: true,
});

// Authentication schemas
export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

// Extended schemas for frontend
export const onboardingSchema = z.object({
  gender: z.string().optional(),
  birthday: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  bodyType: z.string().optional(),
  goals: z.array(z.string()).min(1, "Please select at least one goal"),
  progress: z.record(z.string(), z.number().min(0).max(100)),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type OnboardingData = z.infer<typeof onboardingSchema>;

// Membership system types
export type MembershipTier = "Free" | "Ad-free" | "Premium" | "Premium (beta)";

export const membershipTiers: Record<MembershipTier, {
  name: string;
  displayName: string;
  description: string;
  features: string[];
  emoji: string;
}> = {
  "Free": {
    name: "Free",
    displayName: "🆓 Free",
    description: "Basic fitness tracking with ads",
    features: ["Basic activity tracking", "Photo uploads", "Progress charts", "Community support"],
    emoji: "🆓"
  },
  "Ad-free": {
    name: "Ad-free", 
    displayName: "🚫 Ad-free",
    description: "All free features without advertisements",
    features: ["Everything in Free", "No advertisements", "Clean interface", "Priority support"],
    emoji: "🚫"
  },
  "Premium": {
    name: "Premium",
    displayName: "⭐ Premium", 
    description: "Full access to all features",
    features: ["Everything in Ad-free", "Advanced analytics", "Custom goals", "Export data", "Premium support"],
    emoji: "⭐"
  },
  "Premium (beta)": {
    name: "Premium (beta)",
    displayName: "🧪 Premium (Beta)",
    description: "Early access to premium features", 
    features: ["All Premium features", "Beta testing access", "Early feature previews", "Direct feedback channel"],
    emoji: "🧪"
  }
};

// Helper function to check membership permissions
export function hasMembershipFeature(userMembership: MembershipTier, feature: 'ads-free' | 'premium-analytics' | 'beta-features'): boolean {
  switch (feature) {
    case 'ads-free':
      return ['Ad-free', 'Premium', 'Premium (beta)'].includes(userMembership);
    case 'premium-analytics':
      return ['Premium', 'Premium (beta)'].includes(userMembership);
    case 'beta-features':
      return userMembership === 'Premium (beta)';
    default:
      return false;
  }
}
