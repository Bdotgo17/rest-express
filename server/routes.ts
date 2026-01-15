import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDriverSchema, insertSwapPointSchema, insertSwapSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Drivers API
  app.get("/api/drivers", async (req, res) => {
    try {
      const drivers = await storage.getDrivers();
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  app.get("/api/drivers/:id", async (req, res) => {
    try {
      const driver = await storage.getDriver(req.params.id);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch driver" });
    }
  });

  app.post("/api/drivers", async (req, res) => {
    try {
      const parsed = insertDriverSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const driver = await storage.createDriver(parsed.data);
      res.status(201).json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to create driver" });
    }
  });

  app.patch("/api/drivers/:id", async (req, res) => {
    try {
      const partialSchema = insertDriverSchema.partial();
      const parsed = partialSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const driver = await storage.updateDriver(req.params.id, parsed.data);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to update driver" });
    }
  });

  app.delete("/api/drivers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDriver(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Driver not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete driver" });
    }
  });

  // Swap Points API
  app.get("/api/swap-points", async (req, res) => {
    try {
      const swapPoints = await storage.getSwapPoints();
      res.json(swapPoints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch swap points" });
    }
  });

  app.get("/api/swap-points/:id", async (req, res) => {
    try {
      const swapPoint = await storage.getSwapPoint(req.params.id);
      if (!swapPoint) {
        return res.status(404).json({ error: "Swap point not found" });
      }
      res.json(swapPoint);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch swap point" });
    }
  });

  app.post("/api/swap-points", async (req, res) => {
    try {
      const parsed = insertSwapPointSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const swapPoint = await storage.createSwapPoint(parsed.data);
      res.status(201).json(swapPoint);
    } catch (error) {
      res.status(500).json({ error: "Failed to create swap point" });
    }
  });

  app.patch("/api/swap-points/:id", async (req, res) => {
    try {
      const partialSchema = insertSwapPointSchema.partial();
      const parsed = partialSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const swapPoint = await storage.updateSwapPoint(req.params.id, parsed.data);
      if (!swapPoint) {
        return res.status(404).json({ error: "Swap point not found" });
      }
      res.json(swapPoint);
    } catch (error) {
      res.status(500).json({ error: "Failed to update swap point" });
    }
  });

  app.delete("/api/swap-points/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSwapPoint(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Swap point not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete swap point" });
    }
  });

  // Swaps API
  app.get("/api/swaps", async (req, res) => {
    try {
      const swaps = await storage.getSwaps();
      res.json(swaps);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch swaps" });
    }
  });

  app.get("/api/swaps/:id", async (req, res) => {
    try {
      const swap = await storage.getSwap(req.params.id);
      if (!swap) {
        return res.status(404).json({ error: "Swap not found" });
      }
      res.json(swap);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch swap" });
    }
  });

  app.post("/api/swaps", async (req, res) => {
    try {
      const parsed = insertSwapSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const swap = await storage.createSwap(parsed.data);
      res.status(201).json(swap);
    } catch (error) {
      res.status(500).json({ error: "Failed to create swap" });
    }
  });

  app.patch("/api/swaps/:id", async (req, res) => {
    try {
      const partialSchema = insertSwapSchema.partial();
      const parsed = partialSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const swap = await storage.updateSwap(req.params.id, parsed.data);
      if (!swap) {
        return res.status(404).json({ error: "Swap not found" });
      }
      res.json(swap);
    } catch (error) {
      res.status(500).json({ error: "Failed to update swap" });
    }
  });

  app.delete("/api/swaps/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSwap(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Swap not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete swap" });
    }
  });

  // Routing API - uses OSRM for actual road distances
  app.get("/api/route", async (req, res) => {
    try {
      const { fromLat, fromLon, toLat, toLon } = req.query;
      
      if (!fromLat || !fromLon || !toLat || !toLon) {
        return res.status(400).json({ error: "Missing coordinates" });
      }

      // Validate numeric coordinates
      const lat1 = parseFloat(fromLat as string);
      const lon1 = parseFloat(fromLon as string);
      const lat2 = parseFloat(toLat as string);
      const lon2 = parseFloat(toLon as string);

      if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
        return res.status(400).json({ error: "Invalid coordinates - must be numeric" });
      }

      if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
        return res.status(400).json({ error: "Invalid latitude - must be between -90 and 90" });
      }

      if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
        return res.status(400).json({ error: "Invalid longitude - must be between -180 and 180" });
      }

      // OSRM expects coordinates as lon,lat (not lat,lon)
      const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
      
      // Add timeout with AbortController
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        
        const data = await response.json();
        
        if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
          // Fall back to Haversine calculation
          const haversineDistance = calculateHaversine(lat1, lon1, lat2, lon2);
          return res.json({
            distance: Math.round(haversineDistance * 10) / 10,
            duration: haversineDistance / 55,
            durationFormatted: formatDuration(haversineDistance / 55),
            approximate: true
          });
        }

        const route = data.routes[0];
        const distanceMeters = route.distance;
        const durationSeconds = route.duration;
        
        // Convert to miles and hours
        const distanceMiles = distanceMeters / 1609.344;
        const durationHours = durationSeconds / 3600;
        
        res.json({
          distance: Math.round(distanceMiles * 10) / 10,
          duration: durationHours,
          durationFormatted: formatDuration(durationHours),
          approximate: false
        });
      } catch (fetchError: any) {
        clearTimeout(timeout);
        // Fall back to Haversine on network errors
        const haversineDistance = calculateHaversine(lat1, lon1, lat2, lon2);
        res.json({
          distance: Math.round(haversineDistance * 10) / 10,
          duration: haversineDistance / 55,
          durationFormatted: formatDuration(haversineDistance / 55),
          approximate: true
        });
      }
    } catch (error) {
      console.error("Routing error:", error);
      res.status(500).json({ error: "Failed to calculate route" });
    }
  });

  return httpServer;
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  let m = Math.round((hours - h) * 60);
  
  if (m >= 60) {
    return `${h + 1}h 0m`;
  }
  
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
}

// Haversine formula for fallback distance calculation
function calculateHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
