import { createServer, Server } from "http";
import { ObjectId } from "mongodb";
import { setupAuth } from "./auth.js";
import { insertAccommodationSchema, searchAccommodationSchema } from "../shared/schema.js";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set up multer for file uploads
const uploadDir = path.join(__dirname, "../uploads");
// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (ext && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Add user profile update schema
const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().optional(),
  email: z.string().email("Invalid email").optional(),
});

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

  // Serve static uploads
  app.use('/uploads', express.static(uploadDir));

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

      // Use regex search instead of text search to avoid requiring text index
      if (validatedData.query) {
        filter.$or = [
          { name: { $regex: validatedData.query, $options: 'i' } },
          { address: { $regex: validatedData.query, $options: 'i' } },
          { description: { $regex: validatedData.query, $options: 'i' } }
        ];
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

  // Create new accommodation with image upload
  app.post("/api/accommodations", 
    isAuthenticated, 
    upload.array('images', 5), // Allow up to 5 images
    async (req, res, next) => {
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication error: User ID not found" }); 
      }

      // Get uploaded files paths
      const imagePaths = req.files ? req.files.map(file => {
        // Use absolute URL for images to ensure they load properly
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        return `${baseUrl}/uploads/${file.filename}`;
      }) : [];
      
      // Parse and validate accommodation data
      let accommodationData;
      try {
        if (!req.body.data) {
          return res.status(400).json({ message: "Missing accommodation data in the request body" });
        }
        accommodationData = JSON.parse(req.body.data);
        console.log("Received accommodation data:", req.body.data);
      } catch (error) {
        console.error("Error parsing accommodation data:", error);
        return res.status(400).json({ message: "Invalid JSON data format: " + error.message });
      }
      
      // Create new accommodation object with all necessary fields
      const accommodationToInsert = {
        name: accommodationData.name,
        address: accommodationData.address,
        rooms: Number(accommodationData.rooms || 1),
        price: Number(accommodationData.price || 0),
        phone: accommodationData.phone,
        description: accommodationData.description || "",
        latitude: Number(accommodationData.latitude || 0),
        longitude: Number(accommodationData.longitude || 0),
        features: Array.isArray(accommodationData.features) ? accommodationData.features : [],
        images: imagePaths,
        userId: new ObjectId(userId)
      };
      
      // Validate the complete object
      const validationResult = insertAccommodationSchema.safeParse(accommodationToInsert);
      
      if (!validationResult.success) {
        console.error("Validation errors:", JSON.stringify(validationResult.error.flatten()));
        return res.status(400).json({ 
          message: "Invalid accommodation data", 
          errors: validationResult.error.flatten() 
        });
      }
      
      console.log("Inserting accommodation:", JSON.stringify(accommodationToInsert));
      
      const result = await db.collection("accommodations").insertOne(accommodationToInsert);
      
      const newAccommodation = await db.collection("accommodations").findOne({ _id: result.insertedId });
      if (!newAccommodation) { throw new Error("Failed to fetch accommodation after creation."); }

      res.status(201).json(newAccommodation);
    } catch (error) {
      console.error("Create Accommodation Error:", error);
      return res.status(500).json({ message: "Failed to create accommodation", error: error.message });
    }
  });

  // Update accommodation with image upload
  app.put("/api/accommodations/:id", 
    isAuthenticated,
    upload.array('images', 5), // Allow up to 5 images 
    async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const accommodationId = new ObjectId(id);
      const userId = req.user?._id;

      // Get existing accommodation first
      const existingAccommodation = await db.collection("accommodations").findOne({ 
        _id: accommodationId,
        userId: new ObjectId(userId)
      });
      
      if (!existingAccommodation) {
        return res.status(404).json({ message: "Accommodation not found or you don't have permission to edit it" });
      }

      // Get uploaded files paths
      const newImagePaths = req.files ? req.files.map(file => {
        // Use absolute URL for images to ensure they load properly
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        return `${baseUrl}/uploads/${file.filename}`;
      }) : [];
      
      // Parse and validate accommodation data
      const accommodationData = typeof req.body.data === 'string' 
        ? JSON.parse(req.body.data) 
        : req.body;
      
      // Get existing image paths to keep
      const keepImages = accommodationData.keepImages 
        ? Array.isArray(accommodationData.keepImages) 
          ? accommodationData.keepImages 
          : [accommodationData.keepImages]
        : [];

      // Validate data
      const validationResult = insertAccommodationSchema
        .partial()
        .omit({ userId: true, images: true })
        .safeParse(accommodationData);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid update data", errors: validationResult.error.flatten() });
      }
      
      // Combine kept images with new ones
      const allImages = [...keepImages, ...newImagePaths];
      
      // Include features array
      const features = accommodationData.features || existingAccommodation.features || [];

      // Create update data
      const updateData = {
        ...validationResult.data,
        features: features,
        images: allImages
      };

      // Remove images that should be deleted
      if (existingAccommodation.images) {
        const imagesToDelete = existingAccommodation.images.filter(img => !keepImages.includes(img));
        
        // Delete old image files from disk
        imagesToDelete.forEach(imgPath => {
          try {
            // Extract the filename from full URL or relative path
            let localPath;
            if (imgPath.includes('/uploads/')) {
              // Extract just the filename part
              const parts = imgPath.split('/uploads/');
              const filename = parts[parts.length - 1];
              localPath = path.join(__dirname, '..', 'uploads', filename);
            } else {
              localPath = path.join(__dirname, '..', imgPath);
            }
            
            console.log("Attempting to delete image file:", localPath);
            if (fs.existsSync(localPath)) {
              fs.unlinkSync(localPath);
              console.log("Successfully deleted image file:", localPath);
            } else {
              console.log("File not found when trying to delete:", localPath);
            }
          } catch (error) {
            console.error("Error deleting image file:", error);
          }
        });
      }

      // Update in database
      const result = await db.collection("accommodations").updateOne(
        { _id: accommodationId, userId: new ObjectId(userId) },
        { $set: updateData } 
      );
      
      if (result.matchedCount === 0) {
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

  // Update user profile
  app.put("/api/user/profile", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication error: User ID not found" });
      }
      
      // Validate the request body
      const validationResult = updateUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid user data",
          errors: validationResult.error.flatten()
        });
      }
      
      const updateData = validationResult.data;
      console.log("Profile update request:", JSON.stringify(updateData));
      
      // Update user in the database
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
      );
      
      // If user has accommodations and user's phone has changed, update phone in accommodations
      if (updateData.phone) {
        await db.collection("accommodations").updateMany(
          { userId: new ObjectId(userId) },
          { $set: { phone: updateData.phone } }
        );
      }
      
      // Get updated user data
      const updatedUser = await db.collection("users").findOne({ _id: new ObjectId(userId) });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password to client
      const userResponse = { ...updatedUser };
      delete userResponse.password;
      
      console.log("Profile update response:", JSON.stringify(userResponse));
      
      // Ensure we're sending a valid JSON response
      return res.status(200).json(userResponse);
    } catch (error) {
      console.error("Profile update error:", error);
      return res.status(500).json({ message: "Failed to update profile", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

