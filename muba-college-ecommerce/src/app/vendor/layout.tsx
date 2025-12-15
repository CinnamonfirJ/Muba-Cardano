"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import {
  User,
  ShoppingBag,
  Star as StarIcon,
  Store,
  Shield,
  Phone,
  Mail,
  Hash,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "vendor") {
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "vendor") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getFullName = () => {
    const parts = [user.firstname, user.middlename, user.lastname].filter(
      Boolean
    );
    return parts.join(" ");
  };

  const avatarUrl =
    user.profile_img ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      getFullName()
    )}&background=3bb85e&color=fff`;

  const sidebarItems = [
    {
      name: "Overview",
      href: "/vendor/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Orders",
      href: "/vendor/orders",
      icon: ShoppingBag,
    },
    {
      name: "Storefronts",
      href: "/vendor/storefronts",
      icon: Store,
    },
    // Add more vendor specific links
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex sm:flex-row flex-col items-start sm:items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage
                    src={avatarUrl || "/placeholder.svg"}
                    alt={getFullName()}
                  />
                  <AvatarFallback className="bg-[#3bb85e] text-white text-2xl">
                    {user.firstname[0]}
                    {user.lastname[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex sm:flex-row flex-col sm:items-center gap-3 mb-3">
                    <h1 className="font-bold text-gray-900 text-2xl">
                      {getFullName()}
                    </h1>
                    <div className="flex gap-2">
                      <Badge variant="default" className="capitalize">
                        {user.role}
                      </Badge>
                      {user.isVerified && (
                        <Badge
                          variant="outline"
                          className="border-green-600 text-green-600"
                        >
                          <Shield className="mr-1 w-3 h-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 text-gray-600 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Layout with Sidebar */}
        <div className="flex lg:flex-row flex-col gap-8">
          {/* Sidebar */}
          <div className="shrink-0 lg:w-64">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {sidebarItems.map((item) => {
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
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
