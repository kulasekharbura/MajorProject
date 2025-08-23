const mongoose = require("mongoose");
const { Schema } = mongoose;

const shopSchema = new Schema(
  {
    // A reference to the User who owns this shop. Must be a 'seller'. [cite: 105]
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // The name of the shop[cite: 87].
    name: { type: String, required: true },
    // The category of the shop (e.g., "Grocery")[cite: 89].
    category: { type: String, required: true },
    // The simple text-based location, as we decided[cite: 95, 96].
    locationName: { type: String, required: true, index: true }, // 'index: true' makes searching by location faster.
    imageUrl: { type: String },
  },
  { timestamps: true }
);

const Shop = mongoose.model("Shop", shopSchema);
module.exports = Shop;
