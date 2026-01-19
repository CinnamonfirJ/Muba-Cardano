import express from "express";
import type { NextFunction, Request, Response } from "express";
import Users from "../../models/users.model.ts";

// Badge Threshold Definitions
const BADGE_RULES = {
  timelyDelivery: {
    levels: [
      { level: 1, required: 5 },
      { level: 2, required: 20 },
      { level: 3, required: 50 },
    ],
  },
  accuracy: {
    levels: [
      { level: 1, required: 5 },
      { level: 2, required: 25 },
    ],
  },
};

export const GetBadgeEligibility = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    if (!user || !user._id) {
      return res.status(401).json({ message: "User not authorized" });
    }

    const userData = await Users.findById(user._id);
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentDeliveries = userData.successful_deliveries || 0;
    
    // For "Accuracy", we'll just mock it to equal deliveries for now 
    // since we don't have a separate "accuracy" metric in the User model yet.
    // In future, this could be (successful_deliveries / total_attempts) * 100 or number of perfect ratings.
    const currentAccuracyCount = currentDeliveries; 

    // Calculate Eligibility for all levels
    const getLevelsStatus = (rules: any[], currentScore: number) => {
      return rules.map(rule => ({
        level: rule.level,
        required: rule.required,
        isEligible: currentScore >= rule.required,
        // For 'minted', we'd ideally check the blockchain or a DB record of past mints.
        // For this demo, we can just say 'isEligible' is the primary driver.
        // If we want to show 'Minted', we'd need to track that in User model.
        // Let's assume for now the frontend can track/mock this or we add it to the model.
        // Actually, let's just return the eligibility.
      }));
    };

    const timelyDeliveryLevels = getLevelsStatus(BADGE_RULES.timelyDelivery.levels, currentDeliveries);
    const accuracyLevels = getLevelsStatus(BADGE_RULES.accuracy.levels, currentAccuracyCount);

    res.status(200).json({
      success: true,
      data: {
        timelyDelivery: {
          name: "Speedster Vendor",
          current: currentDeliveries,
          levels: timelyDeliveryLevels
        },
        accuracy: {
          name: "Order Perfectionist",
          current: currentAccuracyCount,
          levels: accuracyLevels
        }
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};



