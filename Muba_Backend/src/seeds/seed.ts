import mongoose from "mongoose";
import dotenv from "dotenv";

import Users from "../models/users.model";
import Stores from "../models/stores.model";
import Products from "../models/products.model";
import Orders from "../models/order.model";
import StoreReview from "../models/storeReview.model";
import Cart from "../models/cart.model";

import { hash } from "../utils/hash.utils"; // ✅ USE YOUR HASH UTIL
import { dbConfig } from "../../config";

dotenv.config();

const MONGO_URI = dbConfig.uri as string;
const MONGO_NAME = dbConfig.name as string;

async function seedDatabase() {
  try {
    if (!MONGO_URI) {
      throw new Error("MongoDB URI or DB name is missing in config");
    }
    console.log("🌱 Connecting to database...");
    await mongoose.connect(MONGO_URI, {
      dbName: `${MONGO_NAME}`,
    });

    console.log("🧹 Clearing database...");

    await Orders.deleteMany({});
    await StoreReview.deleteMany({});
    await Cart.deleteMany({});
    await Products.deleteMany({});
    await Stores.deleteMany({});
    await Users.deleteMany({});

    console.log("✅ Database cleared");

    // --------------------
    // HASH PASSWORDS
    // --------------------
    const adminPassword = await hash("123456");
    const userPassword = await hash("password123");
    const vendorPassword = await hash("vendor123");

    // --------------------
    // USERS
    // --------------------
    const admin = await Users.create({
      firstname: "Sellza",
      lastname: "Admins",
      email: "sellza@example.com",
      password: adminPassword,
      role: "user",
    });

    const user = await Users.create({
      firstname: "John",
      lastname: "Doe",
      email: "john@example.com",
      password: userPassword,
      role: "user",
    });

    const vendor = await Users.create({
      firstname: "Jane",
      lastname: "Vendor",
      email: "vendor@example.com",
      password: vendorPassword,
      role: "vendor",
      vendorStatus: "accepted",
    });

    console.log("👤 Users created");

    // --------------------
    // STORE
    // --------------------
    const store = await Stores.create({
      name: "Jane’s Store",
      description: "Quality products at great prices",
      img: "https://placehold.co/600x400",
      location: "Lagos, Nigeria",
      owner: vendor._id,
      categories: ["electronics", "fashion"],
    });

    console.log("🏪 Store created");

    // --------------------
    // PRODUCT
    // --------------------
    const product = await Products.create({
      productType: "variant",
      title: "T-Shirt",
      description: "Comfortable cotton t-shirt",
      images: ["https://placehold.co/300"],
      category: ["fashion"],
      condition: "new",
      location: store.location,
      price: 5000,
      stockCount: 50,
      seller: vendor._id,
      store: store._id,
      variantType: "Color+Size",
      variants: [
        {
          name: "Red / M",
          price: 5000,
          stock: 10,
          attributes: { color: "red", size: "M" },
        },
        {
          name: "Blue / L",
          price: 5200,
          stock: 15,
          attributes: { color: "blue", size: "L" },
        },
      ],
    });

    store.products.push(product._id);
    await store.save();

    console.log("📦 Product created");

    // --------------------
    // STORE REVIEW
    // --------------------
    const review = await StoreReview.create({
      store: store._id,
      user: user._id,
      rating: 5,
      review: "Great store! Fast delivery.",
    });

    store.reviews.push(review._id);
    store.reviewsCount = 1;
    store.rating = 5;
    await store.save();

    console.log("⭐ Store review created");

    // --------------------
    // ORDER
    // --------------------
    await Orders.create({
      user_id: user._id,
      items: [
        {
          product_id: product._id,
          vendor_id: vendor._id,
          store_id: store._id,
          quantity: 2,
          price: 5000,
          name: product.title,
          img: product.images,
        },
      ],
      total: 10000,
      status: "paid",
    });

    console.log("🧾 Order created");

    console.log("🎉 Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedDatabase();
