import express from "express";
import type { Request, Response } from "express";
import Users from "../../models/users.model.ts";

export const GetUsers = async (req: Request, res: Response) => {
    try {
        const users = await Users.find({ role: "user" })
                                    .select("-password")
                                    .lean()
        if (!users) {
            return res.status(403).json({ message: "No User Found" });
        }

        return res.status(200).json({
            message: "Request Successful",
            data: users
        });
    } catch (err) {
        console.error(`Internal Server Error: ${err}`);
        return res.status(500).json({ message: `Internal Server Error ${err}`});
    }
}

export const GetUser = async (req: Request, res: Response) => {
    // const user_id = req.user as Express.UserPayload;
    const { _id } = req.params;
    
    try {
        const user = await Users.findById(_id)
                                    .select("-password")
                                    .populate({
                                        path: "stores",
                                        populate: {
                                            path: "products"
                                        }
                                    })
                                    .lean();

        if (!user) {
            return res.status(403).json({ message: "User not Found" });
        }

        return res.status(200).json({
            message: "Request Successfull",
            data: user
        });
    } catch (err) {
        console.error(`Internal Server Error: ${err}`);
        return res.status(500).json({ message: `Internal Server Error ${err}`});
    }
}


