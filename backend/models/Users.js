const mongoose = require("mongoose");
const { Schema } = mongoose;

// This defines the structure for a user's cart.
// It will be an array inside the User document.
const cartItemSchema = new Schema({
  // A reference to the specific Item being added to the cart.
  item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
  quantity: { type: Number, required: true, default: 1 },
});

const userSchema = new Schema(
  {
    // Username for logging in [cite: 24]
    username: { type: String, required: true, unique: true },
    // User's actual name [cite: 25]
    realName: { type: String, required: true },
    // User's email, must be unique [cite: 27]
    email: { type: String, required: true, unique: true },
    // Password will be stored in a hashed format, not plain text.
    password: { type: String, required: true },
    // This field distinguishes between user types.
    role: {
      type: String,
      required: true,
      enum: ["consumer", "seller", "delivery_boy"], // Restricts the value to one of these three.
      default: "consumer",
    },
    // An array to store multiple delivery addresses for a consumer[cite: 29].
    addresses: [{ type: String }],
    // The shopping cart for a consumer, using the schema defined above.
    cart: [cartItemSchema],
  },
  { timestamps: true }
); // Automatically adds createdAt and updatedAt fields.

// Create the model from the schema and export it.
const User = mongoose.model("User", userSchema);
module.exports = User;
