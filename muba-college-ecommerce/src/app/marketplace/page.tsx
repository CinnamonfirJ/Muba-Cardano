"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import { FilterSidebar } from "./FilterSidebar";
import { CategoryBar } from "./CategoryBar";
import { useInfiniteProducts } from "@/hooks/useProducts";
import { Product } from "@/services/productService";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get parameters from URL
  const categoryParam = searchParams.get("category") || "all";
  const searchParam = searchParams.get("search") || "";
  const locationParam = searchParams.get("location") || "";
  const conditionParam = searchParams.get("condition") || "";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const ratingParam = searchParams.get("rating") || "";

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
    search: searchParam,
    category: categoryParam !== "all" ? categoryParam : undefined,
    location: locationParam || undefined,
    condition: conditionParam || undefined,
    minPrice: minPriceParam ? parseFloat(minPriceParam) : undefined,
    maxPrice: maxPriceParam ? parseFloat(maxPriceParam) : undefined,
    rating: ratingParam ? parseFloat(ratingParam) : undefined,
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

  // Metadata from first page
  const firstPage = data?.pages[0];
  const totalProducts = firstPage?.pagination?.total || products.length;

  const getCategoryDisplayName = () => {
    if (categoryParam === "all") return "All Products";
    return categoryMap[categoryParam] || "All Products";
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (categoryParam !== "all") count++;
    if (searchParam) count++;
    if (locationParam) count++;
    if (conditionParam) count++;
    if (minPriceParam || maxPriceParam) count++;
    if (ratingParam) count++;
    return count;
  };

  return (
    <main className='bg-gray-50 min-h-screen'>
      <MarketplaceBanner />
      <CategoryBar />

      <div className='mx-auto px-4 py-6 max-w-7xl'>
        {/* Header */}
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h1 className='mb-1 font-semibold text-gray-900 text-2xl'>
              {getCategoryDisplayName()}
            </h1>
            <p className='text-gray-600'>
              {isLoading ? "Loading products..." : `${totalProducts} product${totalProducts !== 1 ? "s" : ""} available`}
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-[#3bb85e] text-white border-[#3bb85e]" : "hover:border-[#3bb85e]"}
            >
              <Grid3X3 className='w-4 h-4' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-[#3bb85e] text-white border-[#3bb85e]" : "hover:border-[#3bb85e]"}
            >
              <List className='w-4 h-4' />
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {getActiveFiltersCount() > 0 && (
          <div className='mb-6'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-gray-600 text-sm'>Active filters:</span>
              {categoryParam !== "all" && <Badge variant='secondary' className='bg-[#3bb85e]/10 border-[#3bb85e]/20 text-[#3bb85e]'>{getCategoryDisplayName()}</Badge>}
              {searchParam && <Badge variant='secondary' className='bg-blue-50 border-blue-200 text-blue-700'>Search: "{searchParam}"</Badge>}
              {locationParam && <Badge variant='secondary' className='bg-purple-50 border-purple-200 text-purple-700'>Location: {locationParam}</Badge>}
              {conditionParam && <Badge variant='secondary' className='bg-orange-50 border-orange-200 text-orange-700'>Condition: {conditionParam}</Badge>}
              {(minPriceParam || maxPriceParam) && (
                <Badge variant='secondary' className='bg-green-50 border-green-200 text-green-700'>
                  Price: ₦{minPriceParam || "0"} - {maxPriceParam ? `₦${maxPriceParam}` : "∞"}
                </Badge>
              )}
              {ratingParam && <Badge variant='secondary' className='bg-yellow-50 border-yellow-200 text-yellow-700'>Rating: {ratingParam}+ stars</Badge>}
            </div>
          </div>
        )}

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="hidden lg:block lg:col-span-1">
            <FilterSidebar />
          </div>

          <div className="lg:col-span-3">
            {isError && (
              <div className='py-16 text-center'>
                <AlertCircle className='mx-auto mb-4 w-16 h-16 text-red-400' />
                <h3 className='mb-2 font-semibold text-red-600 text-xl'>Failed to load products</h3>
                <p className='mb-6 text-gray-500'>{(error as any)?.message}</p>
                <Button onClick={() => refetch()} className='bg-[#3bb85e] text-white'><RefreshCw className='mr-2 w-4 h-4' /> Try Again</Button>
              </div>
            )}

            {isLoading && (
              <div className='py-16 text-center'>
                <Loader2 className='mx-auto mb-4 w-16 h-16 text-[#3bb85e] animate-spin' />
                <h3 className='font-semibold text-gray-600 text-xl'>Loading products...</h3>
              </div>
            )}

            {!isLoading && !isError && products.length === 0 && (
              <div className='py-16 text-center'>
                <Search className='mx-auto mb-4 w-16 h-16 text-gray-400' />
                <h3 className='font-semibold text-gray-600 text-xl'>No products found</h3>
                <Button onClick={() => (window.location.href = "/marketplace")} className='mt-4 bg-[#3bb85e] text-white'>View All Products</Button>
              </div>
            )}

            {!isError && products.length > 0 && (
              <>
                <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4" : "flex flex-col gap-4"}>
                  {products.map((product) => <ProductCard key={product._id} item={product} viewMode={viewMode} />)}
                </div>

                {hasNextPage && (
                  <div className='mt-8 text-center'>
                    <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} variant='outline' className='border-[#3bb85e] text-[#3bb85e]'>
                      {isFetchingNextPage ? <Loader2 className='mr-2 w-4 h-4 animate-spin' /> : "Load More Products"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Floating Filter Button */}
      <div className='lg:hidden fixed bottom-6 right-6 z-40 transform transition-transform active:scale-95'>
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button className='bg-[#3bb85e] hover:bg-[#2f914a] text-white shadow-xl rounded-full w-14 h-14 p-0 border-2 border-white flex items-center justify-center relative animate-in fade-in zoom-in duration-500'>
              <SlidersHorizontal className='w-6 h-6' />
              {getActiveFiltersCount() > 0 && (
                <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white'>
                  {getActiveFiltersCount()}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side='bottom' className='rounded-t-3xl h-[85vh] p-0 overflow-hidden border-none'>
            <SheetHeader className='p-6 border-b bg-gray-50/50'>
              <SheetTitle className='flex items-center gap-2 text-xl font-bold'>
                <SlidersHorizontal className='w-5 h-5' />
                Filter Products
              </SheetTitle>
            </SheetHeader>
            <div className='p-6 overflow-y-auto h-full pb-32'>
              <FilterSidebar isMobile onApply={() => setIsFilterOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
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
