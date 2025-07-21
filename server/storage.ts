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
import { eq, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Profile operations
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile>;
  
  // Goal operations
  getUserGoals(userId: string): Promise<UserGoal[]>;
  createUserGoal(goal: InsertUserGoal): Promise<UserGoal>;
  deleteUserGoals(userId: string): Promise<void>;
  
  // Progress operations
  getUserProgress(userId: string): Promise<ProgressEntry[]>;
  createProgressEntry(entry: InsertProgressEntry): Promise<ProgressEntry>;
  getLatestProgressByGoal(userId: string, goalType: string): Promise<ProgressEntry | undefined>;
  
  // Photo operations
  getUserPhotos(userId: string): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  deletePhoto(id: number, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Profile operations
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
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

  async updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    const [updatedProfile] = await db
      .update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updatedProfile;
  }

  // Goal operations
  async getUserGoals(userId: string): Promise<UserGoal[]> {
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

  async deleteUserGoals(userId: string): Promise<void> {
    await db
      .update(userGoals)
      .set({ isActive: false })
      .where(eq(userGoals.userId, userId));
  }

  // Progress operations
  async getUserProgress(userId: string): Promise<ProgressEntry[]> {
    return await db
      .select()
      .from(progressEntries)
      .where(eq(progressEntries.userId, userId));
  }

  async createProgressEntry(entry: InsertProgressEntry): Promise<ProgressEntry> {
    const [newEntry] = await db
      .insert(progressEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async getLatestProgressByGoal(userId: string, goalType: string): Promise<ProgressEntry | undefined> {
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
  async getUserPhotos(userId: string): Promise<Photo[]> {
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

  async deletePhoto(id: number, userId: string): Promise<void> {
    await db
      .delete(photos)
      .where(and(eq(photos.id, id), eq(photos.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
