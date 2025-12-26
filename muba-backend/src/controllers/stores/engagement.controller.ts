import { Request, Response, RequestHandler } from "express";
import Store from "../../models/stores.model";
import User from "../../models/users.model";
import StoreReview from "../../models/storeReview.model";

// Follow Store
// Follow Store
export const FollowStore: RequestHandler = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const userId = (req as any).user._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Use atomic update to avoid race conditions and potential schema issues with mismatched types
    // $addToSet ensures uniqueness.
    const store = await Store.findByIdAndUpdate(
      _id,
      { $addToSet: { followers: userId } },
      { new: true }
    );

    if (!store) {
      res.status(404).json({ message: "Store not found" });
      return;
    }

    res
      .status(200)
      .json({
        message: "Store followed successfully",
        followersCount: store.followers.length,
      });
  } catch (error: any) {
    console.error("Follow Store Error:", error);

    // If error is CastError on followers, it might be due to old data format (number instead of array)
    if (error.name === "CastError" || error.message.includes("followers")) {
      try {
        const currentUserId = (req as any).user?._id;
        if (currentUserId) {
            // Force reset followers to array with current user
            const resetStore = await Store.findByIdAndUpdate(
              req.params._id,
              { $set: { followers: [currentUserId] } },
              { new: true }
            );

            if (resetStore) {
              res
                .status(200)
                .json({
                  message: "Store followed successfully (data migrated)",
                  followersCount: resetStore.followers.length,
                });
              return;
            }
        }
      } catch (retryError) {
        console.error("Retry Follow Failed:", retryError);
      }
    }

    res
      .status(500)
      .json({ message: error.message || "Failed to follow store" });
  }
};

// Unfollow Store
export const UnfollowStore: RequestHandler = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const userId = (req as any).user._id;

    const store = await Store.findById(_id);
    if (!store) {
      res.status(404).json({ message: "Store not found" });
      return;
    }

    store.followers = store.followers.filter(
      (follower: any) => follower.toString() !== userId.toString()
    );
    await store.save();

    res.status(200).json({
      message: "Store unfollowed successfully",
      followersCount: store.followers.length,
    });
  } catch (error: any) {
    console.error("Unfollow Store Error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to unfollow store" });
  }
};

// Rate Store
export const RateStore: RequestHandler = async (req, res, next) => {
  try {
    const { _id } = req.params; // Store ID
    const userId = (req as any).user._id;
    const { rating, review } = req.body;

    if (!rating || !review) {
      res.status(400).json({ message: "Rating and review are required" });
      return;
    }

    const store = await Store.findById(_id);
    if (!store) {
      res.status(404).json({ message: "Store not found" });
      return;
    }

    // Create review
    const newReview = await StoreReview.create({
      store: _id,
      user: userId,
      rating,
      review,
    });

    // Add to store reviews
    store.reviews.push(newReview._id);
    store.reviewsCount = store.reviews.length;

    // Recalculate average rating
    const allReviews = await StoreReview.find({ store: _id });
    const totalRating = allReviews.reduce((sum, item) => sum + Number(item.rating), 0);
    const avgRating = totalRating / allReviews.length;
    
    store.rating = Number(avgRating.toFixed(1)); // Store as 1 decimal place number

    await store.save();

    console.log(`Store ${_id} updated: Rating ${store.rating}, Count ${store.reviewsCount}`);

    res
      .status(201)
      .json({ message: "Review submitted successfully", review: newReview, storeStats: { rating: store.rating, reviewsCount: store.reviewsCount } });
  } catch (error: any) {
    console.error("Rate Store Error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to submit review" });
  }
};

// Get Store Reviews
export const GetStoreReviews: RequestHandler = async (req, res, next) => {
  try {
    const { _id } = req.params; // Store ID

    const reviews = await StoreReview.find({ store: _id })
      .populate("user", "firstname lastname profile_img")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error: any) {
    console.error("Get Reviews Error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to fetch reviews" });
  }
};
