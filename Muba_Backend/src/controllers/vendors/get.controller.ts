import { Request, Response } from "express";
import Users from "../../models/users.model";

export const GetVendors = async (req: Request, res: Response) => {
    try {
        const vendors = await Users.find({ role: "vendor" })
                                    .populate({
                                        path: "stores"
                                    })
                                    .lean();

        return res.status(200).json({
            message: "Request Successfull",
            data: vendors  // this would return [] because there's no vendor in the database
        });
    } catch (err) {
        console.error(`Internal Server Error: ${err}`);
        return res.status(500).json({ message: `Internal Server Error ${err}`});
    }
}

export const GetVendor = async (req: Request, res: Response) => {
    const { _id } = req.params;
    
    try {
        const vendor = await Users.findById(_id)
                                    .populate({ path: "stores" })
                                    .lean();

        return res.status(200).json({
            message: "Request Successfull",
            data: vendor
        });
    } catch (err) {
        console.error(`Internal Server Error: ${err}`);
        return res.status(500).json({ message: `Internal Server Error ${err}`});
    }
}