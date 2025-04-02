import { users, accommodations } from "../shared/schema.js";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage {
  
  users;
  accommodations;
  userCurrentId;
  accommodationCurrentId;
  sessionStore;

  constructor() {
    this.users = new Map();
    this.accommodations = new Map();
    this.userCurrentId = 1;
    this.accommodationCurrentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser) {
    const id = this.userCurrentId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAccommodation(id) {
    return this.accommodations.get(id);
  }

  async getAccommodations() {
    return Array.from(this.accommodations.values());
  }

  async getAccommodationsByUserId(userId) {
    return Array.from(this.accommodations.values()).filter(
      (accommodation) => accommodation.userId === userId,
    );
  }

  async searchAccommodations(params) {
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
        (accommodation) => accommodation.price >= params.priceMin
      );
    }
    
    if (params.priceMax !== undefined) {
      results = results.filter(
        (accommodation) => accommodation.price <= params.priceMax
      );
    }
    
    if (params.rooms !== undefined) {
      results = results.filter(
        (accommodation) => accommodation.rooms >= params.rooms
      );
    }
    
    return results;
  }

  async createAccommodation(insertAccommodation) {
    const id = this.accommodationCurrentId++;
    const accommodation = { ...insertAccommodation, id };
    this.accommodations.set(id, accommodation);
    return accommodation;
  }

  async updateAccommodation(id, accommodationUpdate) {
    const accommodation = this.accommodations.get(id);
    
    if (!accommodation) {
      return undefined;
    }
    
    const updatedAccommodation = { ...accommodation, ...accommodationUpdate };
    this.accommodations.set(id, updatedAccommodation);
    
    return updatedAccommodation;
  }

  async deleteAccommodation(id) {
    return this.accommodations.delete(id);
  }
}

export const storage = new MemStorage();
