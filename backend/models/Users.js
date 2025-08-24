const mongoose = require("mongoose");
const { Schema } = mongoose;

const cartItemSchema = new Schema({
  item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
  quantity: { type: Number, required: true, default: 1 },
});

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    realName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["consumer", "seller", "delivery_boy"],
      default: "consumer",
    },
    // The location of the user, primarily for sellers and delivery boys
    locationName: { type: String },
    addresses: [{ type: String }],
    cart: [cartItemSchema],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
