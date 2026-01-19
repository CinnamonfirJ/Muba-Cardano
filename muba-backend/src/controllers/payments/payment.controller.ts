import express from "express";
import type { Request, Response } from "express";
import Payments from "../../models/payment.models.ts";

export const GetPaymentStats = async (req: Request, res: Response) => {
  try {
    // Use MongoDB aggregation pipeline for efficiency
    const stats = await Payments.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 }, // count of payments
          totalAmount: { $sum: "$amount" }, // sum of amounts
        },
      },
    ]);

    res.status(200).json({
      success: true,
      totalPayments: stats[0]?.totalPayments || 0,
      totalAmount: stats[0]?.totalAmount || 0,
    });
  } catch (err) {
    console.error("Error fetching payment stats:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};



