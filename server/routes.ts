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

  return httpServer;
}
