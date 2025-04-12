import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectMongo from "connect-mongo";
import { ObjectId } from "mongodb";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app, db, clientPromise) {
  const sessionStore = connectMongo.create({
    clientPromise: clientPromise,
    collectionName: "sessions",
    stringify: false,
  });

  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "room-accommodation-secret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    }, async (email, password, done) => {
      try {
        const user = await db.collection("users").findOne({ email });
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log("Serializing user with role:", user.role);
    done(null, user._id.toString());
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await db.collection("users").findOne({ _id: new ObjectId(id) });
      console.log("Deserialized user with role:", user.role);
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, name, role } = req.body;
      
      console.log("Registration attempt with data:", { email, name, role });
      
      if (!email || !password || !name || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Validate role
      if (role !== "owner" && role !== "tenant") {
        console.log("Invalid role received:", role);
        return res.status(400).json({ message: "Invalid role. Must be 'owner' or 'tenant'" });
      }
      
      const existingUser = await db.collection("users").findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const hashedPassword = await hashPassword(password);
      const userData = {
        email,
        name,
        password: hashedPassword,
        role,
      };
      
      console.log("Inserting user with role:", role);
      const result = await db.collection("users").insertOne(userData);
      
      const user = await db.collection("users").findOne({ _id: result.insertedId });
      if (!user) { throw new Error("User creation failed after insert"); }

      console.log("User created with role:", user.role);
      
      const userResponse = { ...user };
      delete userResponse.password;

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userResponse);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        const userResponse = { ...user };
        delete userResponse.password;
        
        return res.status(200).json(userResponse);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    console.log("User info requested for:", req.user._id);
    console.log("User role in session:", req.user.role);
    
    const userResponse = { ...req.user };
    delete userResponse.password;
    
    console.log("Sending user response with role:", userResponse.role);
    res.json(userResponse);
  });
}
