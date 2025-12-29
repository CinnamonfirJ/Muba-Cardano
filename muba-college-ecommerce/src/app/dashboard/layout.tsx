"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  User,
  ShoppingBag,
  Star,
  Heart,
  CreditCard,
  Settings,
  Store,
  Shield,
  Phone,
  Mail,
  Hash,
  LayoutDashboard,
  ChevronDown,
  Package,
  Trophy,
} from "lucide-react";
import { useState } from "react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false); // Consider removing if sidebar should always be full

  if (!user) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='text-center'>
          <h2 className='font-bold text-gray-900 text-2xl'>Access Denied</h2>
          <p className='mt-2 text-gray-600'>
            Please log in to access your dashboard.
          </p>
          <Link href="/login" className="text-[#3bb85e] hover:underline mt-4 block">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const getFullName = () => {
    const parts = [user.firstname, user.middlename, user.lastname].filter(Boolean);
    return parts.join(" ");
  };

  const avatarUrl =
    user.profile_img ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName())}&background=3bb85e&color=fff`;

  // Sidebar items
  const sidebarItems = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
    {
      name: "Orders",
      href: "/dashboard/orders",
      icon: ShoppingBag,
    },
    {
      name: "Reviews",
      href: "/dashboard/reviews",
      icon: Star,
    },
    {
      name: "Vendors",
      href: "/dashboard/vendors",
      icon: Heart,
    },
    {
      name: "Payment",
      href: "/dashboard/payment",
      icon: CreditCard,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  if (user.role === "vendor") {
    sidebarItems.push({
      name: "Storefronts",
      href: "/dashboard/storefronts",
      icon: Store,
    });
    sidebarItems.push({
      name: "Vendor Orders",
      href: "/dashboard/storefronts/orders",
      icon: Package,
    });
    sidebarItems.push({
      name: "Badges",
      href: "/badges",
      icon: Trophy,
    });
  } else {
    sidebarItems.push({
      name: "Become Vendor",
      href: "/dashboard/become-vendor",
      icon: Store,
    });
  }

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href) && href !== "/dashboard"; // Avoid matching /dashboard on sub-pages if using startsWith
  };

  // Split items - Keeping original logic but sidebar really should probably just show all or be collapsible
  const mainItems = sidebarItems.slice(0, 7); // Show more by default on desktop?
  // Original logic hid items after index 2. I'll just show all for now or keep logic.
  // The original DashboardLayout.tsx had `slice(0, 2)` then `slice(2)` hidden.
  // That seems like a mobile-first or condensed view decision.
  // I'll stick to the original logic for now to avoid surprising changes, but maybe defaulting showMore to true on desktop is better.
  
  // Actually, let's keep it simple.
  const visibleItems = showMore ? sidebarItems : sidebarItems.slice(0, 3);
  const hiddenCount = sidebarItems.length - visibleItems.length;

  return (
    <div className='bg-gray-50 min-h-screen'>
      <div className='mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl'>
        {/* Header */}
        <div className='mb-8'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex sm:flex-row flex-col items-start sm:items-center gap-6'>
                <Avatar className='w-20 h-20'>
                  <AvatarImage
                    src={avatarUrl || "/placeholder.svg"}
                    alt={getFullName()}
                  />
                  <AvatarFallback className='bg-[#3bb85e] text-white text-2xl'>
                    {user.firstname[0]}
                    {user.lastname[0]}
                  </AvatarFallback>
                </Avatar>

                <div className='flex-1'>
                  <div className='flex sm:flex-row flex-col sm:items-center gap-3 mb-3'>
                    <h1 className='font-bold text-gray-900 text-2xl'>
                      {getFullName()}
                    </h1>
                    <div className='flex gap-2'>
                      {user.role !== "user" && (
                        <Badge
                          variant={user.role === "vendor" ? "default" : "secondary"}
                          className='capitalize'
                        >
                          {user.role}
                        </Badge>
                      )}
                      {user.isVerified && (
                        <Badge
                          variant='outline'
                          className='border-green-600 text-green-600'
                        >
                          <Shield className='mr-1 w-3 h-3' />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className='gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 text-gray-600 text-sm'>
                    <div className='flex items-center gap-2'>
                      <Mail className='w-4 h-4' />
                      <span>{user.email}</span>
                    </div>

                    {user.phone && (
                      <div className='flex items-center gap-2'>
                        <Phone className='w-4 h-4' />
                        <span>{user.phone}</span>
                      </div>
                    )}

                    {user.matric_number && (
                      <div className='flex items-center gap-2'>
                        <Hash className='w-4 h-4' />
                        <span>Matric: {user.matric_number}</span>
                      </div>
                    )}
                  </div>

                  {user.rating !== undefined && user.role === "vendor" && (
                    <div className='flex items-center gap-2 mt-3'>
                      <Star className='w-4 h-4 text-yellow-500' />
                      <span className='text-gray-600 text-sm'>
                        Rating: {user.rating}/5 ({user.stores?.length || 0} stores)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Layout with Sidebar */}
        <div className='flex lg:flex-row flex-col gap-8'>
          {/* Sidebar */}
          <div className='shrink-0 lg:w-64'>
            <Card>
              <CardContent className='p-4'>
                <nav className='space-y-2'>
                  {/* Always visible links */}
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href, item.exact);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          active
                            ? "bg-[#3bb85e] text-white"
                            : "text-gray-700 hover:bg-gray-100 hover:text-[#3bb85e]"
                        }`}
                      >
                        <Icon className='w-4 h-4' />
                        {item.name}
                      </Link>
                    );
                  })}

                  {/* Toggle button */}
                  {sidebarItems.length > 3 && (
                    <button
                      onClick={() => setShowMore((prev) => !prev)}
                      className='flex items-center justify-between w-full text-sm font-medium px-3 py-2 rounded-lg border mt-2 hover:bg-gray-100'
                    >
                      <span>{showMore ? "Show less" : "Show more"}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          showMore ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className='flex-1'>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
