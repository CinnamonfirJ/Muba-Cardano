"use client";

import { useEffect, useState } from "react";
import { Star, User, Calendar, Image as ImageIcon, PenLine } from "lucide-react";
import { productService } from "@/services/productService";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Import Button
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { useAuth } from "@/context/AuthContext";

interface Review {
  _id: string;
  rating: number;
  review: string;
  images: string[];
  user: {
      _id: string;
      firstname: string;
      lastname: string;
      profile_img?: string;
  };
  createdAt: string;
}

export function ProductReviews({ productId, productName, productImage }: { productId: string, productName?: string, productImage?: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avg: 0 });
  const [eligibility, setEligibility] = useState<{ eligible: boolean, orderId?: string, hasReviewed?: boolean }>({ eligible: false });
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchReviews = async () => {
      try {
        const res = await productService.getProductReviews(productId);
        setReviews(res.data);
        setStats({ 
            total: res.pagination.total, 
            avg: res.data.reduce((acc: number, r: Review) => acc + r.rating, 0) / (res.data.length || 1) 
        });
      } catch (error) {
        console.error("Failed to load reviews", error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  useEffect(() => {
    const checkUserEligibility = async () => {
        if (!user) return;
        setCheckingEligibility(true);
        try {
            const res = await productService.checkReviewEligibility(productId);
            setEligibility(res);
        } catch (error) {
            console.error("Err checking eligibility", error);
        } finally {
            setCheckingEligibility(false);
        }
    };

    if (user && productId) {
        checkUserEligibility();
    }
  }, [user, productId]);

  const handleReviewSuccess = () => {
      fetchReviews(); // Reload reviews
      setEligibility({ ...eligibility, eligible: false, hasReviewed: true }); // Disable button
  };

  if (loading) return <div className="py-8 text-center text-gray-400">Loading reviews...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-xl flex items-center gap-2">
            Reviews <span className="text-[#3bb85e]">({stats.total})</span>
        </h3>
        
        {eligibility.eligible && eligibility.orderId && (
            <Button 
                onClick={() => setModalOpen(true)}
                className="bg-[#3bb85e] hover:bg-[#2d8f4a] text-white"
                size="sm"
            >
                <PenLine className="w-4 h-4 mr-2" />
                Write a Review
            </Button>
        )}
      </div>

      {reviews.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">
              <Star className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium">No reviews yet</p>
              <p className="text-sm">Be the first to review this product!</p>
          </div>
      ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review._id} className="border-gray-100 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-gray-50 overflow-hidden flex items-center justify-center border border-gray-100 shrink-0">
                                 {review.user?.profile_img ? (
                                     <img src={review.user.profile_img} alt={review.user.firstname} className="w-full h-full object-cover" />
                                 ) : (
                                     <User className="w-5 h-5 text-gray-400" />
                                 )}
                             </div>
                             <div>
                                 <p className="font-semibold text-gray-900 text-sm">{review.user?.firstname} {review.user?.lastname}</p>
                                 <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                     <Calendar className="w-3 h-3" />
                                     {formatDate(review.createdAt)}
                                 </p>
                             </div>
                        </div>
                        
                        <div className="flex gap-0.5 bg-gray-50 px-2 py-1 rounded-lg">
                            {[1, 2, 3, 4, 5].map(star => (
                                <Star 
                                    key={star} 
                                    className={`w-3.5 h-3.5 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} 
                                />
                            ))}
                        </div>
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed mb-4 whitespace-pre-line">
                        {review.review}
                    </p>

                    {review.images && review.images.length > 0 && (
                         <div className="flex gap-2 overflow-x-auto pb-2">
                             {review.images.map((img, i) => (
                                 <div key={i} className="w-20 h-20 rounded-lg overflow-hidden border shrink-0">
                                     <img src={img} alt="Review" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                 </div>
                             ))}
                         </div>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>
      )}

      {eligibility.orderId && (
        <ReviewModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            productId={productId}
            productName={productName || "Product"}
            productImage={productImage}
            orderId={eligibility.orderId}
            onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}
