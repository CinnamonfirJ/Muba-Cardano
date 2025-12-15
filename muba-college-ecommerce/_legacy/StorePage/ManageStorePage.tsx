"use client";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  //   Store,
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Settings,
  //   BarChart3,
  TrendingUp,
  //   TrendingDown,
  DollarSign,
  //   Users,
  Star,
  //   ShoppingCart,
  AlertCircle,
  //   CheckCircle,
  Loader2,
  //   MoreVertical,
  Power,
  PowerOff,
} from "lucide-react";
import { storeService, type Store as StoreType } from "@/services/storeService";
import { productService, type Product } from "@/services/productService";
import { authService } from "@/services/authService";
import toast from "react-hot-toast";
import ExpandableTitle from "@/components/ExpandableTitle";

const ManageStorePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState<StoreType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_currentUser, setCurrentUser] = useState<any>(null);

  // Performance metrics state
  const [storeStats, setStoreStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalViews: 0,
    totalSales: 0,
    revenue: 0,
    averageRating: 0,
    recentOrders: 0,
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Get current user
        const user = authService.getCurrentUser();
        if (!user) {
          navigate("/login");
          return;
        }
        setCurrentUser(user);

        if (id) {
          await Promise.all([loadStoreData(id, user), loadStoreProducts(id)]);
        }
      } catch (err: any) {
        setError("Failed to load store data");
        console.error("Error loading initial data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [id, navigate]);

  // Debounced search for products
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (id) {
        loadStoreProducts(id, searchQuery);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, id]);

  const loadStoreData = async (storeId: string, user: any) => {
    try {
      setError(null);
      const response = await storeService.getStoreById(storeId);
      const storeData = response.data || response;

      // Verify ownership
      const ownerId =
        typeof storeData.owner === "object"
          ? storeData.owner._id
          : storeData.owner;
      if (ownerId !== user._id) {
        setError("You don't have permission to manage this store");
        return;
      }

      setStore(storeData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load store data");
      console.error("Error loading store:", err);
    }
  };

  const loadStoreProducts = async (storeId: string, search?: string) => {
    try {
      setIsProductsLoading(true);
      // Note: This assumes your API supports filtering products by store
      // You might need to adjust the API call based on your backend implementation
      const filters = {
        store: storeId,
        ...(search && { search }),
      };

      const response = await productService.getProductsByStore(
        storeId,
        filters
      );
      const productsData = response.data || response.products || response;
      setProducts(Array.isArray(productsData) ? productsData : []);

      // Calculate store stats from products
      calculateStoreStats(productsData);
    } catch (err: any) {
      console.error("Error loading store products:", err);
      setProducts([]);
    } finally {
      setIsProductsLoading(false);
    }
  };

  const calculateStoreStats = (productsData: Product[]) => {
    const stats = {
      totalProducts: productsData.length,
      activeProducts: productsData.filter((p) => p.inStock).length,
      totalViews: productsData.reduce((sum, p) => sum + (p.views || 0), 0),
      totalSales: productsData.reduce(
        (sum, p) => sum + (p.seller?.totalSales || 0),
        0
      ),
      revenue: productsData.reduce(
        (sum, p) => sum + p.price * (p.seller?.totalSales || 0),
        0
      ),
      averageRating:
        productsData.length > 0
          ? productsData.reduce((sum, p) => sum + p.rating, 0) /
            productsData.length
          : 0,
      recentOrders: 0, // This would come from orders API
    };
    setStoreStats(stats);
  };

  const handleToggleStoreStatus = async () => {
    if (!store) return;

    try {
      // This assumes you have an endpoint to toggle store active status
      // You might need to implement this in your backend
      const updatedStore = { ...store, isActive: !store.isActive };
      await storeService.updateStore(store._id, {
        isActive: updatedStore.isActive,
      } as any);
      setStore(updatedStore);
      toast.success(
        `Store ${updatedStore.isActive ? "activated" : "deactivated"} successfully`
      );
    } catch (err: any) {
      toast.error("Failed to update store status");
      console.error("Error updating store status:", err);
    }
  };

  const handleDeleteProduct = async (
    productId: string,
    productTitle: string
  ) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${productTitle}"? This action cannot be undone.`
      )
    ) {
      try {
        await productService.deleteProduct(productId);
        setProducts(products.filter((p) => p._id !== productId));
        toast.success("Product deleted successfully");
      } catch (err: any) {
        toast.error("Failed to delete product");
        console.error("Error deleting product:", err);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-[400px]'>
        <div className='flex items-center gap-2'>
          <Loader2 className='w-6 h-6 animate-spin' />
          <span className='text-gray-600'>Loading store management...</span>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            onClick={() => navigate("/dashboard/storefronts")}
            className='flex items-center gap-2'
          >
            <ArrowLeft className='w-4 h-4' />
            Back to Storefronts
          </Button>
        </div>

        <Card className='bg-red-50 border-red-200'>
          <CardContent className='p-6 text-center'>
            <AlertCircle className='mx-auto mb-4 w-12 h-12 text-red-500' />
            <h3 className='mb-2 font-semibold text-red-800 text-lg'>
              {error || "Store not found"}
            </h3>
            <p className='text-red-600'>
              Please check if you have permission to access this store.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4'>
        {/* Left Section */}
        <div className='flex sm:flex-row flex-col items-start sm:items-center gap-4'>
          <Button
            variant='outline'
            onClick={() => navigate("/dashboard/storefronts")}
            className='flex items-center gap-2'
          >
            <ArrowLeft className='w-4 h-4' />
            Back
          </Button>
          <div>
            <h1 className='font-bold text-gray-900 text-2xl'>Manage Store</h1>
            <p className='text-gray-600'>{store.name}</p>
          </div>
        </div>

        {/* Right Section */}
        <div className='flex sm:flex-row flex-col items-start sm:items-center gap-2 w-full sm:w-auto'>
          <Badge
            className={
              store.isActive !== false
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }
          >
            {store.isActive !== false ? "Active" : "Inactive"}
          </Badge>
          <Button
            variant='outline'
            onClick={handleToggleStoreStatus}
            className='flex items-center gap-2 w-full sm:w-auto'
          >
            {store.isActive !== false ? (
              <PowerOff className='w-4 h-4' />
            ) : (
              <Power className='w-4 h-4' />
            )}
            {store.isActive !== false ? "Deactivate" : "Activate"}
          </Button>
          <Link
            to={`/dashboard/storefronts/edit/${store._id}`}
            className='w-full sm:w-auto'
          >
            <Button
              variant='outline'
              className='flex items-center gap-2 w-full sm:w-auto'
            >
              <Settings className='w-4 h-4' />
              Edit Store
            </Button>
          </Link>
        </div>
      </div>

      {/* Store Overview Stats */}
      <div className='gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex justify-between items-center'>
              <div>
                <p className='font-medium text-gray-600 text-sm'>
                  Total Products
                </p>
                <p className='font-bold text-gray-900 text-2xl'>
                  {storeStats.totalProducts}
                </p>
                <p className='text-gray-500 text-xs'>
                  {storeStats.activeProducts} active
                </p>
              </div>
              <div className='bg-blue-100 p-3 rounded-full'>
                <Package className='w-6 h-6 text-blue-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex justify-between items-center'>
              <div>
                <p className='font-medium text-gray-600 text-sm'>Total Views</p>
                <p className='font-bold text-gray-900 text-2xl'>
                  {storeStats.totalViews}
                </p>
                <div className='flex items-center text-green-600 text-xs'>
                  <TrendingUp className='mr-1 w-3 h-3' />
                  +12% vs last month
                </div>
              </div>
              <div className='bg-green-100 p-3 rounded-full'>
                <Eye className='w-6 h-6 text-green-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex justify-between items-center'>
              <div>
                <p className='font-medium text-gray-600 text-sm'>Revenue</p>
                <p className='font-bold text-gray-900 text-2xl'>
                  {formatCurrency(storeStats.revenue)}
                </p>
                <div className='flex items-center text-green-600 text-xs'>
                  <TrendingUp className='mr-1 w-3 h-3' />
                  +8% vs last month
                </div>
              </div>
              <div className='bg-purple-100 p-3 rounded-full'>
                <DollarSign className='w-6 h-6 text-purple-600' />
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
                  {storeStats.averageRating.toFixed(1)}
                </p>
                <div className='flex items-center text-gray-500 text-xs'>
                  <Star className='fill-yellow-400 mr-1 w-3 h-3 text-yellow-400' />
                  {store.reviewsCount || 0} reviews
                </div>
              </div>
              <div className='bg-orange-100 p-3 rounded-full'>
                <Star className='w-6 h-6 text-orange-600' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Management */}
      <Card>
        <CardHeader className='flex sm:flex-row flex-col justify-between items-start sm:items-center gap-3'>
          <CardTitle className='flex items-center gap-2'>
            <Package className='w-5 h-5' />
            Products ({products.length})
          </CardTitle>

          <Link
            to={`/dashboard/products/new?store=${store._id}`}
            className='w-full sm:w-auto'
          >
            <Button className='bg-[#3bb85e] hover:bg-[#457753] w-full sm:w-auto'>
              <Plus className='mr-2 w-4 h-4' />
              Add Product
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          {/* Search */}
          <div className='relative mb-6'>
            <Search className='top-3 left-3 absolute w-4 h-4 text-gray-400' />
            <Input
              placeholder='Search products...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10'
              disabled={isProductsLoading}
            />
            {isProductsLoading && (
              <Loader2 className='top-3 right-3 absolute w-4 h-4 text-gray-400 animate-spin' />
            )}
          </div>

          {/* Products List */}
          {products.length === 0 ? (
            <div className='py-12 text-center'>
              <Package className='mx-auto mb-4 w-12 h-12 text-gray-400' />
              <h3 className='mb-2 font-medium text-gray-900 text-lg'>
                {searchQuery ? "No products found" : "No products yet"}
              </h3>
              <p className='mb-4 text-gray-600'>
                {searchQuery
                  ? "Try adjusting your search terms."
                  : "Start adding products to your store."}
              </p>
              {!searchQuery && (
                <Link to={`/dashboard/products/new?store=${store._id}`}>
                  <Button className='bg-[#3bb85e] hover:bg-[#457753]'>
                    <Plus className='mr-2 w-4 h-4' />
                    Add Your First Product
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className='space-y-3 sm:space-y-4'>
              {products.map((product) => (
                <div
                  key={product._id}
                  className='bg-white shadow hover:shadow-md border border-gray-200 rounded-lg transition-shadow'
                >
                  <div className='p-3 sm:p-4 md:p-6'>
                    {/* Mobile Layout (< 768px) */}
                    <div className='md:hidden space-y-4'>
                      {/* Image and Status */}
                      <div className='relative'>
                        <img
                          src={
                            product.images?.[0] || "/api/placeholder/400/300"
                          }
                          alt={product.title}
                          className='rounded-lg w-full h-48 object-cover'
                        />
                        <div className='top-2 left-2 absolute'>
                          <Badge
                            className={
                              product.inStock
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {product.inStock ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </div>
                      </div>

                      {/* Title and Price */}
                      <div>
                        <ExpandableTitle text={product.title} />
                        <p className='mt-2 text-gray-600 text-sm line-clamp-2'>
                          {product.description}
                        </p>
                        <div className='flex justify-between items-center mt-3'>
                          <div>
                            <p className='font-bold text-gray-900 text-xl'>
                              {formatCurrency(product.price)}
                            </p>
                            {product.originalPrice &&
                              product.originalPrice > product.price && (
                                <p className='text-gray-500 text-sm line-through'>
                                  {formatCurrency(product.originalPrice)}
                                </p>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className='gap-3 grid grid-cols-2 text-sm'>
                        <div className='bg-gray-50 p-2 rounded-lg'>
                          <p className='text-gray-500 text-xs'>Views</p>
                          <p className='font-semibold text-gray-900'>
                            {product.views || 0}
                          </p>
                        </div>
                        <div className='bg-gray-50 p-2 rounded-lg'>
                          <p className='text-gray-500 text-xs'>Likes</p>
                          <p className='font-semibold text-gray-900'>
                            {product.likes || 0}
                          </p>
                        </div>
                        <div className='bg-gray-50 p-2 rounded-lg'>
                          <p className='text-gray-500 text-xs'>Rating</p>
                          <div className='flex items-center gap-1'>
                            <Star className='fill-yellow-400 w-3 h-3 text-yellow-400' />
                            <span className='font-semibold text-gray-900 text-sm'>
                              {product.rating}
                            </span>
                            <span className='text-gray-500 text-xs'>
                              ({product.reviews})
                            </span>
                          </div>
                        </div>
                        <div className='bg-gray-50 p-2 rounded-lg'>
                          <p className='text-gray-500 text-xs'>Created</p>
                          <p className='font-semibold text-gray-900 text-sm'>
                            {formatDate(product.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Categories */}
                      {product.category && product.category.length > 0 && (
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='text-gray-500 text-xs'>
                            Categories:
                          </span>
                          {product.category.slice(0, 2).map((cat, index) => (
                            <Badge
                              key={index}
                              variant='outline'
                              className='text-xs'
                            >
                              {cat}
                            </Badge>
                          ))}
                          {product.category.length > 2 && (
                            <Badge variant='outline' className='text-xs'>
                              +{product.category.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className='gap-2 grid grid-cols-3'>
                        <Button
                          variant='outline'
                          size='sm'
                          className='w-full text-xs'
                        >
                          <Eye className='w-3 h-3' />
                          <span className='hidden xs:inline ml-1'>View</span>
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          className='w-full text-xs'
                        >
                          <Edit className='w-3 h-3' />
                          <span className='hidden xs:inline ml-1'>Edit</span>
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            handleDeleteProduct(product._id, product.title)
                          }
                          className='w-full text-red-600 hover:text-red-700 text-xs'
                        >
                          <Trash2 className='w-3 h-3' />
                          <span className='hidden xs:inline ml-1'>Delete</span>
                        </Button>
                      </div>
                    </div>

                    {/* Tablet/Desktop Layout (>= 768px) */}
                    <div className='hidden md:flex gap-4 lg:gap-6'>
                      {/* Product Image */}
                      <div className='relative shrink-0'>
                        <img
                          src={
                            product.images?.[0] || "/api/placeholder/150/150"
                          }
                          alt={product.title}
                          className='rounded-lg w-28 lg:w-32 h-28 lg:h-32 object-cover'
                        />
                        <div className='top-2 left-2 absolute'>
                          <Badge
                            className={
                              product.inStock
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {product.inStock ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className='flex-1 space-y-3 min-w-0'>
                        <div className='flex justify-between items-start gap-4'>
                          <div className='flex-1 min-w-0'>
                            <ExpandableTitle text={product.title} />
                            <p className='mt-1 text-gray-600 text-sm line-clamp-2'>
                              {product.description}
                            </p>
                          </div>
                          <div className='text-right shrink-0'>
                            <p className='font-bold text-gray-900 text-lg lg:text-xl'>
                              {formatCurrency(product.price)}
                            </p>
                            {product.originalPrice &&
                              product.originalPrice > product.price && (
                                <p className='text-gray-500 text-sm line-through'>
                                  {formatCurrency(product.originalPrice)}
                                </p>
                              )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className='gap-3 lg:gap-4 grid grid-cols-2 lg:grid-cols-4 text-sm'>
                          <div>
                            <p className='text-gray-500 text-xs'>Views</p>
                            <p className='font-semibold text-gray-900'>
                              {product.views || 0}
                            </p>
                          </div>
                          <div>
                            <p className='text-gray-500 text-xs'>Likes</p>
                            <p className='font-semibold text-gray-900'>
                              {product.likes || 0}
                            </p>
                          </div>
                          <div>
                            <p className='text-gray-500 text-xs'>Rating</p>
                            <div className='flex items-center gap-1'>
                              <Star className='fill-yellow-400 w-4 h-4 text-yellow-400' />
                              <span className='font-semibold text-gray-900'>
                                {product.rating}
                              </span>
                              <span className='text-gray-500 text-xs'>
                                ({product.reviews})
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className='text-gray-500 text-xs'>Created</p>
                            <p className='font-semibold text-gray-900 text-sm'>
                              {formatDate(product.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Categories */}
                        {product.category && product.category.length > 0 && (
                          <div className='flex flex-wrap items-center gap-2'>
                            <span className='text-gray-500 text-sm'>
                              Categories:
                            </span>
                            {product.category.slice(0, 3).map((cat, index) => (
                              <Badge
                                key={index}
                                variant='outline'
                                className='text-xs'
                              >
                                {cat}
                              </Badge>
                            ))}
                            {product.category.length > 3 && (
                              <Badge variant='outline' className='text-xs'>
                                +{product.category.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className='flex flex-col gap-2 shrink-0'>
                        <Button
                          variant='outline'
                          size='sm'
                          className='w-full whitespace-nowrap'
                        >
                          <Eye className='mr-2 w-4 h-4' />
                          View
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          className='w-full whitespace-nowrap'
                        >
                          <Edit className='mr-2 w-4 h-4' />
                          Edit
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            handleDeleteProduct(product._id, product.title)
                          }
                          className='w-full text-red-600 hover:text-red-700 whitespace-nowrap'
                        >
                          <Trash2 className='mr-2 w-4 h-4' />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageStorePage;
