"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { storeService, type Store as StoreType } from "@/services/storeService";
import { authService } from "@/services/authService";

const StorefrontsSection = () => {
  const [stores, setStores] = useState<StoreType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentUserId = () => {
    // Get current user
    const user = authService.getCurrentUser();
    if (!user) {
      setError("Please log in to create or edit a store");
      return;
    }

    return user._id;
  };

  // Fetch stores on component mount
  useEffect(() => {
    fetchUserStores();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        fetchUserStores();
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  // Updated to use getUserStores instead of getAllStores
  const fetchUserStores = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userId = getCurrentUserId();
      if (!userId || userId === "USER_ID_HERE") {
        setError("User ID not found. Please log in.");
        setStores([]);
        return;
      }

      const response = await storeService.getUserStores(userId);
      setStores(response.data || response.stores || response);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          `Failed to fetch stores ${getCurrentUserId}`
      );
      console.error("Error fetching user stores:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Original fetchStores method (commented out as requested)
  /*
  const fetchStores = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await storeService.getAllStores();
      setStores(response.data || response.stores || response);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch stores");
      console.error("Error fetching stores:", err);
    } finally {
      setIsLoading(false);
    }
  };
  */

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
        // Optional: Show success message
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to delete store");
        console.error("Error deleting store:", err);
      }
    }
  };

  // Calculate stats from real data
  const totalStores = stores.length;
  const totalProducts = stores.reduce(
    (sum, store) => sum + (store.products?.length || 0),
    0
  );
  const totalFollowers = stores.reduce(
    (sum, store) => sum + (store.followers || 0),
    0
  );
  const averageRating =
    stores.length > 0
      ? (
          stores.reduce((sum, store) => sum + (store.rating || 0), 0) /
          stores.length
        ).toFixed(1)
      : "0.0";

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-[400px]'>
        <div className='flex items-center gap-2'>
          <Loader2 className='w-6 h-6 animate-spin' />
          <span className='text-gray-600'>Loading storefronts...</span>
        </div>
      </div>
    );
  }

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

      {/* Stats Cards */}
      <div className='gap-6 grid grid-cols-1 md:grid-cols-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex justify-between items-center'>
              <div>
                <p className='font-medium text-gray-600 text-sm'>
                  Total Stores
                </p>
                <p className='font-bold text-gray-900 text-2xl'>
                  {totalStores}
                </p>
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
                  Total Products
                </p>
                <p className='font-bold text-gray-900 text-2xl'>
                  {totalProducts}
                </p>
              </div>
              <div className='bg-green-100 p-3 rounded-full'>
                <Package className='w-6 h-6 text-green-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex justify-between items-center'>
              <div>
                <p className='font-medium text-gray-600 text-sm'>
                  Total Followers
                </p>
                <p className='font-bold text-gray-900 text-2xl'>
                  {totalFollowers}
                </p>
              </div>
              <div className='bg-purple-100 p-3 rounded-full'>
                <Settings className='w-6 h-6 text-purple-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex justify-between items-center'>
              <div>
                <p className='font-medium text-gray-600 text-sm'>Avg Rating</p>
                <p className='font-bold text-gray-900 text-2xl'>
                  {averageRating}
                </p>
              </div>
              <div className='bg-orange-100 p-3 rounded-full'>
                <BarChart3 className='w-6 h-6 text-orange-600' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storefronts Management */}
      <Card>
        <CardHeader className='flex sm:flex-row flex-col justify-between items-start sm:items-center gap-3'>
          <CardTitle className='flex items-center gap-2'>
            <Store className='w-5 h-5' />
            My Storefronts
          </CardTitle>

          <Link to='/dashboard/storefronts/new' className='w-full sm:w-auto'>
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
                <Link to={"/dashboard/storefronts/new"}>
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
                  className='hover:shadow-md border border-gray-200 transition-shadow'
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
                            <p className='mt-1 text-gray-600'>
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
                              {store.followers || 0}
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
                      <div className='flex flex-col shrink-0 gap-2'>
                        <Link to={`/storefronts/${store._id}`}>
                          <Button
                            variant='outline'
                            size='sm'
                            className='bg-transparent w-full'
                          >
                            <Eye className='mr-2 w-4 h-4' />
                            View Store
                          </Button>
                        </Link>
                        <Link to={`/dashboard/storefronts/edit/${store._id}`}>
                          <Button
                            variant='outline'
                            size='sm'
                            className='w-full'
                          >
                            <Edit className='mr-2 w-4 h-4' />
                            Edit Store
                          </Button>
                        </Link>
                        <Link to={`/dashboard/storefronts/manage/${store._id}`}>
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
    </div>
  );
};

export default StorefrontsSection;
