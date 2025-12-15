"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Search,
  Grid3X3,
  List,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/productCard";
import MarketplaceBanner from "@/components/MarketplaceBanner";
import { useInfiniteProducts } from "@/hooks/useProducts";
import { Product } from "@/services/productService";

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter(); // For future navigation
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Get parameters from URL
  const categoryParam = searchParams.get("category") || "all";
  const searchParam = searchParams.get("search") || "";
  const locationParam = searchParams.get("location") || "";
  const conditionParam = searchParams.get("condition") || "";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";

  // Map URL category values
  const categoryMap: { [key: string]: string } = {
    textbooks: "Textbooks",
    electronics: "Electronics",
    fashion: "Fashion",
    food: "Food & Snacks",
    hostel: "Hostel Items",
    wellness: "Wellness",
    transport: "Transportation",
    gaming: "Gaming",
    music: "Music & Audio",
    photography: "Photography",
  };

  // Construct filters
  const filters: any = {
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
    q: searchParam,
    category:
      categoryParam !== "all" ? categoryMap[categoryParam] || undefined : undefined,
    location: locationParam || undefined,
    condition: conditionParam || undefined,
    minPrice: minPriceParam ? parseFloat(minPriceParam) : undefined,
    maxPrice: maxPriceParam ? parseFloat(maxPriceParam) : undefined,
  };

  // useInfiniteQuery hook
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteProducts(filters);

  // Flatten products from all pages
  const products: Product[] = data
    ? data.pages.flatMap((page: any) => page.data || page.products || page || [])
    : [];

  // Calculate total products (naive estimation from first page metadata if available)
  const firstPage = data?.pages[0];
  const totalProducts = firstPage?.pagination?.total || products.length;

  // Get category display name
  const getCategoryDisplayName = () => {
    if (categoryParam === "all") return "All Products";
    const categoryLabels: { [key: string]: string } = {
      textbooks: "Textbooks",
      electronics: "Electronics",
      fashion: "Fashion",
      food: "Food & Snacks",
      hostel: "Hostel Items",
      wellness: "Wellness",
      transport: "Transportation",
      gaming: "Gaming",
      music: "Music & Audio",
      photography: "Photography",
    };
    return categoryLabels[categoryParam] || "All Products";
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (categoryParam !== "all") count++;
    if (searchParam) count++;
    if (locationParam) count++;
    if (conditionParam) count++;
    if (minPriceParam || maxPriceParam) count++;
    return count;
  };

  return (
    <main className='bg-gray-50 min-h-screen'>
      <MarketplaceBanner />

      {/* Main Content */}
      <div className='mx-auto px-4 py-6 max-w-7xl'>
        {/* Header with View Controls */}
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h1 className='mb-1 font-semibold text-gray-900 text-2xl'>
              {getCategoryDisplayName()}
            </h1>
            <p className='text-gray-600'>
              {isLoading ? (
                "Loading products..."
              ) : (
                <>
                  {totalProducts} product{totalProducts !== 1 ? "s" : ""}{" "}
                  available
                  {searchParam && ` for "${searchParam}"`}
                </>
              )}
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setViewMode("grid")}
              className={
                viewMode === "grid"
                  ? "bg-[#3bb85e] text-white border-[#3bb85e]"
                  : "hover:border-[#3bb85e]"
              }
            >
              <Grid3X3 className='w-4 h-4' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setViewMode("list")}
              className={
                viewMode === "list"
                  ? "bg-[#3bb85e] text-white border-[#3bb85e]"
                  : "hover:border-[#3bb85e]"
              }
            >
              <List className='w-4 h-4' />
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <div className='mb-6'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-gray-600 text-sm'>Active filters:</span>
              {categoryParam !== "all" && (
                <Badge
                  variant='secondary'
                  className='bg-[#3bb85e]/10 border-[#3bb85e]/20 text-[#3bb85e]'
                >
                  {getCategoryDisplayName()}
                </Badge>
              )}
              {searchParam && (
                <Badge
                  variant='secondary'
                  className='bg-blue-50 border-blue-200 text-blue-700'
                >
                  Search: "{searchParam}"
                </Badge>
              )}
              {locationParam && (
                <Badge
                  variant='secondary'
                  className='bg-purple-50 border-purple-200 text-purple-700'
                >
                  Location: {locationParam}
                </Badge>
              )}
              {conditionParam && (
                <Badge
                  variant='secondary'
                  className='bg-orange-50 border-orange-200 text-orange-700'
                >
                  Condition: {conditionParam}
                </Badge>
              )}
              {(minPriceParam || maxPriceParam) && (
                <Badge
                  variant='secondary'
                  className='bg-green-50 border-green-200 text-green-700'
                >
                  Price: {minPriceParam ? `₦${minPriceParam}` : "₦0"} -{" "}
                  {maxPriceParam ? `₦${maxPriceParam}` : "∞"}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className='py-16 text-center'>
            <div className='mb-4 text-red-400'>
              <AlertCircle className='mx-auto w-16 h-16' />
            </div>
            <h3 className='mb-2 font-semibold text-red-600 text-xl'>
              Failed to load products
            </h3>
            <p className='mb-6 text-gray-500'>{(error as any)?.message}</p>
            <Button
              onClick={() => refetch()}
              className='bg-[#3bb85e] hover:bg-[#457753] text-white'
            >
              <RefreshCw className='mr-2 w-4 h-4' />
              Try Again
            </Button>
          </div>
        )}

        {/* Loading State (Initial) */}
        {isLoading && (
          <div className='py-16 text-center'>
            <div className='mb-4'>
              <Loader2 className='mx-auto w-16 h-16 text-[#3bb85e] animate-spin' />
            </div>
            <h3 className='mb-2 font-semibold text-gray-600 text-xl'>
              Loading products...
            </h3>
            <p className='text-gray-500'>
              Please wait while we fetch the latest products for you.
            </p>
          </div>
        )}

        {/* No Products Found */}
        {!isLoading && !isError && products.length === 0 && (
          <div className='py-16 text-center'>
            <div className='mb-4 text-gray-400'>
              <Search className='mx-auto w-16 h-16' />
            </div>
            <h3 className='mb-2 font-semibold text-gray-600 text-xl'>
              No products found
            </h3>
            <p className='mb-6 text-gray-500'>
              {searchParam
                ? `No products found for "${searchParam}" in ${getCategoryDisplayName().toLowerCase()}`
                : `No products found in ${getCategoryDisplayName().toLowerCase()}`}
            </p>
            <Button
              onClick={() => (window.location.href = "/marketplace")}
              className='bg-[#3bb85e] hover:bg-[#457753] text-white'
            >
              View All Products
            </Button>
          </div>
        )}

        {/* Products Grid/List */}
        {!isError && products.length > 0 && (
          <>
            <div
              className={`${
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                  : "flex flex-col gap-4"
              }`}
            >
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  item={product}
                  viewMode={viewMode}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
              <div className='mt-8 text-center'>
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant='outline'
                  className='hover:bg-[#3bb85e] border-[#3bb85e] text-[#3bb85e] hover:text-white'
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className='mr-2 w-4 h-4 animate-spin' />
                      Loading more...
                    </>
                  ) : (
                    <>
                      Load More Products
                      <span className='ml-2 text-gray-500 text-xs'>
                        ({products.length} shown)
                      </span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* End of results indicator */}
            {!hasNextPage && products.length > 10 && (
              <div className='mt-8 py-4 border-t text-gray-500 text-sm text-center'>
                You've reached the end of the results
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading marketplace...</div>}>
      <MarketplaceContent />
    </Suspense>
  );
}
