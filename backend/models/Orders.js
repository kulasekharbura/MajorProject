const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    // A unique, human-readable code for the order[cite: 65].
    orderCode: { type: String, required: true, unique: true },
    // Reference to the 'consumer' who placed the order.
    consumer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Reference to the Shop the order was placed with.
    shop: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    // We store a copy of item details here.
    // This is important so the order record doesn't change if the original item price is updated.
    items: [
      {
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    // The final calculated bill for the order[cite: 44].
    totalBill: { type: Number, required: true },
    // The delivery address used for this specific order.
    deliveryAddress: { type: String, required: true },
    // Payment details, including method (COD, UPI) and status[cite: 42, 51].
    paymentDetails: {
      method: String,
      status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
      },
    },
    // The current status of the order.
    status: {
      type: String,
      enum: ["placed", "confirmed", "shipped", "delivered", "cancelled"],
      default: "placed",
    },
    // Reference to the 'delivery_boy' assigned to this order.
    deliveryBoy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
