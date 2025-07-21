import {
  users,
  userProfiles,
  userGoals,
  progressEntries,
  photos,
  type User,
  type UpsertUser,
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
  macros,
  type Macro,
  type InsertMacro,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations - secure authentication
  getUser(id: number): Promise<User | undefined>;
  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined>;
  createUser(user: Omit<UpsertUser, 'id'>): Promise<User>;
  updateUser(id: number, user: Partial<UpsertUser>): Promise<User>;
  
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
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  deletePhoto(id: number, userId: number): Promise<void>;

  // Activity operations
  getUserActivities(userId: number): Promise<Activity[]>;
  getActivitiesForDate(userId: number, date: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  deleteActivity(id: number, userId: number): Promise<void>;

  // Macro operations
  getUserMacros(userId: number): Promise<Macro[]>;
  getMacrosForDate(userId: number, date: string): Promise<Macro[]>;
  createMacro(macro: InsertMacro): Promise<Macro>;
  deleteMacro(id: number, userId: number): Promise<void>;
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

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<UpsertUser>): Promise<User> {
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

  async deleteActivity(id: number, userId: number): Promise<void> {
    await db
      .delete(activities)
      .where(and(eq(activities.id, id), eq(activities.userId, userId)));
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
}

export const storage = new DatabaseStorage();
