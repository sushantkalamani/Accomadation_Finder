import { createServer, Server } from "http";
import { ObjectId } from "mongodb";
import { setupAuth } from "./auth.js";
import { insertAccommodationSchema, searchAccommodationSchema } from "../shared/schema.js";
import { z } from "zod";

export async function registerRoutes(app, db, clientPromise) {
  // Setup authentication routes
  setupAuth(app, db, clientPromise);

  // Middleware to check if user is authenticated
  const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: "Not authenticated" });
  };

  // Get all accommodations
  app.get("/api/accommodations", async (req, res, next) => {
    try {
      const accommodations = await db.collection("accommodations").find().toArray();
      res.json(accommodations);
    } catch (error) {
      next(error);
    }
  });

  // Search accommodations
  app.get("/api/accommodations/search", async (req, res, next) => {
    try {
      const queryParams = {
        query: req.query.query,
        priceMin: req.query.priceMin ? parseFloat(req.query.priceMin) : undefined,
        priceMax: req.query.priceMax ? parseFloat(req.query.priceMax) : undefined,
        rooms: req.query.rooms ? parseInt(req.query.rooms, 10) : undefined,
      };

      const validationResult = searchAccommodationSchema.safeParse(queryParams);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid search parameters", errors: validationResult.error.flatten() });
      }
      
      const filter = {};
      const validatedData = validationResult.data;

      if (validatedData.query) {
        filter.$text = { $search: validatedData.query };
      }
      if (validatedData.priceMin !== undefined || validatedData.priceMax !== undefined) {
        filter.price = {};
        if (validatedData.priceMin !== undefined) filter.price.$gte = validatedData.priceMin;
        if (validatedData.priceMax !== undefined) filter.price.$lte = validatedData.priceMax;
      }
      if (validatedData.rooms !== undefined) {
        filter.rooms = { $gte: validatedData.rooms };
      }
      
      const accommodations = await db.collection("accommodations").find(filter).toArray();
      res.json(accommodations);
    } catch (error) {
      next(error);
    }
  });

  // Get specific accommodation
  app.get("/api/accommodations/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const accommodation = await db.collection("accommodations").findOne({ _id: new ObjectId(id) });
      
      if (!accommodation) {
        return res.status(404).json({ message: "Accommodation not found" });
      }
      
      res.json(accommodation);
    } catch (error) {
      next(error);
    }
  });

  // Create new accommodation - Reverted photo uploads
  app.post("/api/accommodations", 
    isAuthenticated, 
    async (req, res, next) => {
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication error: User ID not found" }); 
      }

      // Validate req.body directly, Zod will coerce numbers
      const validationResult = insertAccommodationSchema.omit({ userId: true, photos: true }).safeParse(req.body); // Keep omitting photos for now
      
      if (!validationResult.success) {
        console.error("Validation Errors:", validationResult.error.flatten());
        return res.status(400).json({ message: "Invalid accommodation data", errors: validationResult.error.flatten() });
      }
      
      // Insert data without photos field
      const accommodationToInsert = { 
        ...validationResult.data, 
        userId: new ObjectId(userId), 
      };
      
      const result = await db.collection("accommodations").insertOne(accommodationToInsert);
      
      const newAccommodation = await db.collection("accommodations").findOne({ _id: result.insertedId });
      if (!newAccommodation) { throw new Error("Failed to fetch accommodation after creation."); }

      res.status(201).json(newAccommodation);
    } catch (error) {
      console.error("Create Accommodation Error:", error);
      next(error); 
    }
  });

  // Update accommodation - NOTE: Photo updates are not handled in this pass
  app.put("/api/accommodations/:id", isAuthenticated, async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const accommodationId = new ObjectId(id);
      const userId = req.user?._id;

      const validationResult = insertAccommodationSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
          return res.status(400).json({ message: "Invalid update data", errors: validationResult.error.flatten() });
      }
      const updateData = validationResult.data;

      delete updateData.userId;

      const result = await db.collection("accommodations").updateOne(
        { _id: accommodationId, userId: new ObjectId(userId) },
        { $set: updateData } 
      );
      
      if (result.matchedCount === 0) {
        const exists = await db.collection("accommodations").countDocuments({ _id: accommodationId });
        if (!exists) {
            return res.status(404).json({ message: "Accommodation not found" });
        }
        return res.status(403).json({ message: "Not authorized to update this accommodation" });
      }
      
      const updatedAccommodation = await db.collection("accommodations").findOne({ _id: accommodationId });
      res.json(updatedAccommodation);

    } catch (error) {
      next(error);
    }
  });

  // Delete accommodation - NOTE: Does not delete associated photos from disk
  app.delete("/api/accommodations/:id", isAuthenticated, async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const accommodationId = new ObjectId(id);
      const userId = req.user?._id;
      
      const result = await db.collection("accommodations").deleteOne(
        { _id: accommodationId, userId: new ObjectId(userId) }
      );
      
      if (result.deletedCount === 0) {
        const exists = await db.collection("accommodations").countDocuments({ _id: accommodationId });
        if (!exists) {
            return res.status(404).json({ message: "Accommodation not found" });
        }
        return res.status(403).json({ message: "Not authorized to delete this accommodation" });
      }
      
      res.status(204).send();

    } catch (error) {
      next(error);
    }
  });

  // Get user's accommodations
  app.get("/api/my-accommodations", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication error: User ID not found" });
      }
      
      const accommodations = await db.collection("accommodations").find({ userId: new ObjectId(userId) }).toArray();
      res.json(accommodations);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

