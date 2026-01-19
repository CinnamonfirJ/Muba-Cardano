"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Shirt,
  Monitor,
  Utensils,
  Bed,
  Leaf,
  Car,
  Gamepad2,
  Music,
  Camera,
  LayoutGrid,
} from "lucide-react";

const categories = [
  { icon: LayoutGrid, label: "All", value: "all" },
  { icon: BookOpen, label: "Textbooks", value: "textbooks" },
  { icon: Monitor, label: "Electronics", value: "electronics" },
  { icon: Shirt, label: "Fashion", value: "fashion" },
  { icon: Utensils, label: "Food", value: "food" },
  { icon: Bed, label: "Hostel", value: "hostel" },
  { icon: Leaf, label: "Wellness", value: "wellness" },
  { icon: Car, label: "Transport", value: "transport" },
  { icon: Gamepad2, label: "Gaming", value: "gaming" },
  { icon: Music, label: "Music", value: "music" },
  { icon: Camera, label: "Photography", value: "photography" },
];

export function CategoryBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";

  const handleCategorySelect = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("category");
    } else {
      params.set("category", value);
    }
    router.push(`/marketplace?${params.toString()}`);
  };

  return (
    <div className='bg-white border-b sticky top-16 z-30 lg:hidden'>
      <div className='flex items-center gap-4 overflow-x-auto no-scrollbar py-3 px-4 px-4'>
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategorySelect(cat.value)}
            className={`flex flex-col items-center gap-1 min-w-[70px] transition-all ${
              activeCategory === cat.value
                ? "text-[#3bb85e]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div
              className={`p-2 rounded-xl transition-all ${
                activeCategory === cat.value
                  ? "bg-[#3bb85e]/10 shadow-sm"
                  : "bg-gray-50"
              }`}
            >
              <cat.icon className='w-5 h-5' />
            </div>
            <span className='text-[10px] font-medium whitespace-nowrap uppercase tracking-wider'>
              {cat.label}
            </span>
            {activeCategory === cat.value && (
              <div className='w-1 h-1 bg-[#3bb85e] rounded-full mt-0.5' />
            )}
          </button>
        ))}
      </div>
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
