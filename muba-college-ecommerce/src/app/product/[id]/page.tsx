"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  Star,
  StarHalf,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  MapPin,
  Check,
  ArrowLeft,
  Package,
  Loader2,
  AlertCircle,
  RefreshCw,
  Maximize,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";
import { useProduct, useStoreProducts } from "@/hooks/useProducts";
import ExpandableTitle from "@/components/ExpandableTitle";
import { Product } from "@/services/productService";

// Helper components
const renderStars = (rating: number, size = "w-4 h-4") => {
  return Array.from({ length: 5 }).map((_, i) => {
    const full = i + 1 <= Math.floor(rating);
    const half = !full && i + 0.5 <= rating;
    if (full) {
      return (
        <Star
          key={i}
          className={`${size} fill-yellow-400 text-yellow-400`}
          strokeWidth={1.5}
        />
      );
    }
    if (half) {
      return (
        <StarHalf
          key={i}
          className={`${size} fill-yellow-400 text-yellow-400`}
          strokeWidth={1.5}
        />
      );
    }
    return (
      <Star key={i} className={`${size} text-gray-300`} strokeWidth={1.5} />
    );
  });
};

export default function ProductDetailsPage() {
  // Handle potentially string | string[] params with type assertion or check
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  
  const router = useRouter();
  const { addItem, isItemInCart, getItemQuantity, alreadyInCart } = useCart();

  // Fetch Product
  const { data: productData, isLoading, error: queryError, refetch } = useProduct(id);
  
  // Extract product from response structure (handling { data: Product } or Product)
  const product: Product | null = productData?.data || productData || null;
  const error = queryError ? (queryError as any).message || "Failed to load product" : null;

  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  // Mobile touch states
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Computed Values
  const productImages = product?.images || [];
  const currentImage =
    productImages[currentImageIndex] ||
    "/placeholder.svg?height=600&width=600&text=Product";

  // Dynamic Price & Stock
  const displayPrice = selectedVariant?.price ? Number(selectedVariant.price) : product?.price || 0;
  const displayStock = selectedVariant ? selectedVariant.stock : product?.stockCount || 0;
  const isOutOfStock = displayStock <= 0;

  // Batch Logic
  const isBatch = product?.productType === 'batch';
  const batchConfig = product?.batchConfig || { minOrder: 0, currentOrder: 0, batchStatus: 'collecting' };
  const batchProgress = batchConfig.minOrder > 0 ? (batchConfig.currentOrder / batchConfig.minOrder) * 100 : 0;

  const discountPercentage = product?.originalPrice
    ? Math.round(
        ((product.originalPrice - displayPrice) / product.originalPrice) * 100
      )
    : 0;

  // Handlers
  const nextImage = () => {
    if (productImages.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === productImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (productImages.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? productImages.length - 1 : prev - 1
      );
    }
  };

  const increaseQuantity = () => {
    if (!product) return;
    if (quantity < displayStock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    // Validate Variant Selection
    if (product.productType === 'variable' && product.variants?.length && !selectedVariant) {
        // Find if any variant is selected
        alert(`Please select a ${product.variantType || 'Variation'}`);
        return;
    }

    // Construct cart item options
    const options: any = {};
    if (selectedVariant) {
        options[product.variantType || 'Variant'] = selectedVariant.name;
    }

    await addItem({ ...product, price: displayPrice }, quantity, options);
  };

  // Safe getter helpers
  const getSellerInitials = () => {
    if (!product?.store?.owner) return "??";
    const firstName = product.store.owner.firstname || "";
    const lastName = product.store.owner.lastname || "";
    const first = firstName.length > 0 ? firstName[0].toUpperCase() : "";
    const last = lastName.length > 0 ? lastName[0].toUpperCase() : "";
    return `${first}${last}` || "??";
  };

  const getSellerName = () => {
    if (!product?.store?.owner) return "Unknown Seller";
    const firstName = product.store.owner.firstname || "";
    const lastName = product.store.owner.lastname || "";
    if (!firstName && !lastName) return "Unknown Seller";
    return `${firstName} ${lastName}`.trim();
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) nextImage();
    if (isRightSwipe) prevImage();
  };

  // Loading State
  if (isLoading) {
    return (
      <div className='flex justify-center items-center bg-gray-50 min-h-screen'>
        <div className='text-center'>
          <Loader2 className='mx-auto mb-4 w-12 h-12 text-[#3bb85e] animate-spin' />
          <p className='text-gray-600'>Loading product details...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className='flex justify-center items-center bg-gray-50 min-h-screen'>
        <div className='text-center'>
          <AlertCircle className='mx-auto mb-4 w-16 h-16 text-red-400' />
          <h2 className='mb-2 font-semibold text-gray-900 text-xl'>
            Failed to Load Product
          </h2>
          <p className='mb-6 max-w-md text-gray-600'>{error}</p>
          <div className='flex justify-center gap-3'>
            <Button onClick={() => router.back()} variant='outline'>
              <ArrowLeft className='mr-2 w-4 h-4' />
              Go Back
            </Button>
            <Button
              onClick={() => refetch()}
              className='bg-[#3bb85e] hover:bg-[#2d8f4a]'
            >
              <RefreshCw className='mr-2 w-4 h-4' />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Product Not Found
  if (!product) {
    return (
      <div className='flex justify-center items-center bg-gray-50 min-h-screen'>
        <div className='text-center'>
          <Package className='mx-auto mb-4 w-16 h-16 text-gray-400' />
          <h2 className='mb-2 font-semibold text-gray-900 text-xl'>
            Product Not Found
          </h2>
          <p className='mb-6 text-gray-600'>
            The product you're looking for doesn't exist or may have been removed.
          </p>
          <Button
            onClick={() => router.push("/marketplace")}
            className='bg-[#3bb85e] hover:bg-[#2d8f4a]'
          >
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white min-h-screen'>
      {/* Mobile Header */}
      <div className='lg:hidden top-0 z-50 sticky bg-white px-4 py-3 border-b'>
        <div className='flex justify-between items-center'>
          <Button
            variant='ghost'
            size='sm'
            className='p-0'
            onClick={() => router.back()}
          >
            <ArrowLeft className='w-5 h-5' />
          </Button>
          <h1 className='mx-4 max-w-48 font-medium text-base truncate'>
            {product.title || "Product"}
          </h1>
          <div className='flex gap-2'>
            <Button variant='ghost' size='sm' className='p-0'>
              <Share2 className='w-5 h-5' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className='p-0'
              onClick={() => setIsWishlisted(!isWishlisted)}
            >
              <Heart
                className={`w-5 h-5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Full Screen Image Modal */}
      {isImageExpanded && (
        <div className='top-0 left-0 z-50 fixed flex justify-center items-center bg-black bg-opacity-90 w-full h-full'>
          <div className='relative mx-4 max-w-4xl max-h-full'>
            <Button
              variant='ghost'
              size='sm'
              className='top-4 right-4 absolute bg-white/20 hover:bg-white/40 p-2 text-white'
              onClick={() => setIsImageExpanded(false)}
            >
              <X className='w-6 h-6' />
            </Button>

            <img
              src={currentImage}
              alt={product.title}
              className='max-w-full max-h-full object-contain'
            />

            {productImages.length > 1 && (
              <>
                <Button
                  variant='ghost'
                  size='sm'
                  className='top-1/2 left-4 absolute bg-white/20 hover:bg-white/40 p-2 text-white -translate-y-1/2'
                  onClick={prevImage}
                >
                  <ChevronLeft className='w-6 h-6' />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  className='top-1/2 right-4 absolute bg-white/20 hover:bg-white/40 p-2 text-white -translate-y-1/2'
                  onClick={nextImage}
                >
                  <ChevronRight className='w-6 h-6' />
                </Button>
              </>
            )}

            <div className='bottom-4 left-1/2 absolute bg-black/50 px-3 py-1 rounded-full text-white text-sm -translate-x-1/2'>
              {currentImageIndex + 1} / {productImages.length}
            </div>
          </div>
        </div>
      )}

      <div className='mx-auto max-w-7xl'>
        {/* Main Product Section */}
        <div className='lg:flex lg:gap-8 lg:p-6'>
          {/* Left Column - Images */}
          <div className='lg:w-1/2'>
            <div className='lg:top-6 lg:sticky'>
              {/* Main Image */}
              <div className='relative bg-white'>
                <div
                  className='relative aspect-square cursor-pointer lg:cursor-default'
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => setIsImageExpanded(true)}
                >
                  <img
                    src={currentImage}
                    alt={product.title}
                    className='bg-gray-50 w-full h-full object-contain'
                  />

                  {/* Mobile expand icon */}
                  <div className='lg:hidden top-4 left-4 absolute'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='bg-white/80 hover:bg-white p-2'
                    >
                      <Maximize className='w-4 h-4' />
                    </Button>
                  </div>

                  {/* Navigation Arrows - Desktop */}
                  {productImages.length > 1 && (
                    <>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='hidden top-1/2 left-4 absolute lg:flex bg-white/90 hover:bg-white shadow-md p-0 rounded-full w-10 h-10 -translate-y-1/2'
                        onClick={prevImage}
                      >
                        <ChevronLeft className='w-5 h-5' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='hidden top-1/2 right-4 absolute lg:flex bg-white/90 hover:bg-white shadow-md p-0 rounded-full w-10 h-10 -translate-y-1/2'
                        onClick={nextImage}
                      >
                        <ChevronRight className='w-5 h-5' />
                      </Button>
                    </>
                  )}

                  {/* Image Counter */}
                  {productImages.length > 0 && (
                    <div className='top-4 right-4 absolute bg-black/60 px-3 py-1 rounded-full text-white text-sm'>
                      {currentImageIndex + 1} / {productImages.length}
                    </div>
                  )}

                  {/* Discount Badge */}
                  {discountPercentage > 0 && (
                    <div className='top-16 lg:top-4 left-4 absolute'>
                      <Badge variant='destructive' className='font-bold'>
                        -{discountPercentage}% OFF
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Thumbnail Images - Desktop */}
              {productImages.length > 1 && (
                <div className='hidden lg:flex gap-2 mt-4 overflow-x-auto'>
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      className={`shrink-0 w-20 h-20 bg-gray-50 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? "border-[#3bb85e]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img
                        src={image}
                        alt={`${product.title} ${index + 1}`}
                        className='w-full h-full object-contain'
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Product Info */}
          <div className='p-4 lg:p-0 lg:w-1/2'>
            {/* Desktop Header */}
            <div className='hidden lg:flex justify-between items-start mb-4'>
              <Button variant='ghost' size='sm' onClick={() => router.back()}>
                <ArrowLeft className='mr-2 w-4 h-4' />
                Back
              </Button>
              <div className='flex gap-2'>
                <Button variant='outline' size='sm'>
                  <Share2 className='w-4 h-4' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setIsWishlisted(!isWishlisted)}
                >
                  <Heart
                    className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`}
                  />
                </Button>
              </div>
            </div>

            <ExpandableTitle text={product.title} />

            {/* Price & Rating */}
            <div className='mb-6'>
              <div className='flex items-baseline gap-3 mb-3'>
                <span className='font-bold text-red-600 text-3xl lg:text-4xl'>
                  ₦{displayPrice.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className='text-gray-500 text-sm line-through'>
                    ₦{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Variant Selector */}
              {product.productType === 'variable' && product.variants && product.variants.length > 0 && (
                  <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2 text-gray-900">{product.variantType || "Options"}:</h3>
                      <div className="flex flex-wrap gap-2">
                          {product.variants.map((variant: any, idx: number) => {
                              const isSelected = selectedVariant?.name === variant.name;
                              return (
                                  <button
                                      key={idx}
                                      onClick={() => setSelectedVariant(variant)}
                                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                                          isSelected 
                                          ? "bg-black text-white border-black" 
                                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                                      }`}
                                  >
                                      {variant.name}
                                      {variant.price ? ` (+₦${variant.price})` : ''}
                                  </button>
                              )
                          })}
                      </div>
                  </div>
              )}

              {/* Batch Order Progress */}
              {isBatch && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-blue-900">Batch Progress</span>
                          <Badge variant="outline" className="bg-white text-blue-700">
                              {batchConfig.currentOrder} / {batchConfig.minOrder} Ordered
                          </Badge>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2.5 mb-2">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(batchProgress, 100)}%` }}
                          ></div>
                      </div>
                      <p className="text-xs text-blue-600">
                          {Math.max(0, batchConfig.minOrder - batchConfig.currentOrder)} more orders needed to trigger shipping!
                      </p>
                  </div>
              )}


              <div className='flex items-center gap-4 mb-4 text-sm'>
                <div className='flex items-center gap-1'>
                  {renderStars(product.rating || 0)}
                  <span className='font-medium'>{product.rating || 0}</span>
                  <span className='text-gray-500'>
                    ({product.reviews || 0} reviews)
                  </span>
                </div>
                {product.location && (
                  <div className='flex items-center gap-1 text-gray-600'>
                    <MapPin className='w-4 h-4' />
                    <span className='truncate'>{product.location}</span>
                  </div>
                )}
              </div>

              <div className='flex flex-wrap items-center gap-2 mb-4'>
                {product.condition && (
                  <Badge variant='outline' className='capitalize'>
                    Condition: {product.condition}
                  </Badge>
                )}
                {product.productType !== 'batch' && (
                    <Badge
                    className={
                        !isOutOfStock
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                    >
                    {!isOutOfStock ? `In Stock (${displayStock})` : "Out of Stock"}
                    </Badge>
                )}
              </div>
            </div>

            {/* Store/Seller Info */}
            <Link href={`/store/${product.store?._id}`}>
              <Card className='mb-6 hover:shadow-md transition-shadow'>
                <CardContent className='p-4'>
                  <div className='flex items-center gap-3'>
                    <div className='flex justify-center items-center bg-[#3bb85e] rounded-full w-10 h-10 font-bold text-white'>
                      {getSellerInitials()}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 font-semibold'>
                        <span className='truncate'>{getSellerName()}</span>
                        {product.store?.verified && (
                          <Badge variant='secondary' className='text-xs'>
                            <Check className='mr-1 w-3 h-3' />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className='text-gray-600 text-sm truncate'>
                        {product.store?.name || "Unknown Store"}
                      </div>
                    </div>
                    <Button variant='outline' size='sm'>
                      <MessageCircle className='mr-2 w-4 h-4' />
                      Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Quantity and Actions */}
            <div className='bottom-0 sticky lg:static bg-white p-4 border-t lg:border-none'>
              <div className='flex gap-4 mb-4'>
                <div className='flex items-center border rounded-md'>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                  >
                    <Minus className='w-4 h-4' />
                  </Button>
                  <span className='w-12 text-center font-medium'>{quantity}</span>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={increaseQuantity}
                    disabled={quantity >= displayStock}
                  >
                    <Plus className='w-4 h-4' />
                  </Button>
                </div>
                <Button
                  className='flex-1 bg-[#3bb85e] hover:bg-[#2d8f4a] h-10'
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || (product.productType === 'variable' && !selectedVariant)}
                >
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
