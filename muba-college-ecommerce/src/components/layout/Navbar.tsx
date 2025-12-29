"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { UserAccountDropdown } from "../UserAccountDropdown";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  User,
  LogIn,
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
  ChevronDown,
  Trophy,
} from "lucide-react";
import Logo from "../../assets/logo.png";
import { CartDropdown } from "../CartDropdown";
import Image from "next/image";

const categories = [
  { icon: BookOpen, label: "Textbooks", value: "textbooks" },
  { icon: Monitor, label: "Electronics", value: "electronics" },
  { icon: Shirt, label: "Fashion", value: "fashion" },
  { icon: Utensils, label: "Food & Snacks", value: "food" },
  { icon: Bed, label: "Hostel Items", value: "hostel" },
  { icon: Leaf, label: "Wellness", value: "wellness" },
  { icon: Car, label: "Transportation", value: "transport" },
  { icon: Gamepad2, label: "Gaming", value: "gaming" },
  { icon: Music, label: "Music & Audio", value: "music" },
  { icon: Camera, label: "Photography", value: "photography" },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { state: cartState } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const categoryParam =
        selectedCategory !== "all" ? `&category=${selectedCategory}` : "";
      router.push(
        `/marketplace?search=${encodeURIComponent(
          searchQuery.trim()
        )}${categoryParam}`
      );
      setSearchQuery("");
    }
  };

  const handleCategorySelect = (categoryValue: string) => {
    setSelectedCategory(categoryValue);
    setShowCategoryDropdown(false);

    if (categoryValue === "all") {
      router.push("/marketplace");
    } else {
      router.push(`/marketplace?category=${categoryValue}`);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const cartItemsCount = cartState.items.reduce(
    (total: number, item: any) => total + item.quantity,
    0
  );

  const getSelectedCategoryLabel = () => {
    if (selectedCategory === "all") return "All Categories";
    const category = categories.find((cat) => cat.value === selectedCategory);
    return category ? category.label : "All Categories";
  };

  const getSelectedCategoryIcon = () => {
    if (selectedCategory === "all") return null;
    const category = categories.find((cat) => cat.value === selectedCategory);
    return category?.icon || null;
  };

  return (
    <nav className="top-0 z-50 sticky bg-white shadow-md border-gray-100 border-b">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={Logo}
              alt="Logo"
              height={40}
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Search + Category (Desktop) */}
          <div className="hidden md:flex flex-1 mx-8 max-w-3xl">
            <div className="flex items-center w-full">
              {/* Category Selector */}
              <div className="relative mr-3">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="flex items-center gap-2 px-4 py-2 border-gray-200 border-r font-medium text-gray-700 hover:text-[#3bb85e] text-sm whitespace-nowrap"
                >
                  {getSelectedCategoryIcon() &&
                    React.createElement(getSelectedCategoryIcon()!, {
                      className: "w-4 h-4",
                    })}
                  <span>{getSelectedCategoryLabel()}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showCategoryDropdown && (
                  <div className="top-full left-0 z-50 absolute bg-white shadow-lg mt-2 border border-gray-200 rounded-md min-w-[200px]">
                    <button
                      onClick={() => handleCategorySelect("all")}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 ${
                        selectedCategory === "all"
                          ? "bg-[#3bb85e]/10 text-[#3bb85e]"
                          : "text-gray-700"
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.value}
                        onClick={() => handleCategorySelect(category.value)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 ${
                          selectedCategory === category.value
                            ? "bg-[#3bb85e]/10 text-[#3bb85e]"
                            : "text-gray-700"
                        }`}
                      >
                        <category.icon className="w-4 h-4" />
                        {category.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-4 pl-10 rounded-md focus:outline-none focus:ring-[#3bb85e] focus:ring-2"
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Right Side (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {pathname === "/marketplace" ? (
              ""
            ) : (
              <Link
                href="/marketplace"
                className="block hover:bg-gray-50 px-3 py-2 rounded-md font-medium text-gray-700 hover:text-[#3bb85e] text-base"
                onClick={() => setIsMenuOpen(false)}
              >
                Marketplace
              </Link>
            )}

            {/* Cart */}
            <CartDropdown />

            {/* Auth */}
            {isAuthenticated && user ? (
              <UserAccountDropdown user={user} onLogout={handleLogout} />
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login" className="flex items-center gap-1">
                    <LogIn className="w-4 h-4" />
                    Login
                  </Link>
                </Button>
                <Button
                  size="sm"
                  className="bg-[#3bb85e] hover:bg-[#2f914a]"
                  asChild
                >
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center space-x-2">
            <Link href="/checkout" className="relative p-2 text-gray-700">
              <ShoppingCart className="w-6 h-6" />
              {cartItemsCount > 0 && (
                <span className="-top-1 -right-1 absolute flex justify-center items-center bg-[#3bb85e] rounded-full w-5 h-5 text-white text-xs">
                  {cartItemsCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-700 hover:text-[#3bb85e]"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-4 pl-10 rounded-md focus:outline-none focus:ring-[#3bb85e] focus:ring-2"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-md border-gray-100 border-t">
          <div className="space-y-1 px-4 py-3">
            {pathname === "/marketplace" ? (
              ""
            ) : (
              <Link
                href="/marketplace"
                className="block hover:bg-gray-50 px-3 py-2 rounded-md font-medium text-gray-700 hover:text-[#3bb85e] text-base"
                onClick={() => setIsMenuOpen(false)}
              >
                Marketplace
              </Link>
            )}

            {isAuthenticated && user ? (
              <div className="mt-4 pt-4 border-gray-200 border-t">
                <div className="flex items-center px-3 py-2">
                  <User className="w-8 h-8 text-gray-400" />
                  <div className="ml-3">
                    <div className="font-medium text-gray-800 text-base">
                      {user.firstname} {user.lastname}
                    </div>
                    <div className="text-gray-500 text-sm">{user.email}</div>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  className="block hover:bg-gray-50 px-3 py-2 rounded-md font-medium text-gray-700 hover:text-[#3bb85e] text-base"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>

                <Link
                  href="/orders"
                  className="block hover:bg-gray-50 px-3 py-2 rounded-md font-medium text-gray-700 hover:text-[#3bb85e] text-base"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Your Orders
                </Link>

                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block hover:bg-gray-50 px-3 py-2 rounded-md w-full font-medium text-red-600 text-base text-left"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2 mt-4 pt-4 border-gray-200 border-t">
                <Link
                  href="/badges"
                  className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded-md font-bold text-[#3bb85e] text-base"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="p-1 rounded bg-gradient-to-br from-yellow-400 to-orange-500">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                  Badges & Rewards
                </Link>

                <Link
                  href="/login"
                  className="block hover:bg-gray-50 px-3 py-2 rounded-md font-medium text-gray-700 hover:text-[#3bb85e] text-base"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block bg-[#3bb85e] hover:bg-[#2f914a] px-3 py-2 rounded-md font-medium text-white text-base"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
