import { Request, Response } from "express";
import Products from "../../models/products.model";
import { deleteFromCloudinary } from "../../middlewares/upload.middleware";

export const DeleteProduct = async (req: Request, res: Response) => {
    const { _id: id } = req.params;

    try {
        const product = await Products.findById(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Delete images from Cloudinary
        if (product.images && product.images.length > 0) {
            const deletePromises = product.images.map((imgUrl: string) => {
                // Extract public ID from Cloudinary URL
                // Example: https://res.cloudinary.com/.../upload/v1234/folder/public_id.jpg
                const urlParts = imgUrl.split('/');
                const filename = urlParts[urlParts.length - 1]; // public_id.jpg
                const publicId = filename.split('.')[0]; // public_id
                
                // If you use folders, you might need to adjust this logic or store publicId separately.
                // Assuming simple structure or handling "folder/public_id" if needed.
                // For safety, let's try to grab folder if it exists in standard Cloudinary structure
                // But simplified extraction is often safer if standard structure is used.
                // Let's try to match the "folder/id" pattern if possible.
                // A more robust regex:
                const regex = /\/v\d+\/(.+)\.[a-z]+$/;
                const match = imgUrl.match(regex);
                if (match && match[1]) {
                    return deleteFromCloudinary(match[1]);
                }
                return Promise.resolve();
            });

            await Promise.all(deletePromises);
        }

        await Products.findByIdAndDelete(id);

        return res.status(200).json({
            message: "Item has been successfully deleted",
        });
    } catch (err) {
        console.log(`Internal Server Error: ${err}`);
        return res.status(500).json({ message: `Internal Server Error ${err}`});
    }
}