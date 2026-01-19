"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Store,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Package,
  Star,
  Settings,
  BarChart3,
  Loader2,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { storeService, type Store as StoreType } from "@/services/storeService";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

const formatNaira = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

const StorefrontsPage = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Vendor Analytics
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery<any>({
    queryKey: ["vendorAnalytics"],
    queryFn: async () => {
      const response = await api.get("/api/v1/analytics/vendor");
      return response.data.data;
    },
    enabled: !!user?._id,
  });

  // Fetch Vendor Reviews
  const { data: reviews = [], isLoading: isReviewsLoading } = useQuery<any[]>({
    queryKey: ["vendorReviews"],
    queryFn: async () => {
      const response = await api.get("/api/v1/analytics/vendor/reviews");
      return response.data.data;
    },
    enabled: !!user?._id,
  });

  // Fetch stores on component mount
  useEffect(() => {
    if (user?._id) {
      fetchUserStores(user._id);
    }
  }, [user]);

  // Debounced search effect
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else if (user?._id) {
        fetchUserStores(user._id);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, user]);

  const fetchUserStores = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await storeService.getUserStores(userId);
      setStores(response.data || response.stores || response);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to fetch stores`);
      console.error("Error fetching user stores:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      setError(null);
      const response = await storeService.searchStores({ q: searchQuery });
      setStores(response.data || response.stores || response);
    } catch (err: any) {
      setError(err.response?.data?.message || "Search failed");
      console.error("Error searching stores:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteStore = async (storeId: string, storeName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${storeName}"? This action cannot be undone.`
      )
    ) {
      try {
        await storeService.deleteStore(storeId);
        setStores(stores.filter((store) => store._id !== storeId));
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to delete store");
        console.error("Error deleting store:", err);
      }
    }
  };

  // Calculate stats from real data
  const totalStores = stores.length;
  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading && !stores.length) {
    return (
      <div className='flex justify-center items-center min-h-[400px]'>
        <div className='flex items-center gap-2'>
          <Loader2 className='w-6 h-6 animate-spin' />
          <span className='text-gray-600'>Loading storefronts...</span>
        </div>
      </div>
    );
  }

  const { sales, earnings, trend } = analytics || {};

  return (
    <div className='space-y-6'>
      {/* Error Message */}
      {error && (
        <Card className='bg-red-50 border-red-200'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 text-red-800'>
              <span className='font-medium'>Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Section */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#3bb85e]" />
            Business Performance
        </h2>
        <div className='gap-6 grid grid-cols-1 md:grid-cols-4'>
            <Card>
                <CardContent className='p-6'>
                    <div className='flex justify-between items-center'>
                    <div>
                        <p className='font-medium text-gray-600 text-sm'>
                        Total Sales
                        </p>
                        <p className='font-bold text-gray-900 text-2xl'>
                        {formatNaira(earnings?.total || 0)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{sales?.completed || 0} Delivered Orders</p>
                    </div>
                    <div className='bg-green-100 p-3 rounded-full'>
                        <DollarSign className='w-6 h-6 text-green-600' />
                    </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className='p-6'>
                    <div className='flex justify-between items-center'>
                    <div>
                        <p className='font-medium text-gray-600 text-sm'>
                        Pending Escrow
                        </p>
                        <p className='font-bold text-gray-900 text-2xl'>
                        {formatNaira(earnings?.pending || 0)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">In active transit</p>
                    </div>
                    <div className='bg-orange-100 p-3 rounded-full'>
                        <Package className='w-6 h-6 text-orange-600' />
                    </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className='p-6'>
                    <div className='flex justify-between items-center'>
                    <div>
                        <p className='font-medium text-gray-600 text-sm'>
                        Active Stores
                        </p>
                        <p className='font-bold text-gray-900 text-2xl'>
                        {totalStores}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Platform visibility</p>
                    </div>
                    <div className='bg-blue-100 p-3 rounded-full'>
                        <Store className='w-6 h-6 text-blue-600' />
                    </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className='p-6'>
                    <div className='flex justify-between items-center'>
                    <div>
                        <p className='font-medium text-gray-600 text-sm'>
                        Overall Rating
                        </p>
                        <p className='font-bold text-gray-900 text-2xl'>
                        {stores.length > 0 
                          ? (stores.reduce((acc, s) => acc + (s.rating || 0), 0) / stores.length).toFixed(1) 
                          : "0.0"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{reviews.length} Recent Reviews</p>
                    </div>
                    <div className='bg-yellow-100 p-3 rounded-full'>
                        <Star className='w-6 h-6 text-yellow-600 fill-current' />
                    </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Storefronts Management */}
      <Card>
        <CardHeader className='flex sm:flex-row flex-col justify-between items-start sm:items-center gap-3'>
          <CardTitle className='flex items-center gap-2'>
            <Store className='w-5 h-5' />
            My Storefronts
          </CardTitle>

          <Link href='/dashboard/storefronts/new' className='w-full sm:w-auto'>
            <Button className='bg-[#3bb85e] hover:bg-[#457753] w-full sm:w-auto'>
              <Plus className='mr-2 w-4 h-4' />
              Create New Store
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          {/* Search */}
          <div className='relative mb-6'>
            <Search className='top-3 left-3 absolute w-4 h-4 text-gray-400' />
            <Input
              placeholder='Search storefronts...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10'
              disabled={isSearching}
            />
            {isSearching && (
              <Loader2 className='top-3 right-3 absolute w-4 h-4 text-gray-400 animate-spin' />
            )}
          </div>

          {/* Storefronts List */}
          {stores.length === 0 ? (
            <div className='py-12 text-center'>
              <Store className='mx-auto mb-4 w-12 h-12 text-gray-400' />
              <h3 className='mb-2 font-medium text-gray-900 text-lg'>
                {searchQuery ? "No storefronts found" : "No storefronts yet"}
              </h3>
              <p className='mb-4 text-gray-600'>
                {searchQuery
                  ? "Try adjusting your search terms."
                  : "Create your first storefront to start selling your products."}
              </p>
              {!searchQuery && (
                <Link href='/dashboard/storefronts/new'>
                  <Button className='bg-[#3bb85e] hover:bg-[#457753]'>
                    <Plus className='mr-2 w-4 h-4' />
                    Create Your First Store
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className='space-y-4'>
              {stores.map((store) => (
                <Card
                  key={store._id}
                  className='hover:shadow-md border border-gray-200 transition-shadow overflow-hidden'
                >
                  <CardContent className='p-6'>
                    <div className='flex lg:flex-row flex-col gap-6'>
                      {/* Store Image */}
                      <div className='relative shrink-0'>
                        <img
                          src={
                            store.img ||
                            "/placeholder.svg?height=200&width=300&text=Store"
                          }
                          alt={`${store.name} image`}
                          className='rounded-lg w-full lg:w-48 h-32 object-cover'
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "/placeholder.svg?height=200&width=300&text=Store";
                          }}
                        />
                        <div className='top-2 left-2 absolute'>
                          <Badge className='bg-green-100 text-green-800'>
                            Active
                          </Badge>
                        </div>
                      </div>

                      {/* Store Info */}
                      <div className='flex-1 space-y-4'>
                        <div className='flex justify-between items-start'>
                          <div>
                            <h3 className='font-semibold text-gray-900 text-xl'>
                              {store.name}
                            </h3>
                            <p className='mt-1 text-gray-600 line-clamp-2'>
                              {store.description}
                            </p>
                            {store.location && (
                              <p className='mt-1 text-gray-500 text-sm'>
                                📍 {store.location}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className='gap-4 grid grid-cols-2 md:grid-cols-4 text-sm'>
                          <div>
                            <p className='text-gray-500'>Products</p>
                            <p className='font-semibold text-gray-900'>
                              {store.products?.length || 0}
                            </p>
                          </div>
                          <div>
                            <p className='text-gray-500'>Followers</p>
                            <p className='font-semibold text-gray-900'>
                              {store.followers.length || 0}
                            </p>
                          </div>
                          <div>
                            <p className='text-gray-500'>Rating</p>
                            <div className='flex items-center gap-1'>
                              <Star className='fill-yellow-400 w-4 h-4 text-yellow-400' />
                              <span className='font-semibold text-gray-900'>
                                {store.rating || 0}
                              </span>
                              <span className='text-gray-500'>
                                ({store.reviewsCount || 0})
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className='text-gray-500'>Created</p>
                            <p className='font-semibold text-gray-900'>
                              {formatDate(store.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Categories */}
                        {store.categories && store.categories.length > 0 && (
                          <div className='flex flex-wrap items-center gap-2'>
                            <span className='text-gray-500 text-sm'>
                              Categories:
                            </span>
                            {store.categories
                              .slice(0, 3)
                              .map((category, index) => (
                                <Badge
                                  key={index}
                                  variant='outline'
                                  className='text-xs'
                                >
                                  {category}
                                </Badge>
                              ))}
                            {store.categories.length > 3 && (
                              <Badge variant='outline' className='text-xs'>
                                +{store.categories.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className='flex flex-col gap-2 shrink-0'>
                        <Link href={`/store/${store._id}`}>
                          <Button
                            variant='outline'
                            size='sm'
                            className='bg-transparent w-full'
                          >
                            <Eye className='mr-2 w-4 h-4' />
                            View Store
                          </Button>
                        </Link>
                        <Link href={`/dashboard/storefronts/edit/${store._id}`}>
                          <Button
                            variant='outline'
                            size='sm'
                            className='w-full'
                          >
                            <Edit className='mr-2 w-4 h-4' />
                            Edit Store
                          </Button>
                        </Link>
                        <Link
                          href={`/dashboard/storefronts/manage/${store._id}`}
                        >
                          <Button
                            variant='outline'
                            size='sm'
                            className='w-full'
                          >
                            <Package className='mr-2 w-4 h-4' />
                            Manage Products
                          </Button>
                        </Link>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                              handleDeleteStore(store._id, store.name)
                          }
                          className='w-full text-red-600 hover:text-red-700'
                        >
                          <Trash2 className='mr-2 w-4 h-4' />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Latest Reviews Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
            Latest Store Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isReviewsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No reviews yet for your storefronts.
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <div key={review._id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                            {review.user?.profile_img ? (
                                <img src={review.user.profile_img} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                                    {review.user?.firstname?.[0] || "?"}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-semibold">
                                {review.user?.firstname} {review.user?.lastname}
                                <span className="ml-2 font-normal text-xs text-muted-foreground italic truncate">on {review.store?.name}</span>
                            </p>
                            <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 ml-10">{review.review}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StorefrontsPage;
