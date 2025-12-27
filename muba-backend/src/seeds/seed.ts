import mongoose from "mongoose";
import dotenv from "dotenv";

import Users from "../models/users.model";
import Stores from "../models/stores.model";
import Products from "../models/products.model";
import Orders from "../models/order.model";
import VendorOrders from "../models/vendorOrder.model";
import StoreReview from "../models/storeReview.model";
import Cart from "../models/cart.model";
import PostOffice from "../models/postOffice.model";
import Payment from "../models/payment.models";

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
    await VendorOrders.deleteMany({});
    await StoreReview.deleteMany({});
    await Cart.deleteMany({});
    await Products.deleteMany({});
    await Stores.deleteMany({});
    await Users.deleteMany({});
    await PostOffice.deleteMany({});
    await Payment.deleteMany({});

    console.log("✅ Database cleared");

    // --------------------
    // HASH PASSWORDS
    // --------------------
    const adminPassword = await hash("123456");
    const userPassword = await hash("password123");
    const vendorPassword = await hash("vendor123");
    const postOfficePassword = await hash("postoffice123");

    // --------------------
    // USERS
    // --------------------
    const admin = await Users.create({
      firstname: "Sellza",
      lastname: "Admins",
      email: "sellza@example.com",
      password: adminPassword,
      role: "admin",
    });

    const postOffice = await Users.create({
      firstname: "Post",
      lastname: "Office",
      email: "postoffice@example.com",
      password: postOfficePassword,
      role: "post_office",
      postOfficeStatus: "accepted",
      postOfficeName: "Kill Post Office",
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
      img: "https://res.cloudinary.com/daaoayc7l/image/upload/v1766840756/download_8_vqdiqk.jpg",
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
      images: ["https://res.cloudinary.com/daaoayc7l/image/upload/v1766841304/8b81a957f67465121d5b76467a997d58d444de69_jcdjy9.png"],
      category: ["fashion"],
      condition: "new",
      location: store.location,
      price: 5000,
      stockCount: 25,
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

    // Xiaomi Redmi 10 C Phone Case - Genshin Impact
const xiaomiCase = await Products.create({
  productType: "variant",
  title: "Xiaomi Redmi 10 C Phone Case - Genshin Impact",
  description: "Protective and stylish Genshin Impact phone case for Xiaomi Redmi 10 C",
  images: [
    "https://res.cloudinary.com/daaoayc7l/image/upload/v1766841827/1756674592058_wvpcgk.jpg",
    "https://res.cloudinary.com/daaoayc7l/image/upload/v1766841827/1756674592075_wugrpx.jpg",
    "https://res.cloudinary.com/daaoayc7l/image/upload/v1766841826/1756674592064_b5jrjx.jpg",
    "https://res.cloudinary.com/daaoayc7l/image/upload/v1766841826/1756674592069_bkvjc7.jpg"
  ],
  category: ["electronics", "accessories"],
  condition: "new",
  location: store.location,
  price: 3000,
  stockCount: 50,
  seller: vendor._id,
  store: store._id,
  variantType: "Color",
  variants: [
    { name: "Red", price: 3000, stock: 25, attributes: { color: "Red" } },
    { name: "Blue", price: 3100, stock: 25, attributes: { color: "Blue" } },
  ],
});
store.products.push(xiaomiCase._id);

// iPhone Phone Case - Genshin Impact
const iphoneCase = await Products.create({
  productType: "variant",
  title: "iPhone Phone Case - Genshin Impact",
  description: "Premium Genshin Impact phone case for various iPhone models",
  images: [
    "https://res.cloudinary.com/daaoayc7l/image/upload/v1766841826/1756674592053_vz0hgj.jpg",
    "https://res.cloudinary.com/daaoayc7l/image/upload/v1766841825/1756674592042_agitvu.jpg",
    "https://res.cloudinary.com/daaoayc7l/image/upload/v1766841825/1756674592047_ujwygy.jpg",
    "https://res.cloudinary.com/daaoayc7l/image/upload/v1766841825/1756674592037_mhmizz.jpg"
  ],
  category: ["electronics", "accessories"],
  condition: "new",
  location: store.location,
  price: 3500,
  stockCount: 40,
  seller: vendor._id,
  store: store._id,
  variantType: "Color",
  variants: [
    { name: "Black", price: 3500, stock: 20, attributes: { color: "Black" } },
    { name: "White", price: 3600, stock: 20, attributes: { color: "White" } },
  ],
});
store.products.push(iphoneCase._id);

// Female Ankara Gown
const ankaraGown = await Products.create({
  productType: "variant",
  title: "Female Ankara Gown",
  description: "Elegant and colorful female Ankara gown, perfect for any occasion",
  images: [
    "https://res.cloudinary.com/daaoayc7l/image/upload/v1766841825/1756674592025_xcf7f4.jpg",
    "https://res.cloudinary.com/daaoayc7l/image/upload/v1766841825/1756674592020_ytr7zu.jpg",
    "https://res.cloudinary.com/daaoayc7l/image/upload/v1766841824/1756674592014_qpbmza.jpg"
  ],
  category: ["fashion", "women"],
  condition: "new",
  location: store.location,
  price: 15000,
  stockCount: 20,
  seller: vendor._id,
  store: store._id,
  variantType: "Size",
  variants: [
    { name: "S", price: 15000, stock: 5, attributes: { size: "S" } },
    { name: "M", price: 15000, stock: 5, attributes: { size: "M" } },
    { name: "L", price: 15000, stock: 5, attributes: { size: "L" } },
    { name: "XL", price: 15000, stock: 5, attributes: { size: "XL" } },
  ],
});
store.products.push(ankaraGown._id);

// Boba Tea Sticker
const bobaTea = await Products.create({
  productType: "single",
  title: "Boba Tea Sticker",
  description: "Cute and fun boba tea sticker for decorating laptops, notebooks, and more",
  images: [
    "https://res.cloudinary.com/daaoayc7l/image/upload/v1766841824/_Graveyard_boba_tea_with_many_ghosts__Sticker_for_Sale_by_Inkcapella_mtafti.jpg"
  ],
  category: ["accessories", "stickers"],
  condition: "new",
  location: store.location,
  price: 800,
  stockCount: 100,
  seller: vendor._id,
  store: store._id,
});
store.products.push(bobaTea._id);

    
    await store.save();

   console.log("📦 5 new products created successfully!");

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

    console.log("🎉 Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedDatabase();
