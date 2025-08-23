// server.js (replace your existing file contents with this)
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

// basic env checks / defaults
const mongoURI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;
const PORT = process.env.PORT || 8080;

if (!mongoURI) {
  console.error("MONGO_URI is not set in .env");
  process.exit(1);
}
if (!SESSION_SECRET) {
  console.error("SESSION_SECRET is not set in .env");
  process.exit(1);
}

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

//-------------------------------------------------//
//import models
const User = require("./models/Users");
const Order = require("./models/Orders");
const Item = require("./models/Items");
const Shop = require("./models/Shops");
//------------------------------------------------//

// ---------- Passport + session setup (STEP 1) ----------
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");

// session middleware (must be applied before routes)
app.use(
  session({
    name: "allintown.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoURI,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      // set secure true in production (when using HTTPS)
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    },
  })
);

// initialize passport after session middleware
app.use(passport.initialize());
app.use(passport.session());

// LocalStrategy: allow login by username OR email (field: emailOrUsername)
passport.use(
  new LocalStrategy(
    { usernameField: "emailOrUsername", passwordField: "password" },
    async (emailOrUsername, password, done) => {
      try {
        const user = await User.findOne({
          $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
        });
        if (!user) return done(null, false, { message: "Invalid credentials" });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return done(null, false, { message: "Invalid credentials" });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// serialize -> store user id in session
passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

// deserialize -> attach user object (without password) to req.user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-password").lean();
    if (!user) return done(null, false);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// helper to protect routes
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ error: "Unauthenticated" });
}
// ---------- end passport/session setup ----------

//------------------------------------------------//
// Example routes (home & shops) — unchanged from your code
app.get("/home", async (req, res) => {
  try {
    const loc = req.query.location;
    if (!loc)
      return res
        .status(400)
        .json({ error: "location query param is required" });

    const shops = await Shop.find({
      locationName: { $regex: `^${loc}$`, $options: "i" },
    }).lean();

    return res.json({ count: shops.length, shops });
  } catch (err) {
    console.error("GET /home error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/shops/:id", async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).lean();
    if (!shop) return res.status(404).json({ error: "Shop not found" });
    res.json({ shop });
  } catch (err) {
    console.error("GET /shops/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/shops/:id/items", async (req, res) => {
  try {
    const items = await Item.find({
      shop: req.params.id,
      isAvailable: true,
    }).lean();
    res.json({ count: items.length, items });
  } catch (err) {
    console.error("GET /shops/:id/items error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ----------------- AUTH ROUTES (STEP 2) -----------------

// Register: create user and auto-login
app.post("/auth/register", async (req, res) => {
  try {
    const { username, realName, email, password, role = "consumer" } = req.body;
    if (!username || !realName || !email || !password) {
      return res
        .status(400)
        .json({ error: "username, realName, email and password required" });
    }

    // unique check
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing)
      return res
        .status(409)
        .json({ error: "Username or email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      realName,
      email,
      password: hashed,
      role,
    });
    await user.save();

    // auto-login: creates session cookie
    req.logIn(user, (err) => {
      if (err) {
        console.error("Auto login after register failed:", err);
        return res.status(201).json({
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        });
      }
      const safeUser = {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      };
      return res.json({ user: safeUser });
    });
  } catch (err) {
    console.error("POST /auth/register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login: passport-local
app.post("/auth/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("POST /auth/login error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (!user) {
      return res
        .status(401)
        .json({ error: info?.message || "Invalid credentials" });
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error("req.logIn error:", err);
        return res.status(500).json({ error: "Login failed" });
      }
      const safeUser = {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      };
      return res.json({ user: safeUser });
    });
  })(req, res, next);
});

// Logout: destroy session & cookie
app.post("/auth/logout", (req, res) => {
  // passport 0.6+ expects callback for logout
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Logout failed" });
    }
    // destroy session on server
    req.session?.destroy(() => {
      res.clearCookie("allintown.sid");
      res.json({ ok: true });
    });
  });
});

// Me: return current user (or null)
app.get("/auth/me", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated())
    return res.json({ user: null });
  // req.user is already safe (we used .select("-password") in deserializeUser)
  return res.json({ user: req.user });
});

// ----------------- CART ENDPOINTS (protected) -----------------

// GET /cart  => get server-side cart for logged-in user
app.get("/cart", ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "cart.item",
        model: "Item",
        select: "name price shop",
        populate: { path: "shop", model: "Shop", select: "name" },
      })
      .lean();

    // transform cart items into friendly shape
    const cart = (user.cart || []).map((ci) => {
      const item = ci.item || {};
      const shop = item.shop || {};
      // price choose perPiece > perUnit > per100gm
      const priceVal =
        item.price?.perPiece ??
        item.price?.perUnit ??
        item.price?.per100gm ??
        null;
      return {
        itemId: item._id,
        name: item.name,
        shopId: shop._id,
        shopName: shop.name,
        price: priceVal,
        quantity: ci.quantity,
      };
    });

    return res.json({
      cart,
      count: cart.reduce((s, it) => s + (it.quantity || 0), 0),
    });
  } catch (err) {
    console.error("GET /cart error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /cart/add  => add an item to logged-in user's cart
app.post("/cart/add", ensureAuthenticated, async (req, res) => {
  try {
    const { itemId, quantity = 1 } = req.body;
    if (!itemId) return res.status(400).json({ error: "itemId required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const idx = user.cart.findIndex((ci) => String(ci.item) === String(itemId));
    if (idx >= 0) {
      user.cart[idx].quantity = Math.min(
        999,
        user.cart[idx].quantity + Number(quantity)
      );
    } else {
      user.cart.push({ item: itemId, quantity: Number(quantity) });
    }
    await user.save();

    const cartCount = user.cart.reduce((a, c) => a + c.quantity, 0);
    return res.json({ ok: true, cartCount });
  } catch (err) {
    console.error("POST /cart/add error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
// POST /cart/merge  => merge an array of items into logged-in user's cart
// Body: { items: [ { itemId, quantity }, ... ] }
app.post("/cart/merge", ensureAuthenticated, async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length)
      return res.status(400).json({ error: "items array required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Build a map of itemId -> quantity to add (coerce to integer)
    const toAdd = items.reduce((acc, it) => {
      if (!it || !it.itemId) return acc;
      const q = Math.max(0, parseInt(it.quantity || 0, 10));
      if (!acc[it.itemId]) acc[it.itemId] = 0;
      acc[it.itemId] += q;
      return acc;
    }, {});

    // Merge: for each itemId, either increase existing entry or push new
    for (const [itemId, addQty] of Object.entries(toAdd)) {
      if (addQty <= 0) continue;
      const idx = user.cart.findIndex(
        (ci) => String(ci.item) === String(itemId)
      );
      if (idx >= 0) {
        user.cart[idx].quantity = Math.min(
          999,
          user.cart[idx].quantity + addQty
        );
      } else {
        user.cart.push({ item: itemId, quantity: Math.min(999, addQty) });
      }
    }

    await user.save();

    const cartCount = user.cart.reduce((s, ci) => s + (ci.quantity || 0), 0);
    return res.json({ ok: true, count: cartCount });
  } catch (err) {
    console.error("POST /cart/merge error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//---------------------------------------------------//

// connect mongoose and start server
app.listen(PORT, async () => {
  console.log(`app listening on port ${PORT}`);
  try {
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected successfully!");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  }
});
