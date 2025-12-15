"use client";

import {
  ShoppingBasket,
  Star,
  StarHalf,
  Heart,
  MessageCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { useCart } from "../context/CartContext";
import type { Product } from "../services/productService";
import Link from "next/link";

interface ProductCardProps {
  item: Product;
  viewMode?: "grid" | "list";
}

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }).map((_, i) => {
    const full = i + 1 <= Math.floor(rating);
    const half = !full && i + 0.5 <= rating;
    if (full) {
      return (
        <Star
          key={i}
          className='fill-yellow-400 w-3 h-3 text-yellow-400'
          strokeWidth={1.5}
        />
      );
    }
    if (half) {
      return (
        <StarHalf
          key={i}
          className='fill-yellow-400 w-3 h-3 text-yellow-400'
          strokeWidth={1.5}
        />
      );
    }
    return <Star key={i} className='w-3 h-3 text-gray-300' strokeWidth={1.5} />;
  });
};

export const ProductCard = ({ item, viewMode = "grid" }: ProductCardProps) => {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem(item);
  };

  if (viewMode === "list") {
    return (
      <Card className='bg-white p-0 hover:border-neutral-200 border-none rounded-lg overflow-hidden transition-all duration-300'>
        <CardContent className='p-0'>
          <div className='flex'>
            <div className='relative w-48 h-48 shrink-0'>
              <Link href={`/product/${item._id}`}>
                <img
                  width={"100%"}
                  style={{ aspectRatio: 1 / 1, objectFit: "contain" }}
                  height={"100%"}
                  src={item.images?.[0] || "/placeholder.svg"}
                  alt={item.title}
                  className='hover:scale-105 transition-transform duration-300'
                />
              </Link>
              {item.originalPrice && (
                <Badge className='top-2 left-2 absolute bg-red-500 text-white text-xs'>
                  PROMO
                </Badge>
              )}
            </div>
            <div className='flex-1 p-3 sm:p-4'>
              <div className='flex justify-between items-start mb-1 sm:mb-2'>
                <Link href={`/product/${item._id}`}>
                  <h3 className='font-semibold text-neutral-800 hover:text-[#3bb85e] text-sm sm:text-lg line-clamp-1'>
                    {item.title}
                  </h3>
                </Link>
                <Button
                  variant='ghost'
                  size='sm'
                  className='p-0 w-6 sm:w-8 h-6 sm:h-8 text-neutral-400 hover:text-red-500'
                >
                  <Heart className='w-3 sm:w-4 h-3 sm:h-4' />
                </Button>
              </div>
              <div className='flex items-center gap-1 sm:gap-2'>
                {renderStars(item.rating)}
                <span className='text-neutral-600 text-xs sm:text-sm'>
                  {item.rating} ({item.reviews} reviews)
                </span>
              </div>
              <div className='flex items-center gap-2 sm:gap-4'>
                <div className='flex items-center gap-1 sm:gap-2'>
                  <span className='font-bold text-[#3bb85e] text-base sm:text-xl'>
                    ₦{item.price.toLocaleString()}
                  </span>
                  {item.originalPrice && (
                    <span className='text-neutral-500 text-xs sm:text-sm line-through'>
                      ₦{item.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                {item.condition && (
                  <Badge variant='outline' className='text-xs'>
                    {item.condition}
                  </Badge>
                )}
              </div>
              <div className='flex justify-between items-center'>
                <div className='text-neutral-600 text-xs sm:text-sm'>
                  <div>by {item.store.name}</div>
                  {/* {item.location && (
                    <div className='flex items-center gap-1 mt-0.5 sm:mt-1'>
                      {item.location}
                    </div>
                  )} */}
                </div>
                <div className='flex gap-1 sm:gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='hidden sm:flex px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm'
                  >
                    <MessageCircle className='w-3 sm:w-4 h-3 sm:h-4' />
                  </Button>
                  <Button
                    size='sm'
                    onClick={handleAddToCart}
                    className='bg-[#3bb85e] hover:bg-[#457753] px-2 sm:px-3 py-1 sm:py-2 text-white text-xs sm:text-sm'
                  >
                    <ShoppingBasket className='mr-1 sm:mr-2 w-3 sm:w-4 h-3 sm:h-4' />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='group shadow-none p-0 hover:border-neutral-200 border-none rounded-md overflow-hidden transition-all duration-300'>
      <CardContent className='p-0'>
        <div className='relative'>
          <Link href={`/product/${item._id}`}>
            <img
              src={item.images?.[0] || "/placeholder.svg"}
              alt={item.title}
              className='rounded-md w-[250px] h-auto object-cover aspect-square group-hover:scale-105 transition-transform duration-300'
            />
          </Link>
          {item.originalPrice && (
            <Badge className='top-3 left-3 absolute bg-red-500 text-white text-xs'>
              PROMO
            </Badge>
          )}
          <Button
            variant='ghost'
            size='sm'
            className='top-2 right-2 absolute bg-white/80 hover:bg-white p-0 w-7 sm:w-8 h-7 sm:h-8 text-neutral-600 hover:text-red-500'
          >
            <Heart className='w-4 h-4' />
          </Button>
          {item.condition && (
            <Badge
              variant='outline'
              className='hidden bottom-3 left-3 absolute sm:flex bg-white/90 text-xs'
            >
              {item.condition}
            </Badge>
          )}
          <Button
            size='sm'
            onClick={handleAddToCart}
            className='right-3 bottom-3 absolute flex flex-1 bg-[#3bb85e] hover:bg-[#457753] p-3 rounded-full text-white text-xs sm:text-sm'
          >
            <ShoppingBasket className='w-3 h-3 sm:h-4' />
          </Button>
        </div>
        <div className='py-2'>
          <Link href={`/product/${item._id}`}>
            <h3 className='font-semibold text-neutral-800 hover:text-[#3bb85e] text-sm sm:text-base truncate line-clamp-2 text-nowrap'>
              {item.title}
            </h3>
          </Link>
          <div className='flex items-center gap-1'>
            <div className='flex items-center gap-0.5 sm:gap-1'>
              {renderStars(item.rating)}
            </div>
            <span className='flex text-neutral-600 text-xs sm:text-sm'>
              {item.rating} ({item.reviews})
            </span>
          </div>
          <div className='flex items-center gap-1 sm:gap-2'>
            <span className='font-bold text-[#3bb85e] text-base sm:text-lg'>
              ₦{item.price.toLocaleString()}
            </span>
            {item.originalPrice && (
              <span className='hidden sm:flex text-neutral-500 text-xs sm:text-sm line-through'>
                ₦{item.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <div className='hidden sm:flex gap-2 mb-3 sm:mb-4 text-neutral-600 text-xs sm:text-sm'>
            <div className='font-medium'>by {item.store.name}</div>
            {item.location && (
              <div className='flex items-center truncate leading-tight transition'>
                {item.location}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
