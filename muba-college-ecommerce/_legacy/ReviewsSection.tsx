"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Star, Search, Edit, Trash2, Calendar } from "lucide-react";
import toast from "react-hot-toast";

// Mock data - replace with actual API calls
const mockReviews = [
  {
    id: "rev-1",
    productName: "MacBook Pro M2 (Used)",
    productImage: "/placeholder.svg?height=60&width=60&text=MacBook",
    seller: "Tech Hub UNILAG",
    rating: 5,
    comment:
      "Excellent condition! Works perfectly and the seller was very responsive. Highly recommended!",
    date: "2024-01-20",
    orderId: "ORD-001",
  },
  {
    id: "rev-2",
    productName: "Engineering Mathematics Textbook",
    productImage: "/placeholder.svg?height=60&width=60&text=Book",
    seller: "BookStore UI",
    rating: 4,
    comment:
      "Good condition textbook. Some highlighting but still very readable. Fast delivery.",
    date: "2024-01-18",
    orderId: "ORD-002",
  },
  {
    id: "rev-3",
    productName: "Chemistry Lab Manual",
    productImage: "/placeholder.svg?height=60&width=60&text=Manual",
    seller: "Science Books Store",
    rating: 3,
    comment: "Average condition. Some pages were torn but content is complete.",
    date: "2024-01-15",
    orderId: "ORD-003",
  },
];

const ReviewsSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [reviews, setReviews] = useState(mockReviews);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(0);

  const filteredReviews = reviews.filter(
    (review) =>
      review.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.seller.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditReview = (review: (typeof mockReviews)[0]) => {
    setEditingReview(review.id);
    setEditComment(review.comment);
    setEditRating(review.rating);
  };

  const handleSaveEdit = (reviewId: string) => {
    setReviews(
      reviews.map((review) =>
        review.id === reviewId
          ? { ...review, comment: editComment, rating: editRating }
          : review
      )
    );
    setEditingReview(null);
    toast.success("Review updated successfully!");
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setEditComment("");
    setEditRating(0);
  };

  const handleDeleteReview = (reviewId: string) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      setReviews(reviews.filter((review) => review.id !== reviewId));
      toast.success("Review deleted successfully!");
    }
  };

  const renderStars = (
    rating: number,
    interactive = false,
    onRatingChange?: (rating: number) => void
  ) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
        onClick={
          interactive && onRatingChange
            ? () => onRatingChange(i + 1)
            : undefined
        }
      />
    ));
  };

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className='space-y-6'>
      {/* Stats Card */}
      <div className='gap-6 grid grid-cols-1 md:grid-cols-3'>
        <Card>
          <CardContent className='p-6 text-center'>
            <div className='font-bold text-gray-900 text-2xl'>
              {reviews.length}
            </div>
            <div className='text-gray-600 text-sm'>Total Reviews</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-6 text-center'>
            <div className='flex justify-center items-center gap-1 mb-1'>
              <span className='font-bold text-gray-900 text-2xl'>
                {averageRating}
              </span>
              <Star className='fill-yellow-400 w-5 h-5 text-yellow-400' />
            </div>
            <div className='text-gray-600 text-sm'>Average Rating</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-6 text-center'>
            <div className='font-bold text-gray-900 text-2xl'>
              {reviews.filter((r) => r.rating >= 4).length}
            </div>
            <div className='text-gray-600 text-sm'>Positive Reviews</div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Star className='w-5 h-5' />
            My Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className='relative mb-6'>
            <Search className='top-3 left-3 absolute w-4 h-4 text-gray-400' />
            <Input
              placeholder='Search reviews...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>

          {/* Reviews */}
          {filteredReviews.length === 0 ? (
            <div className='py-12 text-center'>
              <Star className='mx-auto mb-4 w-12 h-12 text-gray-400' />
              <h3 className='mb-2 font-medium text-gray-900 text-lg'>
                No reviews found
              </h3>
              <p className='text-gray-600'>
                {searchQuery
                  ? "Try adjusting your search terms."
                  : "You haven't written any reviews yet."}
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredReviews.map((review) => (
                <Card key={review.id} className='border border-gray-200'>
                  <CardContent className='p-6'>
                    <div className='flex lg:flex-row flex-col gap-4'>
                      {/* Product Image */}
                      <img
                        src={review.productImage || "/placeholder.svg"}
                        alt={review.productName}
                        className='shrink-0 rounded-lg w-16 h-16 object-cover'
                      />

                      {/* Review Content */}
                      <div className='flex-1 space-y-3'>
                        <div className='flex sm:flex-row flex-col sm:justify-between sm:items-center gap-2'>
                          <div>
                            <h3 className='font-semibold text-gray-900'>
                              {review.productName}
                            </h3>
                            <p className='text-gray-600 text-sm'>
                              by {review.seller}
                            </p>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Badge variant='outline' className='text-xs'>
                              Order #{review.orderId}
                            </Badge>
                            <div className='flex items-center gap-1 text-gray-500 text-xs'>
                              <Calendar className='w-3 h-3' />
                              {review.date}
                            </div>
                          </div>
                        </div>

                        {/* Rating */}
                        <div className='flex items-center gap-2'>
                          {editingReview === review.id ? (
                            <div className='flex items-center gap-1'>
                              {renderStars(editRating, true, setEditRating)}
                            </div>
                          ) : (
                            <div className='flex items-center gap-1'>
                              {renderStars(review.rating)}
                              <span className='ml-1 text-gray-600 text-sm'>
                                ({review.rating}/5)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Comment */}
                        {editingReview === review.id ? (
                          <div className='space-y-3'>
                            <textarea
                              value={editComment}
                              onChange={(e) => setEditComment(e.target.value)}
                              className='px-3 py-2 border border-gray-300 focus:border-transparent rounded-md focus:ring-[#3bb85e] focus:ring-2 w-full resize-none'
                              rows={3}
                              placeholder='Write your review...'
                            />
                            <div className='flex gap-2'>
                              <Button
                                size='sm'
                                onClick={() => handleSaveEdit(review.id)}
                                className='bg-[#3bb85e] hover:bg-[#457753]'
                              >
                                Save Changes
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className='text-gray-700'>{review.comment}</p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {editingReview !== review.id && (
                        <div className='flex flex-col shrink-0 gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleEditReview(review)}
                          >
                            <Edit className='mr-2 w-4 h-4' />
                            Edit
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleDeleteReview(review.id)}
                            className='hover:bg-red-50 text-red-600 hover:text-red-700'
                          >
                            <Trash2 className='mr-2 w-4 h-4' />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewsSection;
