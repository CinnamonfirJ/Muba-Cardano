"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { productService } from "@/services/productService";
import toast from "react-hot-toast";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productImage?: string;
  orderId: string;
  onSuccess?: () => void;
}

export function ReviewModal({ isOpen, onClose, productId, productName, productImage, orderId, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [images, setImages] = useState<string[]>([]); // We will store URLs here afteruploading to Cloudinary is done separately or handled here?
  // Design choice: For simplicity, let's assume valid URLs are passed or we handle upload here.
  // Wait, frontend usually uploads to Cloudinary directly or sends file to backend? 
  // Existing `productService.createProduct` uses FormData. But validation logic in `review.controller` expects `images` array of strings (URLs).
  // So we probably need a separate upload endpoint or handling.
  // Let's assume for this iteration we support Text + Rating first, or simple URL inputs if no upload service is ready.
  // Actually, let's use the existing Upload mechanism if available.
  // checking `upload.middleware` usage in backend -> it uses MulterStorageCloudinary.
  // But `review.controller` creates review from `req.body.images`.
  // So we should probably upload images FIRST then submit review, OR update controller to handle files.
  // The controller `CreateProductReview` takes `images` from `req.body`. 
  // I should probably simplify and just skip image upload for this specific moment OR mock it, 
  // BUT the user explicitely asked for images.
  // Let's rely on a helper (if exists) or just let user paste URL for now? 
  // No, that's bad UX. 
  // Let's implement a simple file picker and assume we have an upload endpoint. 
  // I'll check if there is a generic upload endpoint.
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedFiles.length + files.length > 5) {
      toast.error("You can only upload up to 5 images");
      return;
    }

    setSelectedFiles((prev) => [...prev, ...files]);
    
    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previews[index]);
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (!review.trim()) {
      toast.error("Please write a review");
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedUrls: string[] = [];

      // 1. Upload Images if any
      if (selectedFiles.length > 0) {
          const uploadRes = await productService.uploadReviewImages(selectedFiles);
          uploadedUrls = uploadRes.urls;
      }
      
      // 2. Submit Review
      await productService.addProductReview(productId, {
        orderId,
        rating,
        review,
        images: uploadedUrls
      });
      
      toast.success("Review submitted successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Rate & Review Product</DialogTitle>
          <DialogDescription>
             Share your experience with <strong>{productName}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-4 items-start py-4">
             {productImage && (
                 <div className="w-16 h-16 rounded-lg overflow-hidden border shrink-0">
                     <img src={productImage} alt={productName} className="w-full h-full object-cover" />
                 </div>
             )}
             <div className="space-y-4 flex-1">
                 {/* Star Rating */}
                 <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                        >
                            <Star 
                                className={`w-8 h-8 ${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                        </button>
                    ))}
                 </div>
                 <p className="text-sm text-gray-500 font-medium">
                     {rating === 1 && "Poor"}
                     {rating === 2 && "Fair"}
                     {rating === 3 && "Good"}
                     {rating === 4 && "Very Good"}
                     {rating === 5 && "Excellent"}
                 </p>
             </div>
        </div>

        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="review">Your Review</Label>
                <Textarea
                    id="review"
                    placeholder="What did you like or dislike? How was the quality?"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    rows={4}
                    className="resize-none"
                />
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
                <Label>Add Photos (Optional)</Label>
                <div className="grid grid-cols-4 gap-2">
                    {previews.map((src, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
                            <img src={src} className="w-full h-full object-cover" />
                            <button 
                                onClick={() => removeImage(idx)}
                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {selectedFiles.length < 5 && (
                        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-gray-400">
                            <Upload className="w-5 h-5 mb-1" />
                            <span className="text-[10px]">Upload</span>
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleFileChange} 
                                disabled={isSubmitting}
                            />
                        </label>
                    )}
                </div>
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0} className="bg-[#3bb85e] hover:bg-[#2d8f4a]">
            {isSubmitting ? (
                <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Submitting...
                </>
            ) : (
                "Submit Review"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
