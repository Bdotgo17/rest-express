import { 
  users, drivers, swapPoints, swaps,
  type User, type InsertUser, 
  type Driver, type InsertDriver,
  type SwapPoint, type InsertSwapPoint,
  type Swap, type InsertSwap
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Drivers
  getDrivers(): Promise<Driver[]>;
  getDriver(id: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver | undefined>;
  deleteDriver(id: string): Promise<boolean>;
  
  // Swap Points
  getSwapPoints(): Promise<SwapPoint[]>;
  getSwapPoint(id: string): Promise<SwapPoint | undefined>;
  createSwapPoint(swapPoint: InsertSwapPoint): Promise<SwapPoint>;
  updateSwapPoint(id: string, swapPoint: Partial<InsertSwapPoint>): Promise<SwapPoint | undefined>;
  deleteSwapPoint(id: string): Promise<boolean>;
  
  // Swaps
  getSwaps(): Promise<Swap[]>;
  getSwap(id: string): Promise<Swap | undefined>;
  createSwap(swap: InsertSwap): Promise<Swap>;
  updateSwap(id: string, swap: Partial<InsertSwap>): Promise<Swap | undefined>;
  deleteSwap(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Drivers
  async getDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers);
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver || undefined;
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const [driver] = await db.insert(drivers).values(insertDriver).returning();
    return driver;
  }

  async updateDriver(id: string, updates: Partial<InsertDriver>): Promise<Driver | undefined> {
    const [driver] = await db.update(drivers).set(updates).where(eq(drivers.id, id)).returning();
    return driver || undefined;
  }

  async deleteDriver(id: string): Promise<boolean> {
    const result = await db.delete(drivers).where(eq(drivers.id, id)).returning();
    return result.length > 0;
  }

  // Swap Points
  async getSwapPoints(): Promise<SwapPoint[]> {
    return await db.select().from(swapPoints);
  }

  async getSwapPoint(id: string): Promise<SwapPoint | undefined> {
    const [swapPoint] = await db.select().from(swapPoints).where(eq(swapPoints.id, id));
    return swapPoint || undefined;
  }

  async createSwapPoint(insertSwapPoint: InsertSwapPoint): Promise<SwapPoint> {
    const [swapPoint] = await db.insert(swapPoints).values(insertSwapPoint).returning();
    return swapPoint;
  }

  async updateSwapPoint(id: string, updates: Partial<InsertSwapPoint>): Promise<SwapPoint | undefined> {
    const [swapPoint] = await db.update(swapPoints).set(updates).where(eq(swapPoints.id, id)).returning();
    return swapPoint || undefined;
  }

  async deleteSwapPoint(id: string): Promise<boolean> {
    const result = await db.delete(swapPoints).where(eq(swapPoints.id, id)).returning();
    return result.length > 0;
  }

  // Swaps
  async getSwaps(): Promise<Swap[]> {
    return await db.select().from(swaps);
  }

  async getSwap(id: string): Promise<Swap | undefined> {
    const [swap] = await db.select().from(swaps).where(eq(swaps.id, id));
    return swap || undefined;
  }

  async createSwap(insertSwap: InsertSwap): Promise<Swap> {
    const [swap] = await db.insert(swaps).values(insertSwap).returning();
    return swap;
  }

  async updateSwap(id: string, updates: Partial<InsertSwap>): Promise<Swap | undefined> {
    const [swap] = await db.update(swaps).set(updates).where(eq(swaps.id, id)).returning();
    return swap || undefined;
  }

  async deleteSwap(id: string): Promise<boolean> {
    const result = await db.delete(swaps).where(eq(swaps.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
