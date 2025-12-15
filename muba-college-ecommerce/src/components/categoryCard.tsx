"use client";

import { Card, CardContent } from "./ui/card";
import type { LucideIcon } from "lucide-react";

interface Category {
  icon: LucideIcon;
  label: string;
  count: string;
  color: string;
  description: string;
}

interface CategoryCardProps {
  category: Category;
  isSelected: boolean;
  onClick: () => void;
}

const CategoryCard = ({ category, isSelected, onClick }: CategoryCardProps) => {
  return (
    <Card
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
        isSelected
          ? "ring-2 ring-[#3bb85e] shadow-lg bg-[#f0f9f4]"
          : "hover:shadow-md bg-white"
      }`}
      onClick={onClick}
    >
      <CardContent className='p-4 text-center'>
        <div
          className={`w-12 h-12 rounded-full ${category.color} flex items-center justify-center mx-auto mb-3`}
        >
          <category.icon className='w-6 h-6' />
        </div>
        <h3 className='mb-1 font-semibold text-neutral-800 text-sm'>
          {category.label}
        </h3>
        <p className='mb-2 text-neutral-600 text-xs line-clamp-2'>
          {category.description}
        </p>
        <div className='font-medium text-[#3bb85e] text-xs'>
          {category.count}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;
