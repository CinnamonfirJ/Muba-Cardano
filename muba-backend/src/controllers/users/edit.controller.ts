import express from "express";
import type { Request, Response } from "express";
import Users from "../../models/users.model.ts";

export const UpdateUser = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    const updateData = req.body;

    // Prevent password updates through this endpoint for safety
    delete updateData.password;
    delete updateData.role;
    delete updateData.email; // Email usually shouldn't be changed this way

    const user = await Users.findByIdAndUpdate(_id, updateData, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User updated successfully",
      data: user,
    });
  } catch (err) {
    console.error("Update User Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


