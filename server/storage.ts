import {
  users,
  userProfiles,
  userGoals,
  progressEntries,
  photos,
  type User,
  type InsertUser,
  type UserProfile,
  type InsertUserProfile,
  type UserGoal,
  type InsertUserGoal,
  type ProgressEntry,
  type InsertProgressEntry,
  type Photo,
  type InsertPhoto,
  activities,
  type Activity,
  type InsertActivity,
  customActivities,
  type CustomActivity,
  type InsertCustomActivity,
  macros,
  type Macro,
  type InsertMacro,
  macroTargets,
  type MacroTarget,
  type InsertMacroTarget,
  metrics,
  type MetricEntry,
  type InsertMetric,
  customMetricFields,
  type CustomMetricField,
  type InsertCustomMetricField,
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, or, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations - secure authentication
  getUser(id: number): Promise<User | undefined>;
  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, 'id'>): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  
  // Profile operations
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<UserProfile>;
  
  // Goal operations
  getUserGoals(userId: number): Promise<UserGoal[]>;
  createUserGoal(goal: InsertUserGoal): Promise<UserGoal>;
  deleteUserGoals(userId: number): Promise<void>;
  
  // Progress operations
  getUserProgress(userId: number): Promise<ProgressEntry[]>;
  getProgressEntriesForDate(userId: number, date: string): Promise<ProgressEntry[]>;
  createProgressEntry(entry: InsertProgressEntry): Promise<ProgressEntry>;
  getLatestProgressByGoal(userId: number, goalType: string): Promise<ProgressEntry | undefined>;
  
  // Photo operations
  getUserPhotos(userId: number): Promise<Photo[]>;
  getPhotosByDate(userId: number, date: string): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  deletePhoto(id: number, userId: number): Promise<void>;

  // Activity operations
  getUserActivities(userId: number): Promise<Activity[]>;
  getActivitiesForDate(userId: number, date: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, activity: InsertActivity): Promise<Activity>;
  deleteActivity(id: number, userId: number): Promise<void>;

  // Custom activity operations
  getUserCustomActivities(userId: number): Promise<CustomActivity[]>;
  createCustomActivity(activity: InsertCustomActivity): Promise<CustomActivity>;
  deleteCustomActivity(id: number, userId: number): Promise<void>;

  // Macro operations
  getUserMacros(userId: number): Promise<Macro[]>;
  getMacrosForDate(userId: number, date: string): Promise<Macro[]>;
  createMacro(macro: InsertMacro): Promise<Macro>;
  deleteMacro(id: number, userId: number): Promise<void>;

  // Macro target operations
  getMacroTargets(userId: number): Promise<MacroTarget | undefined>;
  upsertMacroTargets(targets: InsertMacroTarget): Promise<MacroTarget>;
  
  // Metrics operations
  getMetricsByDate(userId: number, date: string): Promise<MetricEntry[]>;
  createOrUpdateMetric(data: InsertMetric): Promise<MetricEntry>;
  
  // Custom metric fields operations
  getCustomMetricFields(userId: number): Promise<CustomMetricField[]>;
  createCustomMetricField(data: InsertCustomMetricField): Promise<CustomMetricField>;
  deleteCustomMetricField(fieldId: number, userId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations - secure authentication
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.username, usernameOrEmail), eq(users.email, usernameOrEmail)));
    return user;
  }

  async createUser(userData: Omit<InsertUser, 'id'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Profile operations
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db
      .insert(userProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateUserProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    const [updatedProfile] = await db
      .update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updatedProfile;
  }

  // Goal operations
  async getUserGoals(userId: number): Promise<UserGoal[]> {
    return await db
      .select()
      .from(userGoals)
      .where(and(eq(userGoals.userId, userId), eq(userGoals.isActive, true)));
  }

  async createUserGoal(goal: InsertUserGoal): Promise<UserGoal> {
    const [newGoal] = await db
      .insert(userGoals)
      .values(goal)
      .returning();
    return newGoal;
  }

  async deleteUserGoals(userId: number): Promise<void> {
    await db
      .update(userGoals)
      .set({ isActive: false })
      .where(eq(userGoals.userId, userId));
  }

  // Progress operations
  async getUserProgress(userId: number): Promise<ProgressEntry[]> {
    return await db
      .select()
      .from(progressEntries)
      .where(eq(progressEntries.userId, userId));
  }

  async getProgressEntriesForDate(userId: number, date: string): Promise<ProgressEntry[]> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
    
    const entries = await db
      .select()
      .from(progressEntries)
      .where(
        and(
          eq(progressEntries.userId, userId),
          sql`DATE(${progressEntries.entryDate}) = DATE(${targetDate.toISOString().split('T')[0]})`
        )
      )
      .orderBy(progressEntries.entryDate);
    return entries;
  }

  async createProgressEntry(entry: InsertProgressEntry): Promise<ProgressEntry> {
    const [newEntry] = await db
      .insert(progressEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async getLatestProgressByGoal(userId: number, goalType: string): Promise<ProgressEntry | undefined> {
    const [entry] = await db
      .select()
      .from(progressEntries)
      .where(and(
        eq(progressEntries.userId, userId),
        eq(progressEntries.goalType, goalType)
      ))
      .orderBy(progressEntries.createdAt)
      .limit(1);
    return entry;
  }

  // Photo operations
  async getUserPhotos(userId: number): Promise<Photo[]> {
    return await db
      .select()
      .from(photos)
      .where(eq(photos.userId, userId))
      .orderBy(photos.uploadDate);
  }

  async getPhotosByDate(userId: number, date: string): Promise<Photo[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(photos)
      .where(
        and(
          eq(photos.userId, userId),
          sql`${photos.date} >= ${startOfDay} AND ${photos.date} <= ${endOfDay}`
        )
      )
      .orderBy(photos.uploadDate);
  }

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const [newPhoto] = await db
      .insert(photos)
      .values(photo)
      .returning();
    return newPhoto;
  }

  async deletePhoto(id: number, userId: number): Promise<void> {
    await db
      .delete(photos)
      .where(and(eq(photos.id, id), eq(photos.userId, userId)));
  }

  // Activity operations
  async getUserActivities(userId: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(activities.date);
  }

  async getActivitiesForDate(userId: number, date: string): Promise<Activity[]> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
    
    return await db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          sql`DATE(${activities.date}) = DATE(${targetDate.toISOString().split('T')[0]})`
        )
      )
      .orderBy(activities.startTime);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    console.log('Storage createActivity called with:', activity);
    const [newActivity] = await db
      .insert(activities)
      .values({
        ...activity,
        location: null, // Set optional fields to null
        notes: null,
      })
      .returning();
    console.log('Storage created activity:', newActivity);
    return newActivity;
  }

  async updateActivity(id: number, activity: InsertActivity): Promise<Activity> {
    console.log('Storage updateActivity called with id:', id, 'activity:', activity);
    const [updatedActivity] = await db
      .update(activities)
      .set({
        activityType: activity.activityType,
        startTime: activity.startTime,
        endTime: activity.endTime,
        date: activity.date,
        location: null, // Set optional fields to null
        notes: null,
      })
      .where(and(eq(activities.id, id), eq(activities.userId, activity.userId)))
      .returning();
    console.log('Storage updated activity:', updatedActivity);
    return updatedActivity;
  }

  async deleteActivity(id: number, userId: number): Promise<void> {
    await db
      .delete(activities)
      .where(and(eq(activities.id, id), eq(activities.userId, userId)));
  }

  // Custom activity operations
  async getUserCustomActivities(userId: number): Promise<CustomActivity[]> {
    return await db
      .select()
      .from(customActivities)
      .where(eq(customActivities.userId, userId))
      .orderBy(customActivities.name);
  }

  async createCustomActivity(activity: InsertCustomActivity): Promise<CustomActivity> {
    // Format the name to all caps
    const formattedName = activity.name.trim().toUpperCase();

    const [newActivity] = await db
      .insert(customActivities)
      .values({
        ...activity,
        name: formattedName,
      })
      .returning();
    return newActivity;
  }

  async deleteCustomActivity(id: number, userId: number): Promise<void> {
    await db
      .delete(customActivities)
      .where(and(eq(customActivities.id, id), eq(customActivities.userId, userId)));
  }

  // Macro operations
  async getUserMacros(userId: number): Promise<Macro[]> {
    return await db
      .select()
      .from(macros)
      .where(eq(macros.userId, userId))
      .orderBy(macros.createdAt);
  }

  async getMacrosForDate(userId: number, date: string): Promise<Macro[]> {
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    return await db
      .select()
      .from(macros)
      .where(
        and(
          eq(macros.userId, userId),
          sql`${macros.date} >= ${targetDate}`,
          sql`${macros.date} < ${nextDay}`
        )
      )
      .orderBy(macros.createdAt);
  }

  async createMacro(macroData: InsertMacro): Promise<Macro> {
    const [macro] = await db
      .insert(macros)
      .values(macroData)
      .returning();
    return macro;
  }

  async deleteMacro(id: number, userId: number): Promise<void> {
    await db
      .delete(macros)
      .where(and(eq(macros.id, id), eq(macros.userId, userId)));
  }

  // Macro target operations
  async getMacroTargets(userId: number): Promise<MacroTarget | undefined> {
    const [targets] = await db
      .select()
      .from(macroTargets)
      .where(eq(macroTargets.userId, userId));
    return targets;
  }

  async upsertMacroTargets(targetsData: InsertMacroTarget): Promise<MacroTarget> {
    const [targets] = await db
      .insert(macroTargets)
      .values(targetsData)
      .onConflictDoUpdate({
        target: macroTargets.userId,
        set: {
          proteinTarget: targetsData.proteinTarget,
          fatsTarget: targetsData.fatsTarget,
          carbsTarget: targetsData.carbsTarget,
          updatedAt: new Date(),
        },
      })
      .returning();
    return targets;
  }

  // Metrics operations
  async getMetricsByDate(userId: number, date: string): Promise<MetricEntry[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(metrics)
      .where(
        and(
          eq(metrics.userId, userId),
          sql`${metrics.date} >= ${startOfDay} AND ${metrics.date} <= ${endOfDay}`
        )
      )
      .orderBy(metrics.createdAt);
  }

  async createOrUpdateMetric(metricData: InsertMetric): Promise<MetricEntry> {
    const startOfDay = new Date(metricData.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(metricData.date);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if metric exists for this date
    const [existingMetric] = await db
      .select()
      .from(metrics)
      .where(
        and(
          eq(metrics.userId, metricData.userId),
          sql`${metrics.date} >= ${startOfDay} AND ${metrics.date} <= ${endOfDay}`
        )
      );

    if (existingMetric) {
      // Update existing metric
      const [updatedMetric] = await db
        .update(metrics)
        .set({
          weight: metricData.weight,
          customFields: metricData.customFields,
        })
        .where(eq(metrics.id, existingMetric.id))
        .returning();
      return updatedMetric;
    } else {
      // Create new metric
      const [newMetric] = await db
        .insert(metrics)
        .values(metricData)
        .returning();
      return newMetric;
    }
  }

  // Custom metric fields operations
  async getCustomMetricFields(userId: number): Promise<CustomMetricField[]> {
    return await db
      .select()
      .from(customMetricFields)
      .where(eq(customMetricFields.userId, userId))
      .orderBy(customMetricFields.createdAt);
  }

  async createCustomMetricField(fieldData: InsertCustomMetricField): Promise<CustomMetricField> {
    const [field] = await db
      .insert(customMetricFields)
      .values(fieldData)
      .returning();
    return field;
  }

  async deleteCustomMetricField(fieldId: number, userId: number): Promise<void> {
    await db
      .delete(customMetricFields)
      .where(
        and(
          eq(customMetricFields.id, fieldId),
          eq(customMetricFields.userId, userId)
        )
      );
  }
}

export const storage = new DatabaseStorage();
