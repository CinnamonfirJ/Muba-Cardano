import { Request, Response } from "express";
import Stores from "../../models/stores.model";
import { deleteFromCloudinary } from "../../middlewares/upload.middleware";

export const DeleteStore = async (req: Request, res: Response) => {
  const { _id } = req.params;

  try {
    const store = await Stores.findById(_id);

    if (!store) {
        return res.status(404).json({ message: "Store not found" });
    }

    // Delete image from Cloudinary
    if (store.img) {
         // Extract public ID from Cloudinary URL
        const urlParts = store.img.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = filename.split('.')[0];
        
        // Robust extraction
        const regex = /\/v\d+\/(.+)\.[a-z]+$/;
        const match = store.img.match(regex);
        if (match && match[1]) {
            await deleteFromCloudinary(match[1]);
        }
    }

    await Stores.findByIdAndDelete(_id);

    return res.status(200).json({
      message: "Your Store has been deleted",
    });
  } catch (err) {
    console.log(`Internal Server Error: ${err}`);
    return res.status(500).json({ message: `Internal Server Error ${err}` });
  }
};
