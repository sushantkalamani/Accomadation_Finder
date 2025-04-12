import { MongoClient } from "mongodb";

let client;
let db;

export async function connectToDatabase() {
  if (db) {
    return { db, client };
  }

  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/roomhub"; // Default for local dev
  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  client = new MongoClient(uri);

  try {
    await client.connect();
    db = client.db(); // Use default DB from connection string or 'roomhub' if specified
    
    // Create or update indexes
    await setupIndexes(db);
    
    console.log("Connected successfully to MongoDB");
    return { db, client };
  } catch (error) {
    console.error("Could not connect to MongoDB", error);
    process.exit(1);
  }
}

// Setup necessary database indexes
async function setupIndexes(db) {
  try {
    // Text index for search functionality
    await db.collection("accommodations").createIndex(
      { 
        name: "text", 
        address: "text", 
        description: "text" 
      },
      { 
        name: "text_search_index",
        background: true
      }
    );
    
    // Index for user's accommodations
    await db.collection("accommodations").createIndex(
      { userId: 1 },
      { background: true }
    );
    
    console.log("Database indexes created/updated successfully");
  } catch (error) {
    console.warn("Error setting up database indexes:", error);
  }
} 