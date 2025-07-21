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
}

export const storage = new DatabaseStorage();
