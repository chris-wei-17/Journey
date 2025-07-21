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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User profiles table for additional fitness-specific information
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  username: varchar("username").unique().notNull(),
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
  userId: varchar("user_id").notNull().references(() => users.id),
  goalType: varchar("goal_type").notNull(), // general-fitness, cardio, strength, muscle-mass, weight-loss, improve-diet
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Progress tracking table
export const progressEntries = pgTable("progress_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  goalType: varchar("goal_type").notNull(),
  progressValue: integer("progress_value").notNull(), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
});

// Photos table
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  size: integer("size").notNull(),
  uploadDate: timestamp("upload_date").defaultNow(),
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
export type User = typeof users.$inferSelect;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

export type UserGoal = typeof userGoals.$inferSelect;
export type InsertUserGoal = typeof userGoals.$inferInsert;

export type ProgressEntry = typeof progressEntries.$inferSelect;
export type InsertProgressEntry = typeof progressEntries.$inferInsert;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;

// Zod schemas for validation
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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

// Extended schemas for frontend
export const onboardingSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  gender: z.string().optional(),
  birthday: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  bodyType: z.string().optional(),
  goals: z.array(z.string()).min(1, "Please select at least one goal"),
  progress: z.record(z.string(), z.number().min(0).max(100)),
});

export type OnboardingData = z.infer<typeof onboardingSchema>;
