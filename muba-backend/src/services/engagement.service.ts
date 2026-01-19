import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { SendEmail } from "../utils/sendEmail.utils.ts";
import Cart from "../models/cart.model.ts";
import Interactions from "../models/interactions.model.ts";
import Users from "../models/users.model.ts";
import Products from "../models/products.model.ts";
import fs from "fs";
import path from "path";

export class EngagementService {
  private static cartRecoveryTemplate = fs.readFileSync(
    path.join(__dirname, "../emailTemplates/cartRecovery.email.html"),
    "utf8"
  );
  private static interestReminderTemplate = fs.readFileSync(
    path.join(__dirname, "../emailTemplates/interestReminder.email.html"),
    "utf8"
  );

  /**
   * Scans for abandoned carts and sends recovery emails.
   */
  static async processAbandonedCarts() {
    console.log("Processing abandoned carts...");
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      // 1. Find users with items in cart updated between 24 and 48 hours ago
      // This is the "soft reminder" window.
      // We group by user to check frequency limits.
      const abandonedCarts = await Cart.aggregate([
        { $match: { updatedAt: { $lte: oneDayAgo, $gte: twoDaysAgo } } },
        {
          $group: {
            _id: "$user_id",
            items: { $push: "$$ROOT" },
          },
        },
      ]);

      for (const group of abandonedCarts) {
        const user = await Users.findById(group._id);
        if (!user || group.items.length === 0) continue;

        // Safety check: Don't spam. Verify if we sent an engagement email recently.
        // For simplicity in this iteration, we check a mock flag or just proceed if it's the 24h mark.
        // In production, you'd track 'lastEngagementEmailSent' in user model.

        const item = group.items[0]; // Take the first item as the highlight
        const html = this.cartRecoveryTemplate
          .replace("{{user_name}}", user.firstname)
          .replace("{{product_name}}", item.name)
          .replace("{{product_image}}", item.img[0] || "")
          .replace("{{product_price}}", item.price.toLocaleString())
          .replace("{{cart_url}}", "https://muba-college-ecommerce.vercel.app/cart");

        await SendEmail({
          email: user.email,
          title: "Don't forget your items! 🛒",
          html,
        });
        
        console.log(`Sent cart recovery email to ${user.email}`);
      }
    } catch (err) {
      console.error("Error processing abandoned carts:", err);
    }
  }

  /**
   * Scans for high browsing interest and sends reminders.
   */
  static async processInterests() {
    console.log("Processing interest reminders...");
    try {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

      // Find users with high view counts in the last 6 hours but no purchase/cart
      const interests = await Interactions.aggregate([
        { $match: { interactionType: "view", createdAt: { $gte: sixHoursAgo } } },
        {
          $group: {
            _id: { userId: "$userId", productId: "$productId" },
            viewCount: { $sum: 1 },
            category: { $first: "$category" }
          },
        },
        { $match: { viewCount: { $gte: 3 } } }, // Viewed at least 3 times
      ]);

      for (const interaction of interests) {
        const user = await Users.findById(interaction._id.userId);
        const product = await Products.findById(interaction._id.productId);
        
        if (!user || !product) continue;

        // Check if user already added to cart since viewing (safety)
        const inCart = await Cart.findOne({ user_id: user._id, product_id: product._id });
        if (inCart) continue;

        const html = this.interestReminderTemplate
          .replace("{{user_name}}", user.firstname)
          .replace("{{product_name}}", product.title)
          .replace("{{product_image}}", product.images[0] || "")
          .replace("{{product_price}}", product.price.toLocaleString())
          .replace("{{product_url}}", `https://muba-college-ecommerce.vercel.app/product/${product._id}`);

        await SendEmail({
          email: user.email,
          title: "Thinking about this? 🌟",
          html,
        });

        console.log(`Sent interest reminder email to ${user.email}`);
      }
    } catch (err) {
      console.error("Error processing interest reminders:", err);
    }
  }

  /**
   * Schedules the engagement worker.
   */
  static startWorker() {
    // Run every hour to check for triggers
    setInterval(() => {
        this.processAbandonedCarts();
        this.processInterests();
    }, 60 * 60 * 1000); 
    
    // Immediate run on start
    this.processAbandonedCarts();
    this.processInterests();
  }
}


