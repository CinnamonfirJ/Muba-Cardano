"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";

interface FilterSidebarProps {
  isMobile?: boolean;
  onApply?: () => void;
}

export function FilterSidebar({ isMobile, onApply }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [rating, setRating] = useState(searchParams.get("rating") || "");

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");
    
    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");
    
    if (rating) params.set("rating", rating);
    else params.delete("rating");

    router.push(`/marketplace?${params.toString()}`);
    if (onApply) onApply();
  };

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setRating("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("rating");
    router.push(`/marketplace?${params.toString()}`);
    if (onApply) onApply();
  };

  return (
    <div className={`${isMobile ? "bg-transparent p-0" : "bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-fit sticky top-24"}`}>
      {!isMobile && (
        <h3 className="font-bold text-lg mb-6 text-gray-900 border-b pb-2">Refine Results</h3>
      )}
      
      {/* Price Range */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Price Range (₦)</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="h-12 lg:h-10 border-gray-200 focus:border-[#3bb85e] focus:ring-[#3bb85e]/20"
          />
          <span className="text-gray-400">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-12 lg:h-10 border-gray-200 focus:border-[#3bb85e] focus:ring-[#3bb85e]/20"
          />
        </div>
      </div>

      {/* Ratings Filter */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Minimum Rating</label>
        <div className="flex flex-col gap-2">
          {[4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star.toString())}
              className={`flex items-center gap-2 px-3 py-3 lg:py-2 rounded-xl text-sm transition-all ${
                rating === star.toString()
                  ? "bg-[#3bb85e]/10 text-[#2db568] font-bold"
                  : "text-gray-600 hover:bg-gray-50 bg-gray-50 lg:bg-transparent"
              }`}
            >
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < star ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span>& Up</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <Button
          onClick={applyFilters}
          className="w-full bg-[#2db568] hover:bg-[#259b58] text-white shadow-md shadow-green-100 h-12 lg:h-11"
        >
          Apply Filters
        </Button>
        <Button
          variant="ghost"
          onClick={clearFilters}
          className="w-full text-gray-500 hover:text-red-500 hover:bg-red-50 font-medium h-12 lg:h-11"
        >
          Clear All
        </Button>
      </div>
    </div>
  );
}
