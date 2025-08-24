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

// ----------------- PUBLIC API ROUTES -----------------

// GET /api/locations => Get a unique list of all shop locations
app.get("/api/locations", async (req, res) => {
  try {
    // .distinct() finds all unique values for a given field in a collection.
    const locations = await Shop.distinct("locationName");
    res.json({ locations });
  } catch (err) {
    console.error("GET /api/locations error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
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
    })
      .populate("owner", "realName email")
      .lean();

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

// ----------------- AUTH ROUTES -----------------

// Register: create user and auto-login
app.post("/auth/register", async (req, res) => {
  try {
    const {
      username,
      realName,
      email,
      password,
      role = "consumer",
      locationName,
    } = req.body;
    if (!username || !realName || !email || !password) {
      return res
        .status(400)
        .json({ error: "username, realName, email and password required" });
    }

    // Check if locationName is required for the specified role
    if ((role === "seller" || role === "delivery_boy") && !locationName) {
      return res
        .status(400)
        .json({ error: "Location is required for sellers and delivery boys" });
    }

    // unique check
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing)
      return res
        .status(409)
        .json({ error: "Username or email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = {
      username,
      realName,
      email,
      password: hashed,
      role,
    };

    if (role === "seller" || role === "delivery_boy") {
      newUser.locationName = locationName;
    }

    const user = new User(newUser);
    await user.save();

    // auto-login: creates session cookie
    req.logIn(user, (err) => {
      if (err) {
        console.error("Auto login after register failed:", err);
        // On auto-login failure, just return the user data without a session
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
      // If auto-login is successful, return user with session
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

// GET /cart => get server-side cart for logged-in user
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

// POST /cart/add => add an item to logged-in user's cart
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

// POST /cart/merge => merge an array of items into logged-in user's cart
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

// POST /cart/remove => remove a single item from the logged-in user's cart
app.post("/cart/remove", ensureAuthenticated, async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({ error: "itemId is required" });
    }
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { cart: { item: itemId } },
    });
    res.json({ ok: true, message: "Item removed" });
  } catch (err) {
    console.error("POST /cart/remove error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/cart/clear", ensureAuthenticated, async (req, res) => {
  try {
    // Find the user and update their cart to an empty array
    await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });
    res.json({ ok: true, message: "Cart cleared successfully" });
  } catch (err) {
    console.error("POST /cart/clear error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
// ----------------- USER PROFILE & ADDRESS API (protected) -----------------

// Update user profile
app.put("/api/profile", ensureAuthenticated, async (req, res) => {
  try {
    const { realName } = req.body;
    if (!realName) {
      return res.status(400).json({ error: "Full name is required" });
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { realName } },
      { new: true, runValidators: true }
    ).select("-password");
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error("PUT /api/profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add a new address
app.post("/api/addresses", ensureAuthenticated, async (req, res) => {
  try {
    const { address } = req.body;
    if (!address || typeof address !== "string" || address.trim() === "") {
      return res.status(400).json({ error: "A valid address is required" });
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { addresses: address.trim() } },
      { new: true }
    ).select("-password");
    res.json({ message: "Address added successfully", user: updatedUser });
  } catch (err) {
    console.error("POST /api/addresses error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete an address
app.delete("/api/addresses", ensureAuthenticated, async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: "Address to remove is required" });
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { addresses: address } },
      { new: true }
    ).select("-password");
    res.json({ message: "Address removed successfully", user: updatedUser });
  } catch (err) {
    console.error("DELETE /api/addresses error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ----------------- SELLER API (protected) -----------------

// Middleware to ensure the user is a seller
function ensureSeller(req, res, next) {
  if (req.user && req.user.role === "seller") {
    return next();
  }
  return res.status(403).json({ error: "Forbidden: Access denied" });
}

// POST /api/shops => Create a new shop
app.post("/api/shops", ensureAuthenticated, ensureSeller, async (req, res) => {
  try {
    const { name, category, locationName, imageUrl } = req.body;
    if (!name || !category || !locationName) {
      return res
        .status(400)
        .json({ error: "Name, category, and location are required." });
    }

    const newShop = new Shop({
      owner: req.user._id, // The owner is the currently logged-in user
      name,
      category,
      locationName,
      imageUrl,
    });

    await newShop.save();
    res
      .status(201)
      .json({ message: "Shop created successfully", shop: newShop });
  } catch (err) {
    console.error("POST /api/shops error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/seller/shops => Get all shops owned by the logged-in seller
app.get(
  "/api/seller/shops",
  ensureAuthenticated,
  ensureSeller,
  async (req, res) => {
    try {
      const shops = await Shop.find({ owner: req.user._id }).sort({
        createdAt: -1,
      });
      res.json({ shops });
    } catch (err) {
      console.error("GET /api/seller/shops error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
// ... (inside SELLER API section)
// PUT /api/shops/:shopId => Update an existing shop
app.put(
  "/api/shops/:shopId",
  ensureAuthenticated,
  ensureSeller,
  async (req, res) => {
    try {
      const { shopId } = req.params;
      const { name, category, locationName, imageUrl } = req.body;

      if (!name || !category || !locationName) {
        return res
          .status(400)
          .json({ error: "Name, category, and location are required." });
      }

      // Find the shop and verify the current user is the owner
      const shop = await Shop.findOne({ _id: shopId, owner: req.user._id });

      if (!shop) {
        return res.status(404).json({
          error: "Shop not found or you do not have permission to edit it.",
        });
      }

      // Update the shop's properties
      shop.name = name;
      shop.category = category;
      shop.locationName = locationName;
      shop.imageUrl = imageUrl;

      await shop.save();
      res.json({ message: "Shop updated successfully", shop });
    } catch (err) {
      console.error("PUT /api/shops/:shopId error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/shops/:shopId/items => Get all items for a specific shop owned by the seller
app.get(
  "/api/shops/:shopId/items",
  ensureAuthenticated,
  ensureSeller,
  async (req, res) => {
    try {
      const { shopId } = req.params;
      // Verify the seller owns this shop
      const shop = await Shop.findOne({ _id: shopId, owner: req.user._id });
      if (!shop) {
        return res
          .status(404)
          .json({ error: "Shop not found or you do not own this shop." });
      }

      const items = await Item.find({ shop: shopId }).sort({ createdAt: -1 });
      res.json({ items });
    } catch (err) {
      console.error("GET /api/shops/:shopId/items error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/shops/:shopId/items => Create a new item for a specific shop
app.post(
  "/api/shops/:shopId/items",
  ensureAuthenticated,
  ensureSeller,
  async (req, res) => {
    try {
      const { shopId } = req.params;
      const { name, description, category, price, imageUrl } = req.body;

      if (!name || !category || !price || !price.perPiece) {
        return res.status(400).json({
          error: "Name, category, and price (perPiece) are required.",
        });
      }

      // Verify the seller owns this shop before adding an item
      const shop = await Shop.findOne({ _id: shopId, owner: req.user._id });
      if (!shop) {
        return res
          .status(404)
          .json({ error: "Shop not found or you do not own this shop." });
      }

      const newItem = new Item({
        shop: shopId,
        name,
        description,
        category,
        price, // Expects an object like { perPiece: 100 }
        imageUrl,
      });

      await newItem.save();
      res
        .status(201)
        .json({ message: "Item created successfully", item: newItem });
    } catch (err) {
      console.error("POST /api/shops/:shopId/items error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/items/:itemId => Update an existing item
app.put(
  "/api/items/:itemId",
  ensureAuthenticated,
  ensureSeller,
  async (req, res) => {
    try {
      const { itemId } = req.params;
      const { name, description, category, price, imageUrl } = req.body;

      if (!name || !category || !price || !price.perPiece) {
        return res
          .status(400)
          .json({ error: "Name, category, and price are required." });
      }

      // Find the item to verify ownership via the shop
      const item = await Item.findById(itemId);
      if (!item) {
        return res.status(404).json({ error: "Item not found." });
      }

      const shop = await Shop.findOne({ _id: item.shop, owner: req.user._id });
      if (!shop) {
        return res
          .status(403)
          .json({ error: "You do not have permission to edit this item." });
      }

      // Update the item's properties
      item.name = name;
      item.description = description;
      item.category = category;
      item.price = price;
      item.imageUrl = imageUrl;

      await item.save();
      res.json({ message: "Item updated successfully", item });
    } catch (err) {
      console.error("PUT /api/items/:itemId error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.delete(
  "/api/items/:itemId",
  ensureAuthenticated,
  ensureSeller,
  async (req, res) => {
    try {
      const { itemId } = req.params;

      // Find the item to get its shop ID
      const item = await Item.findById(itemId);
      if (!item) {
        return res.status(404).json({ error: "Item not found." });
      }

      // Verify the seller owns the shop this item belongs to
      const shop = await Shop.findOne({ _id: item.shop, owner: req.user._id });
      if (!shop) {
        return res
          .status(403)
          .json({ error: "You do not have permission to delete this item." });
      }

      // If ownership is confirmed, delete the item
      await Item.findByIdAndDelete(itemId);

      res.json({ message: "Item deleted successfully" });
    } catch (err) {
      console.error("DELETE /api/items/:itemId error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
// ----------------- ORDER API (protected) -----------------

// POST /api/orders => Place a new order
app.post("/api/orders", ensureAuthenticated, async (req, res) => {
  try {
    const { deliveryAddress, paymentMethod } = req.body;
    if (!deliveryAddress || !paymentMethod) {
      return res
        .status(400)
        .json({ error: "Delivery address and payment method are required." });
    }

    const user = await User.findById(req.user._id).populate("cart.item");
    if (!user || !user.cart || user.cart.length === 0) {
      return res.status(400).json({ error: "Your cart is empty." });
    }

    // Assume all items are from the same shop for this version
    const shopId = user.cart[0].item.shop;

    // Calculate total bill and format items for the order
    let totalBill = 0;
    const orderItems = user.cart.map((cartItem) => {
      const item = cartItem.item;
      const price = item.price.perPiece || 0;
      totalBill += price * cartItem.quantity;
      return {
        name: item.name,
        price: price,
        quantity: cartItem.quantity,
      };
    });

    // Create a unique, human-readable order code
    const orderCode = `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 5)
      .toUpperCase()}`;

    const newOrder = new Order({
      orderCode,
      consumer: user._id,
      shop: shopId,
      items: orderItems,
      totalBill,
      deliveryAddress,
      paymentDetails: {
        method: paymentMethod,
        status: "pending", // Or 'completed' if using a pre-paid method
      },
      status: "placed",
    });

    await newOrder.save();

    // Clear the user's cart
    user.cart = [];
    await user.save();

    res
      .status(201)
      .json({ message: "Order placed successfully!", order: newOrder });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/seller/orders => Get all orders for the logged-in seller's shops
app.get(
  "/api/seller/orders",
  ensureAuthenticated,
  ensureSeller,
  async (req, res) => {
    try {
      // 1. Find all shops owned by the seller
      const sellerShops = await Shop.find({ owner: req.user._id }).select(
        "_id"
      );
      const shopIds = sellerShops.map((shop) => shop._id);

      // 2. Find all orders where the 'shop' field is in the seller's list of shop IDs
      const orders = await Order.find({ shop: { $in: shopIds } })
        .populate("consumer", "realName") // 3. Populate consumer's name
        .populate("deliveryBoy", "realName") // Also populate delivery boy's name
        .sort({ createdAt: -1 }); // Show newest orders first

      res.json({ orders });
    } catch (err) {
      console.error("GET /api/seller/orders error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/seller/orders/:orderId => Get a single order for the logged-in seller
app.get(
  "/api/seller/orders/:orderId",
  ensureAuthenticated,
  ensureSeller,
  async (req, res) => {
    try {
      const { orderId } = req.params;

      // 1. Find the order and populate related data
      const order = await Order.findById(orderId)
        .populate("consumer", "realName email")
        .populate({ path: "shop", select: "name locationName owner" })
        .populate("deliveryBoy", "realName");

      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      // 2. Verify the seller owns the shop associated with this order
      if (order.shop.owner.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ error: "You do not have permission to view this order." });
      }

      res.json({ order });
    } catch (err) {
      console.error("GET /api/seller/orders/:orderId error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
// PUT /api/seller/orders/:orderId/status => Update an order status (used for confirming/cancelling)
app.put(
  "/api/seller/orders/:orderId/status",
  ensureAuthenticated,
  ensureSeller,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      // Validate the new status
      const validStatuses = [
        "placed",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status provided." });
      }

      // Find the order
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      // Verify the seller owns the shop associated with this order
      const shop = await Shop.findById(order.shop);
      if (!shop || shop.owner.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ error: "You do not have permission to update this order." });
      }

      // Update the status and save
      order.status = status;
      await order.save();

      const updatedOrder = await Order.findById(orderId)
        .populate("consumer", "realName email")
        .populate("shop", "name")
        .populate("deliveryBoy", "realName");

      res.json({
        message: `Order status updated to ${status}`,
        order: updatedOrder,
      });
    } catch (err) {
      console.error("PUT /api/seller/orders/:orderId/status error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
// GET /api/delivery-personnel => Get all users with the delivery_boy role
app.get(
  "/api/delivery-personnel",
  ensureAuthenticated,
  ensureSeller,
  async (req, res) => {
    try {
      const { location } = req.query; // Get location from query params
      const filter = { role: "delivery_boy" };
      if (location) {
        filter.locationName = location;
      }
      const deliveryPersonnel = await User.find(filter).select("realName");
      res.json({ deliveryPersonnel });
    } catch (err) {
      console.error("GET /api/delivery-personnel error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/seller/orders/:orderId/assign => Assign an order to a delivery person
app.put(
  "/api/seller/orders/:orderId/assign",
  ensureAuthenticated,
  ensureSeller,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { deliveryBoyId } = req.body;

      if (!deliveryBoyId) {
        return res.status(400).json({ error: "Delivery Boy ID is required." });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      // Verify the seller owns the shop associated with this order
      const shop = await Shop.findById(order.shop);
      if (!shop || shop.owner.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ error: "You do not have permission to update this order." });
      }

      // Check if the order is in a state that can be assigned
      if (order.status !== "confirmed") {
        return res.status(400).json({
          error: "Order must be 'confirmed' to be assigned for delivery.",
        });
      }

      // Assign the delivery person and update the status to 'shipped'
      order.deliveryBoy = deliveryBoyId;
      order.status = "shipped";
      await order.save();

      const updatedOrder = await Order.findById(orderId)
        .populate("consumer", "realName email")
        .populate("shop", "name")
        .populate("deliveryBoy", "realName");

      res.json({
        message: "Order assigned and marked as shipped!",
        order: updatedOrder,
      });
    } catch (err) {
      console.error("PUT /api/seller/orders/:orderId/assign error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/my-orders => get all orders for a consumer
app.get("/api/my-orders", ensureAuthenticated, async (req, res) => {
  try {
    const orders = await Order.find({ consumer: req.user._id })
      .populate("shop", "name") // Get the shop's name
      .populate("deliveryBoy", "realName") // Populate delivery boy's name
      .sort({ createdAt: -1 }); // Show newest orders first

    res.json({ orders });
  } catch (err) {
    console.error("GET /api/my-orders error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ----------------- DELIVERY BOY API (protected) -----------------

// Middleware to ensure the user is a delivery boy
function ensureDeliveryBoy(req, res, next) {
  if (req.user && req.user.role === "delivery_boy") {
    return next();
  }
  return res.status(403).json({ error: "Forbidden: Access denied" });
}

// GET /api/delivery/my-orders => get all orders assigned to the logged-in delivery boy
app.get(
  "/api/delivery/my-orders",
  ensureAuthenticated,
  ensureDeliveryBoy,
  async (req, res) => {
    try {
      const orders = await Order.find({ deliveryBoy: req.user._id })
        .populate("consumer", "realName addresses")
        .populate("shop", "name locationName")
        .sort({ createdAt: -1 });

      res.json({ orders });
    } catch (err) {
      console.error("GET /api/delivery/my-orders error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/delivery/orders/:orderId/status => allow delivery boy to update order status
app.put(
  "/api/delivery/orders/:orderId/status",
  ensureAuthenticated,
  ensureDeliveryBoy,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      // Delivery boy can only mark an order as 'delivered'
      if (status !== "delivered") {
        return res
          .status(400)
          .json({
            error:
              "Invalid status update. Delivery boys can only mark orders as 'delivered'.",
          });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      // Verify this order is assigned to the current delivery boy
      if (order.deliveryBoy.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ error: "You do not have permission to update this order." });
      }

      // Only allow updating from 'shipped' to 'delivered'
      if (order.status !== "shipped") {
        return res
          .status(400)
          .json({
            error: "Order must be 'shipped' to be marked as 'delivered'.",
          });
      }

      order.status = status;
      await order.save();

      const updatedOrder = await Order.findById(orderId)
        .populate("consumer", "realName email")
        .populate("shop", "name")
        .populate("deliveryBoy", "realName");

      res.json({
        message: `Order status updated to ${status}`,
        order: updatedOrder,
      });
    } catch (err) {
      console.error("PUT /api/delivery/orders/:orderId/status error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

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
