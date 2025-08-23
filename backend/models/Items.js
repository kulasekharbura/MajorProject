const mongoose = require("mongoose");
const { Schema } = mongoose;

const itemSchema = new Schema(
  {
    // A reference to the Shop this item belongs to.
    shop: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    // The name of the item/product[cite: 91, 111].
    name: { type: String, required: true },
    // A description of the item[cite: 63, 113].
    description: { type: String },
    // The category of the item[cite: 112].
    category: { type: String, required: true },
    // A flexible object to handle different pricing units[cite: 92, 114, 115, 116].
    price: {
      perPiece: Number,
      per100gm: Number,
      perUnit: Number, // For other general units.
    },
    // To track if the item is in stock or not[cite: 63, 92].
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Item = mongoose.model("Item", itemSchema);
module.exports = Item;
