"use client";

import { useParams } from "next/navigation";
import {
  useStore,
  useFollowStore,
  useUnfollowStore,
  useStoreReviews,
  useRateStore,
} from "@/hooks/useStores"; // You might need to export useStoreReviews from useStores or create it
import { useStoreProducts } from "@/hooks/useProducts";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/productCard";
import {
  MapPin,
  Star,
  Calendar,
  UserPlus,
  UserCheck,
  MessageSquare,
  Loader2,
  Share2,
  Shield,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import VendorBadges from "@/components/VendorBadges";

export default function StorePage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const { data: store, isLoading: storeLoading } = useStore(id);
  const { data: productsData, isLoading: productsLoading } =
    useStoreProducts(id);
  // Assuming productsData might have a slightly different shape depending on backend,
  // but useStoreProducts usually returns the response directly or data property.
  const products = Array.isArray(productsData)
    ? productsData
    : productsData?.data || productsData?.products || [];

  const { mutate: followStore, isPending: isFollowPending } = useFollowStore();
  const { mutate: unfollowStore, isPending: isUnfollowing } =
    useUnfollowStore();
  const { mutate: rateStore, isPending: isRating } = useRateStore();
  const { data: reviews } = useStoreReviews(id);

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [rating, setRating] = useState("5");
  const [reviewText, setReviewText] = useState("");

  if (storeLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Loader2 className='w-8 h-8 text-[#3bb85e] animate-spin' />
      </div>
    );
  }

  if (!store) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <p>Store not found</p>
      </div>
    );
  }

  // Check if current user is following
  // Store followers is a string[] of user IDs (from backend unpopulated)
  const isFollowing = user && Array.isArray(store.followers) 
    ? store.followers.includes(user._id) 
    : false;

  const isOwner = user?._id === store.owner?._id;

  const handleFollow = () => {
    if (!user) {
      toast.error("Please login to follow stores");
      return;
    }
    followStore(id);
  };

  const handleUnfollow = () => {
    unfollowStore(id);
  };

  const handleRate = () => {
    rateStore(
      { id, data: { rating: parseInt(rating), review: reviewText } },
      {
        onSuccess: () => {
          setIsReviewOpen(false);
          setReviewText("");
          setRating("5");
        },
      }
    );
  };

  return (
    <div className='bg-gray-50 pb-10 min-h-screen'>
      {/* Banner Area */}
      <div className='relative bg-gradient-to-r from-green-600 to-green-800 w-full h-48 md:h-64'>
        {/* Cover Image Placeholder */}
        <div className='absolute inset-0 bg-black/20' />
      </div>

      <div className='z-10 relative mx-auto -mt-20 px-4 sm:px-6 lg:px-8 max-w-7xl'>
        <div className='bg-white shadow-lg mb-8 p-6 rounded-xl'>
          <div className='flex md:flex-row flex-col items-start gap-6'>
            {/* Store Logo */}
            <div className='flex-shrink-0 bg-gray-200 shadow-sm border-4 border-white rounded-xl w-32 h-32 overflow-hidden'>
              <img
                src={store.img || "/placeholder.svg"}
                alt={store.name}
                className='w-full h-full object-cover'
              />
            </div>

            {/* Store Info */}
            <div className='flex-1'>
              <div className='flex md:flex-row flex-col justify-between items-start md:items-center gap-4'>
                <div>
                  <h1 className='font-bold text-gray-900 text-3xl'>
                    {store.name}
                  </h1>
                  <div className='flex items-center gap-2 mt-2 text-gray-600'>
                    <MapPin className='w-4 h-4' />
                    <span>{store.location || "Online Store"}</span>
                    <span>•</span>
                    <Badge
                      variant='secondary'
                      className='bg-green-50 hover:bg-green-100 text-green-700'
                    >
                      {store.products.length || 0} Products
                    </Badge>
                  </div>
                  {/* Vendor Badges */}
                  <VendorBadges 
                    successfulDeliveries={store.owner?.successful_deliveries || 0}
                    rating={store.rating || 0}
                    isPostOffice={store.owner?.postOfficeStatus === "accepted"}
                    className="mt-3"
                    size="md"
                  />
                </div>

                <div className='flex gap-3'>
                  {/* Only show Follow/Rate if not owner */}
                  {!isOwner && (
                    <>
                      <Button
                        onClick={isFollowing ? handleUnfollow : handleFollow}
                        disabled={isFollowing ? isUnfollowing : isFollowPending}
                        className={`${
                          isFollowing 
                            ? "bg-gray-100 hover:bg-gray-200 text-gray-800" 
                            : "bg-[#3bb85e] hover:bg-[#2fa34c] text-white"
                        }`}
                      >
                        {isFollowing ? (
                            <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Unfollow
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Follow
                            </>
                        )}
                      </Button>

                      <Dialog
                        open={isReviewOpen}
                        onOpenChange={setIsReviewOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant='outline'
                            className='hover:bg-green-50 border-[#3bb85e] text-[#3bb85e]'
                          >
                            <Star className='mr-2 w-4 h-4' />
                            Rate Store
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Rate {store.name}</DialogTitle>
                          </DialogHeader>
                          <div className='gap-4 grid py-4'>
                            <div className='gap-2 grid'>
                              <Label htmlFor='rating'>Rating</Label>
                              <Select value={rating} onValueChange={setRating}>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select rating' />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value='5'>
                                    5 - Excellent
                                  </SelectItem>
                                  <SelectItem value='4'>
                                    4 - Very Good
                                  </SelectItem>
                                  <SelectItem value='3'>3 - Good</SelectItem>
                                  <SelectItem value='2'>2 - Fair</SelectItem>
                                  <SelectItem value='1'>1 - Poor</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className='gap-2 grid'>
                              <Label htmlFor='review'>Review</Label>
                              <Textarea
                                id='review'
                                placeholder='Share your experience...'
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                              />
                            </div>
                            <Button
                              onClick={handleRate}
                              disabled={isRating}
                              className='bg-[#3bb85e] hover:bg-[#2fa34c]'
                            >
                              {isRating ? "Submitting..." : "Submit Review"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                  <Button variant='ghost' size='icon'>
                    <Share2 className='w-5 h-5 text-gray-500' />
                  </Button>
                </div>
              </div>

              <div className='flex flex-wrap gap-6 mt-6 text-sm'>
                <div className='flex items-center gap-2'>
                  <div className='bg-yellow-50 p-2 rounded-lg text-yellow-600'>
                    <Star className='fill-current w-5 h-5' />
                  </div>
                  <div>
                    <p className='font-semibold text-gray-900'>
                      {store.rating?.toFixed(1) || "0.0"}
                    </p>
                    <p className='text-gray-500'>Rating</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='bg-blue-50 p-2 rounded-lg text-blue-600'>
                    <UserCheck className='w-5 h-5' />
                  </div>
                  <div>
                    <p className='font-semibold text-gray-900'>
                      {Array.isArray(store.followers)
                        ? store.followers.length
                        : store.followers || 0}
                    </p>
                    <p className='text-gray-500'>Followers</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='bg-purple-50 p-2 rounded-lg text-purple-600'>
                    <MessageSquare className='w-5 h-5' />
                  </div>
                  <div>
                    <p className='font-semibold text-gray-900'>
                      {store.reviewsCount || 0}
                    </p>
                    <p className='text-gray-500'>Reviews</p>
                  </div>
                </div>
                
                 <div className='flex items-center gap-2'>
                   <div className='bg-indigo-50 p-2 rounded-lg text-indigo-600'>
                     <Shield className='w-5 h-5' />
                   </div>
                   <div>
                     <p className='font-semibold text-gray-900'>
                       {store.owner?.successful_deliveries || 0}
                     </p>
                     <p className='text-gray-500'>Verified Deliveries</p>
                   </div>
                 </div>
              </div>

              <p className='mt-6 text-gray-600 leading-relaxed'>
                {store.description}
              </p>
            </div>
          </div>
        </div>

        {/* Store Products */}
        <div className='space-y-6'>
          <h2 className='font-bold text-gray-900 text-2xl'>Store Products</h2>

          {productsLoading ? (
            <div className='flex justify-center p-10'>
              <Loader2 className='w-8 h-8 text-[#3bb85e] animate-spin' />
            </div>
          ) : products.length > 0 ? (
            <div className='gap-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
              {products.map((product: any) => (
                <ProductCard key={product._id} item={product} />
              ))}
            </div>
          ) : (
            <div className='bg-white shadow-sm py-10 rounded-xl text-center'>
              <p className='text-gray-500'>
                No products available in this store yet.
              </p>
            </div>
          )}
        </div>

        {/* Store Reviews */}
        <div className='space-y-6 mt-12'>
          <h2 className='font-bold text-gray-900 text-2xl'>Reviews</h2>
          {reviews && reviews.length > 0 ? (
            <div className='gap-4 grid md:grid-cols-2'>
              {reviews.map((review: any, index: number) => (
                <div
                  key={review._id || index}
                  className='bg-white shadow-sm p-4 border border-gray-100 rounded-xl'
                >
                  <div className='flex justify-between items-start mb-2'>
                    <div className='flex items-center gap-2'>
                      <div className='flex justify-center items-center bg-gray-200 rounded-full w-8 h-8 font-bold text-gray-600 text-xs'>
                        {review.user?.firstname?.[0] || "U"}
                      </div>
                      <div>
                        <p className='font-medium text-gray-900 text-sm'>
                          {review.user?.firstname || "Anonymous"}
                        </p>
                        <div className='flex items-center'>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className='text-gray-400 text-xs'>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className='text-gray-600 text-sm'>
                    {review.review || review.comment}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className='bg-white py-8 rounded-xl text-center'>
              <p className='text-gray-500'>No reviews yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
