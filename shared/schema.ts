import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Driver status types
export const driverStatusEnum = z.enum(["available", "en-route", "waiting", "delayed", "offline"]);
export type DriverStatus = z.infer<typeof driverStatusEnum>;

// Swap status types
export const swapStatusEnum = z.enum(["scheduled", "in-progress", "completed", "cancelled"]);
export type SwapStatus = z.infer<typeof swapStatusEnum>;

// Driver schema
export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  truckId: text("truck_id").notNull(),
  status: text("status").notNull().default("available"),
  currentLocation: text("current_location"),
  latitude: text("latitude"),
  longitude: text("longitude"),
});

export const insertDriverSchema = createInsertSchema(drivers).omit({ id: true });
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;

// Swap Point schema
export const swapPoints = pgTable("swap_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  capacity: integer("capacity").notNull().default(4),
  amenities: text("amenities").array(),
  latitude: text("latitude"),
  longitude: text("longitude"),
});

export const insertSwapPointSchema = createInsertSchema(swapPoints).omit({ id: true });
export type InsertSwapPoint = z.infer<typeof insertSwapPointSchema>;
export type SwapPoint = typeof swapPoints.$inferSelect;

// Swap (meeting) schema
export const swaps = pgTable("swaps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driver1Id: varchar("driver1_id").notNull(),
  driver2Id: varchar("driver2_id").notNull(),
  swapPointId: varchar("swap_point_id"),
  customLocation: text("custom_location"),
  customLatitude: text("custom_latitude"),
  customLongitude: text("custom_longitude"),
  scheduledTime: text("scheduled_time").notNull(),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
});

export const insertSwapSchema = createInsertSchema(swaps).omit({ id: true });
export type InsertSwap = z.infer<typeof insertSwapSchema>;
export type Swap = typeof swaps.$inferSelect;
