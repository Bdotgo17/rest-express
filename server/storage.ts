import { 
  type User, type InsertUser, 
  type Driver, type InsertDriver,
  type SwapPoint, type InsertSwapPoint,
  type Swap, type InsertSwap
} from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private drivers: Map<string, Driver>;
  private swapPoints: Map<string, SwapPoint>;
  private swaps: Map<string, Swap>;

  constructor() {
    this.users = new Map();
    this.drivers = new Map();
    this.swapPoints = new Map();
    this.swaps = new Map();
    
    this.seedData();
  }

  private seedData() {
    const driver1: Driver = {
      id: randomUUID(),
      name: "John Martinez",
      phone: "+1 555-123-4567",
      truckId: "TRK-001",
      status: "en-route",
      currentLocation: "Highway 101, Mile 45",
    };
    
    const driver2: Driver = {
      id: randomUUID(),
      name: "Sarah Johnson",
      phone: "+1 555-234-5678",
      truckId: "TRK-002",
      status: "waiting",
      currentLocation: "Central Hub Terminal",
    };
    
    const driver3: Driver = {
      id: randomUUID(),
      name: "Michael Chen",
      phone: "+1 555-345-6789",
      truckId: "TRK-003",
      status: "available",
      currentLocation: "East Distribution Center",
    };
    
    const driver4: Driver = {
      id: randomUUID(),
      name: "Emily Davis",
      phone: "+1 555-456-7890",
      truckId: "TRK-004",
      status: "delayed",
      currentLocation: "Interstate 95, Traffic",
    };
    
    this.drivers.set(driver1.id, driver1);
    this.drivers.set(driver2.id, driver2);
    this.drivers.set(driver3.id, driver3);
    this.drivers.set(driver4.id, driver4);
    
    const swapPoint1: SwapPoint = {
      id: randomUUID(),
      name: "Central Hub Terminal",
      address: "1500 Logistics Blvd, Phoenix, AZ 85001",
      capacity: 6,
      amenities: ["parking", "fuel", "rest"],
    };
    
    const swapPoint2: SwapPoint = {
      id: randomUUID(),
      name: "East Distribution Center",
      address: "2800 Commerce Dr, Dallas, TX 75201",
      capacity: 4,
      amenities: ["parking", "fuel"],
    };
    
    const swapPoint3: SwapPoint = {
      id: randomUUID(),
      name: "Highway 101 Rest Stop",
      address: "Mile Marker 78, Highway 101, CA",
      capacity: 3,
      amenities: ["parking", "rest"],
    };
    
    this.swapPoints.set(swapPoint1.id, swapPoint1);
    this.swapPoints.set(swapPoint2.id, swapPoint2);
    this.swapPoints.set(swapPoint3.id, swapPoint3);
    
    const now = new Date();
    const swap1: Swap = {
      id: randomUUID(),
      driver1Id: driver1.id,
      driver2Id: driver2.id,
      swapPointId: swapPoint1.id,
      scheduledTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      status: "scheduled",
      notes: "Standard cargo handoff",
    };
    
    const swap2: Swap = {
      id: randomUUID(),
      driver1Id: driver3.id,
      driver2Id: driver4.id,
      swapPointId: swapPoint2.id,
      scheduledTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      status: "in-progress",
      notes: "Priority delivery - refrigerated cargo",
    };
    
    this.swaps.set(swap1.id, swap1);
    this.swaps.set(swap2.id, swap2);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Drivers
  async getDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const id = randomUUID();
    const driver: Driver = { 
      id,
      name: insertDriver.name,
      phone: insertDriver.phone,
      truckId: insertDriver.truckId,
      status: insertDriver.status ?? "available",
      currentLocation: insertDriver.currentLocation ?? null,
    };
    this.drivers.set(id, driver);
    return driver;
  }

  async updateDriver(id: string, updates: Partial<InsertDriver>): Promise<Driver | undefined> {
    const driver = this.drivers.get(id);
    if (!driver) return undefined;
    const updated = { ...driver, ...updates };
    this.drivers.set(id, updated);
    return updated;
  }

  async deleteDriver(id: string): Promise<boolean> {
    return this.drivers.delete(id);
  }

  // Swap Points
  async getSwapPoints(): Promise<SwapPoint[]> {
    return Array.from(this.swapPoints.values());
  }

  async getSwapPoint(id: string): Promise<SwapPoint | undefined> {
    return this.swapPoints.get(id);
  }

  async createSwapPoint(insertSwapPoint: InsertSwapPoint): Promise<SwapPoint> {
    const id = randomUUID();
    const swapPoint: SwapPoint = { 
      id,
      name: insertSwapPoint.name,
      address: insertSwapPoint.address,
      capacity: insertSwapPoint.capacity ?? 4,
      amenities: insertSwapPoint.amenities ?? null,
    };
    this.swapPoints.set(id, swapPoint);
    return swapPoint;
  }

  async updateSwapPoint(id: string, updates: Partial<InsertSwapPoint>): Promise<SwapPoint | undefined> {
    const swapPoint = this.swapPoints.get(id);
    if (!swapPoint) return undefined;
    const updated = { ...swapPoint, ...updates };
    this.swapPoints.set(id, updated);
    return updated;
  }

  async deleteSwapPoint(id: string): Promise<boolean> {
    return this.swapPoints.delete(id);
  }

  // Swaps
  async getSwaps(): Promise<Swap[]> {
    return Array.from(this.swaps.values());
  }

  async getSwap(id: string): Promise<Swap | undefined> {
    return this.swaps.get(id);
  }

  async createSwap(insertSwap: InsertSwap): Promise<Swap> {
    const id = randomUUID();
    const swap: Swap = { 
      id,
      driver1Id: insertSwap.driver1Id,
      driver2Id: insertSwap.driver2Id,
      swapPointId: insertSwap.swapPointId,
      scheduledTime: insertSwap.scheduledTime,
      status: insertSwap.status ?? "scheduled",
      notes: insertSwap.notes ?? null,
    };
    this.swaps.set(id, swap);
    return swap;
  }

  async updateSwap(id: string, updates: Partial<InsertSwap>): Promise<Swap | undefined> {
    const swap = this.swaps.get(id);
    if (!swap) return undefined;
    const updated = { ...swap, ...updates };
    this.swaps.set(id, updated);
    return updated;
  }

  async deleteSwap(id: string): Promise<boolean> {
    return this.swaps.delete(id);
  }
}

export const storage = new MemStorage();
