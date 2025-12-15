"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Search,
  Eye,
  MessageCircle,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { OrderService, type Order } from "@/services/orderService";
import { useAuth } from "@/context/AuthContext";

const OrdersSection = () => {
  const { user } = useAuth(); // Get user from auth context
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is verified
      if (!user || user.role != "vendor") {
        setError("Please verify your account to view orders");
        setOrders([]);
        setIsLoading(false);
        return;
      }

      // Get user ID
      const vendorId = user._id;
      if (!vendorId) {
        setError("User ID not found");
        setOrders([]);
        setIsLoading(false);
        return;
      }

      const response = await OrderService.getOrders(vendorId);
      const ordersData = response.data || response.orders || response;
      const ordersArray = Array.isArray(ordersData) ? ordersData : [];

      console.log("Orders loaded:", ordersArray);
      setOrders(ordersArray);
    } catch (err: any) {
      console.error("Error loading orders:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to load orders"
      );
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const retryLoad = () => {
    setError(null);
    loadOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className='w-4 h-4' />;
      case "shipped":
        return <Truck className='w-4 h-4' />;
      case "pending":
        return <Clock className='w-4 h-4' />;
      case "cancelled":
        return <XCircle className='w-4 h-4' />;
      case "processing":
        return <Package className='w-4 h-4' />;
      default:
        return <Package className='w-4 h-4' />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user_id?.firstname
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      order.items.some((item) =>
        item.product_id?.title
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" ||
      order.items.some((item) => item.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  const ordersByStatus = {
    all: filteredOrders,
    pending: filteredOrders.filter((order) =>
      order.items.some((item) => item.status === "pending")
    ),
    processing: filteredOrders.filter((order) =>
      order.items.some((item) => item.status === "processing")
    ),
    shipped: filteredOrders.filter((order) =>
      order.items.some((item) => item.status === "shipped")
    ),
    delivered: filteredOrders.filter((order) =>
      order.items.some((item) => item.status === "delivered")
    ),
    cancelled: filteredOrders.filter((order) =>
      order.items.some((item) => item.status === "cancelled")
    ),
  };

  const OrderCard = ({ order }: { order: Order }) => {
    // Get dominant status from items
    const itemStatuses = order.items.map((item) => item.status);
    const dominantStatus = itemStatuses.reduce((a, b, i, arr) =>
      arr.filter((v) => v === a).length >= arr.filter((v) => v === b).length
        ? a
        : b
    );

    return (
      <Card className='hover:shadow-md mb-4 transition-shadow'>
        <CardContent className='p-4 sm:p-6'>
          <div className='space-y-4'>
            {/* Header - Mobile Optimized */}
            <div className='flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3'>
              <div className='space-y-1'>
                <h3 className='font-semibold text-gray-900 text-base sm:text-lg'>
                  Order #{order._id.slice(-8).toUpperCase()}
                </h3>
                <p className='text-gray-500 text-xs sm:text-sm'>
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <Badge
                className={`${getStatusColor(dominantStatus)} self-start sm:self-auto`}
              >
                <div className='flex items-center gap-1'>
                  {getStatusIcon(dominantStatus)}
                  <span className='text-xs sm:text-sm'>
                    {dominantStatus.charAt(0).toUpperCase() +
                      dominantStatus.slice(1)}
                  </span>
                </div>
              </Badge>
            </div>

            {/* Order Items - Mobile Optimized */}
            <div className='space-y-3'>
              {order.items.map((item) => (
                <div key={item._id} className='flex gap-3 sm:gap-4'>
                  {/* Product Image */}
                  <div className='w-16 sm:w-20 h-16 sm:h-20 shrink-0'>
                    {item.product_id?.img ? (
                      <img
                        src={item.product_id.img}
                        alt={item.product_id.title || "Product"}
                        className='rounded-lg w-full h-full object-cover'
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className='flex justify-center items-center bg-gray-100 rounded-lg w-full h-full'>
                        <Package className='w-6 sm:w-8 h-6 sm:h-8 text-gray-400' />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className='flex-1 min-w-0'>
                    <h4 className='font-medium text-gray-900 text-sm sm:text-base truncate'>
                      {item.product_id?.title || "Product"}
                    </h4>
                    <div className='space-y-1 mt-1'>
                      <p className='text-gray-600 text-xs sm:text-sm'>
                        Qty: {item.quantity} × ₦{item.price.toLocaleString()}
                      </p>
                      <Badge
                        className={`${getStatusColor(item.status)} text-xs`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary - Mobile Optimized */}
            <div className='space-y-2 pt-3 border-t'>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-gray-600'>Total Amount:</span>
                <span className='font-bold text-gray-900 text-base sm:text-lg'>
                  ₦{order.total.toLocaleString()}
                </span>
              </div>
              <div className='flex justify-between items-center text-gray-500 text-xs sm:text-sm'>
                <span>
                  {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                </span>
                <span>Updated {formatDate(order.updatedAt)}</span>
              </div>
            </div>

            {/* Action Buttons - Mobile Optimized */}
            <div className='flex sm:flex-row flex-col gap-2 pt-2'>
              <Button
                variant='outline'
                size='sm'
                className='flex-1 text-xs sm:text-sm'
                onClick={() => {
                  console.log("View order details:", order._id);
                }}
              >
                <Eye className='mr-2 w-3 sm:w-4 h-3 sm:h-4' />
                View Details
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='flex-1 text-xs sm:text-sm'
              >
                <MessageCircle className='mr-2 w-3 sm:w-4 h-3 sm:h-4' />
                Contact Seller
              </Button>
              {dominantStatus === "delivered" && (
                <Button
                  size='sm'
                  className='flex-1 bg-[#3bb85e] hover:bg-[#2d8f4a] text-xs sm:text-sm'
                >
                  <Star className='mr-2 w-3 sm:w-4 h-3 sm:h-4' />
                  Leave Review
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Package className='w-5 h-5' />
              Order History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex justify-center items-center py-12'>
              <div className='text-center'>
                <Loader2 className='mx-auto mb-4 w-12 h-12 text-[#3bb85e] animate-spin' />
                <p className='text-gray-600'>Loading your orders...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Package className='w-5 h-5' />
              Order History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex justify-center items-center py-12'>
              <div className='text-center'>
                <AlertCircle className='mx-auto mb-4 w-16 h-16 text-red-400' />
                <h2 className='mb-2 font-semibold text-gray-900 text-xl'>
                  {error}
                </h2>
                <p className='mb-6 max-w-md text-gray-600'>
                  There was a problem loading your orders. Please try again.
                </p>
                <Button
                  onClick={retryLoad}
                  className='bg-[#3bb85e] hover:bg-[#2d8f4a]'
                >
                  <RefreshCw className='mr-2 w-4 h-4' />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-lg sm:text-xl'>
            <Package className='w-5 h-5' />
            Order History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter - Mobile Optimized */}
          <div className='flex sm:flex-row flex-col gap-3 sm:gap-4 mb-6'>
            <div className='relative flex-1'>
              <Search className='top-3 left-3 absolute w-4 h-4 text-gray-400' />
              <Input
                placeholder='Search orders...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 text-sm sm:text-base'
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-full sm:w-48 text-sm sm:text-base'>
                <SelectValue placeholder='Filter by status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Orders</SelectItem>
                <SelectItem value='pending'>Pending</SelectItem>
                <SelectItem value='processing'>Processing</SelectItem>
                <SelectItem value='shipped'>Shipped</SelectItem>
                <SelectItem value='delivered'>Delivered</SelectItem>
                <SelectItem value='cancelled'>Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders Tabs - Mobile Optimized */}
          <Tabs defaultValue='all' className='space-y-4'>
            <TabsList className='gap-1 grid grid-cols-3 sm:grid-cols-6 w-full'>
              <TabsTrigger value='all' className='text-xs sm:text-sm'>
                All
                <span className='hidden sm:inline ml-1'>
                  ({ordersByStatus.all.length})
                </span>
              </TabsTrigger>
              <TabsTrigger value='pending' className='text-xs sm:text-sm'>
                Pending
                <span className='hidden sm:inline ml-1'>
                  ({ordersByStatus.pending.length})
                </span>
              </TabsTrigger>
              <TabsTrigger value='processing' className='text-xs sm:text-sm'>
                Processing
                <span className='hidden sm:inline ml-1'>
                  ({ordersByStatus.processing.length})
                </span>
              </TabsTrigger>
              <TabsTrigger value='shipped' className='text-xs sm:text-sm'>
                Shipped
                <span className='hidden sm:inline ml-1'>
                  ({ordersByStatus.shipped.length})
                </span>
              </TabsTrigger>
              <TabsTrigger value='delivered' className='text-xs sm:text-sm'>
                Delivered
                <span className='hidden sm:inline ml-1'>
                  ({ordersByStatus.delivered.length})
                </span>
              </TabsTrigger>
              <TabsTrigger value='cancelled' className='text-xs sm:text-sm'>
                Cancelled
                <span className='hidden sm:inline ml-1'>
                  ({ordersByStatus.cancelled.length})
                </span>
              </TabsTrigger>
            </TabsList>

            {Object.entries(ordersByStatus).map(([status, statusOrders]) => (
              <TabsContent key={status} value={status}>
                {statusOrders.length === 0 ? (
                  <div className='py-12 text-center'>
                    <Package className='mx-auto mb-4 w-12 h-12 text-gray-400' />
                    <h3 className='mb-2 font-medium text-gray-900 text-base sm:text-lg'>
                      No {status === "all" ? "" : status} orders found
                    </h3>
                    <p className='px-4 text-gray-600 text-sm sm:text-base'>
                      {status === "all"
                        ? "You haven't placed any orders yet."
                        : `You don't have any ${status} orders.`}
                    </p>
                    {(searchQuery || statusFilter !== "all") && (
                      <Button
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
                        }}
                        variant='outline'
                        className='mt-4'
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {statusOrders.map((order) => (
                      <OrderCard key={order._id} order={order} />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersSection;
