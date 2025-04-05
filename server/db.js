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
    console.log("Connected successfully to MongoDB");
    return { db, client };
  } catch (error) {
    console.error("Could not connect to MongoDB", error);
    process.exit(1);
  }
} 