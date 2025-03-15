import { users, accommodations, type User, type InsertUser, type Accommodation, type InsertAccommodation, type SearchAccommodationParams } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAccommodation(id: number): Promise<Accommodation | undefined>;
  getAccommodations(): Promise<Accommodation[]>;
  getAccommodationsByUserId(userId: number): Promise<Accommodation[]>;
  searchAccommodations(params: SearchAccommodationParams): Promise<Accommodation[]>;
  createAccommodation(accommodation: InsertAccommodation): Promise<Accommodation>;
  updateAccommodation(id: number, accommodation: Partial<InsertAccommodation>): Promise<Accommodation | undefined>;
  deleteAccommodation(id: number): Promise<boolean>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private accommodations: Map<number, Accommodation>;
  userCurrentId: number;
  accommodationCurrentId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.accommodations = new Map();
    this.userCurrentId = 1;
    this.accommodationCurrentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAccommodation(id: number): Promise<Accommodation | undefined> {
    return this.accommodations.get(id);
  }

  async getAccommodations(): Promise<Accommodation[]> {
    return Array.from(this.accommodations.values());
  }

  async getAccommodationsByUserId(userId: number): Promise<Accommodation[]> {
    return Array.from(this.accommodations.values()).filter(
      (accommodation) => accommodation.userId === userId,
    );
  }

  async searchAccommodations(params: SearchAccommodationParams): Promise<Accommodation[]> {
    let results = Array.from(this.accommodations.values());
    
    if (params.query) {
      const query = params.query.toLowerCase();
      results = results.filter(
        (accommodation) => 
          accommodation.name.toLowerCase().includes(query) ||
          accommodation.address.toLowerCase().includes(query) ||
          accommodation.description?.toLowerCase().includes(query)
      );
    }
    
    if (params.priceMin !== undefined) {
      results = results.filter(
        (accommodation) => accommodation.price >= params.priceMin!
      );
    }
    
    if (params.priceMax !== undefined) {
      results = results.filter(
        (accommodation) => accommodation.price <= params.priceMax!
      );
    }
    
    if (params.rooms !== undefined) {
      results = results.filter(
        (accommodation) => accommodation.rooms >= params.rooms!
      );
    }
    
    return results;
  }

  async createAccommodation(insertAccommodation: InsertAccommodation): Promise<Accommodation> {
    const id = this.accommodationCurrentId++;
    const accommodation: Accommodation = { ...insertAccommodation, id };
    this.accommodations.set(id, accommodation);
    return accommodation;
  }

  async updateAccommodation(id: number, accommodationUpdate: Partial<InsertAccommodation>): Promise<Accommodation | undefined> {
    const accommodation = this.accommodations.get(id);
    
    if (!accommodation) {
      return undefined;
    }
    
    const updatedAccommodation = { ...accommodation, ...accommodationUpdate };
    this.accommodations.set(id, updatedAccommodation);
    
    return updatedAccommodation;
  }

  async deleteAccommodation(id: number): Promise<boolean> {
    return this.accommodations.delete(id);
  }
}

export const storage = new MemStorage();
