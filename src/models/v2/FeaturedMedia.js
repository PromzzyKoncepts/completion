const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

// In your media schema file
const featuredOrderSchema = new mongoose.Schema({
  media: { type: mongoose.Schema.Types.ObjectId, ref: "Media", required: true },
  order: { type: Number, required: true },
  type: { type: String, enum: ["video", "article"], required: true }
}, { timestamps: true });


featuredOrderSchema.virtual("authorRole", {
    ref: "Users",
    localField: "author",
    foreignField: "_id",
    justOne: true,
    options: { select: "accountType" } // Fetch only the accountType field
});

// / Ensure virtuals are included when converting to JSON or Objects
featuredOrderSchema.set("toObject", { virtuals: true });
featuredOrderSchema.set("toJSON", { virtuals: true });
const FeaturedOrder = mongooseV2.model("FeaturedOrder", featuredOrderSchema);

// Add to your exports if needed
module.exports.FeaturedOrder = FeaturedOrder;