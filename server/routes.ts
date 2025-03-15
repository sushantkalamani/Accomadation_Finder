import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertAccommodationSchema, searchAccommodationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: "Not authenticated" });
  };

  // Get all accommodations
  app.get("/api/accommodations", async (req, res) => {
    try {
      const accommodations = await storage.getAccommodations();
      res.json(accommodations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accommodations" });
    }
  });

  // Search accommodations
  app.get("/api/accommodations/search", async (req, res) => {
    try {
      const queryParams = {
        query: req.query.query as string | undefined,
        priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
        priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
        rooms: req.query.rooms ? parseInt(req.query.rooms as string, 10) : undefined,
      };

      const validationResult = searchAccommodationSchema.safeParse(queryParams);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid search parameters", errors: validationResult.error.flatten() });
      }
      
      const accommodations = await storage.searchAccommodations(validationResult.data);
      res.json(accommodations);
    } catch (error) {
      res.status(500).json({ message: "Failed to search accommodations" });
    }
  });

  // Get specific accommodation
  app.get("/api/accommodations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const accommodation = await storage.getAccommodation(id);
      
      if (!accommodation) {
        return res.status(404).json({ message: "Accommodation not found" });
      }
      
      res.json(accommodation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accommodation" });
    }
  });

  // Create new accommodation
  app.post("/api/accommodations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const accommodationData = { ...req.body, userId };
      const validationResult = insertAccommodationSchema.safeParse(accommodationData);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid accommodation data", errors: validationResult.error.flatten() });
      }
      
      const newAccommodation = await storage.createAccommodation(validationResult.data);
      res.status(201).json(newAccommodation);
    } catch (error) {
      res.status(500).json({ message: "Failed to create accommodation" });
    }
  });

  // Update accommodation
  app.put("/api/accommodations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const accommodation = await storage.getAccommodation(id);
      
      if (!accommodation) {
        return res.status(404).json({ message: "Accommodation not found" });
      }
      
      if (accommodation.userId !== req.user?.id) {
        return res.status(403).json({ message: "Not authorized to update this accommodation" });
      }
      
      const updatedAccommodation = await storage.updateAccommodation(id, req.body);
      res.json(updatedAccommodation);
    } catch (error) {
      res.status(500).json({ message: "Failed to update accommodation" });
    }
  });

  // Delete accommodation
  app.delete("/api/accommodations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const accommodation = await storage.getAccommodation(id);
      
      if (!accommodation) {
        return res.status(404).json({ message: "Accommodation not found" });
      }
      
      if (accommodation.userId !== req.user?.id) {
        return res.status(403).json({ message: "Not authorized to delete this accommodation" });
      }
      
      const success = await storage.deleteAccommodation(id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete accommodation" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete accommodation" });
    }
  });

  // Get user's accommodations
  app.get("/api/my-accommodations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const accommodations = await storage.getAccommodationsByUserId(userId);
      res.json(accommodations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user accommodations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
