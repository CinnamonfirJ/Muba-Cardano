"use client";

import React from "react";
import { Award, Shield, Star, Truck, Package } from "lucide-react";

interface VendorBadgesProps {
  successfulDeliveries?: number;
  rating?: number;
  isPostOffice?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const VendorBadges: React.FC<VendorBadgesProps> = ({
  successfulDeliveries = 0,
  rating = 0,
  isPostOffice = false,
  className = "",
  size = "md",
}) => {
  const badges: { icon: React.ReactNode; label: string; color: string; earned: boolean }[] = [];

  // Trusted Shipper Badge (5+ successful deliveries)
  if (successfulDeliveries >= 5) {
    badges.push({
      icon: <Truck className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />,
      label: "Trusted Shipper",
      color: "bg-blue-100 text-blue-700 border-blue-200",
      earned: true,
    });
  }

  // Top Seller Badge (20+ successful deliveries)
  if (successfulDeliveries >= 20) {
    badges.push({
      icon: <Award className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />,
      label: "Top Seller",
      color: "bg-yellow-100 text-yellow-700 border-yellow-200",
      earned: true,
    });
  }

  // Post Office Partner Badge
  if (isPostOffice) {
    badges.push({
      icon: <Shield className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />,
      label: "PO Partner",
      color: "bg-green-100 text-green-700 border-green-200",
      earned: true,
    });
  }

  // High Rating Badge (4.5+ rating)
  if (rating >= 4.5) {
    badges.push({
      icon: <Star className={size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"} />,
      label: "Highly Rated",
      color: "bg-purple-100 text-purple-700 border-purple-200",
      earned: true,
    });
  }

  if (badges.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-0.5",
    md: "text-xs px-2 py-1 gap-1",
    lg: "text-sm px-3 py-1.5 gap-1.5",
  };

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {badges.map((badge, index) => (
        <div
          key={index}
          className={`flex items-center ${sizeClasses[size]} rounded-full border font-medium ${badge.color}`}
          title={badge.label}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </div>
      ))}
      
      {/* Delivery Counter */}
      {successfulDeliveries > 0 && (
        <div
          className={`flex items-center ${sizeClasses[size]} rounded-full border font-medium bg-slate-100 text-slate-700 border-slate-200`}
          title={`${successfulDeliveries} Successful Deliveries`}
        >
          <Package className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
          <span>{successfulDeliveries}</span>
        </div>
      )}
    </div>
  );
};

export default VendorBadges;
