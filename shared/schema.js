import { pgTable, text, serial, integer, boolean, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});

export const accommodations = pgTable("accommodations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  rooms: integer("rooms").notNull(),
  price: doublePrecision("price").notNull(),
  phone: text("phone").notNull(),
  description: text("description"),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
});

// Helper for preprocessing numeric fields: empty string -> undefined
const preprocessNumber = (val) => (val === "" ? undefined : val);

export const insertUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const selectUserSchema = insertUserSchema.extend({
   _id: z.string(), // MongoDB uses _id
}).omit({ password: true }); // Exclude password from select schema

export const insertAccommodationSchema = z.object({
  name: z.string().trim().min(1, "Accommodation name is required"),
  address: z.string().trim().min(1, "Address is required"),
  rooms: z.preprocess(preprocessNumber, z.coerce.number().int().min(1, "Must have at least 1 room")),
  price: z.preprocess(preprocessNumber, z.coerce.number().min(0, "Price cannot be negative")),
  phone: z.string()
           .trim()
           .min(10, "Phone number must be at least 10 digits")
           .max(10, "Phone number must be exactly 10 digits")
           .regex(/^[0-9]{10}$/, "Phone number must be 10 digits")
           .refine((value) => /^[6-9][0-9]{9}$/.test(value), {
             message: "Phone number must be a valid Indian mobile number starting with 6, 7, 8, or 9"
           }),
  description: z.string().trim().optional(), // Allow empty string via optional
  latitude: z.preprocess(preprocessNumber, z.coerce.number()),
  longitude: z.preprocess(preprocessNumber, z.coerce.number()),
});

export const selectAccommodationSchema = insertAccommodationSchema.extend({
  _id: z.string(), // MongoDB uses _id as string (or ObjectId)
  userId: z.string(), // Assuming userId is stored as ObjectId string
});

export const searchAccommodationSchema = z.object({
  query: z.string().optional(),
  priceMin: z.preprocess(preprocessNumber, z.coerce.number().optional()),
  priceMax: z.preprocess(preprocessNumber, z.coerce.number().optional()),
  rooms: z.preprocess(preprocessNumber, z.coerce.number().int().optional()),
});
