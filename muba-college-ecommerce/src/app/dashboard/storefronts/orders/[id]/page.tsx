"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVendorOrder, updateVendorOrder, VendorOrder } from "@/services/vendorOrder.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Truck, CreditCard, Calendar, ShoppingBag, MapPin, User, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import OrderQR from "@/components/OrderQR";

export default function VendorOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["vendorOrder", id],
    queryFn: () => getVendorOrder(id),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status }: { status: VendorOrder["status"] }) =>
      updateVendorOrder(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendorOrder", id] });
      toast.success("Order status updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
    },
  });

  const handleStatusUpdate = (newStatus: string) => {
    updateStatusMutation.mutate({ status: newStatus as VendorOrder["status"] });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4 p-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load order details.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 w-4 h-4" /> Go Back
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800";
      case "shipped": 
      case "sent_to_post_office": return "bg-purple-100 text-purple-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const calculateTotal = () => {
    if (!order.items) return 0;
    const itemsTotal = order.items.reduce((sum, item) => {
        const price = item.product_id?.price ?? item.price ?? 0;
        return sum + (price * item.quantity);
    }, 0);
    return itemsTotal + (order.delivery_fee || 0);
  };

  const totalAmount = calculateTotal();

  return (
    <div className="space-y-6 p-6 max-w-6xl">
       <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
            <h1 className="font-bold text-2xl sm:text-3xl">Order Details</h1>
            <p className="text-muted-foreground">Order #{order._id.slice(-8).toUpperCase()}</p>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            <div className="flex flex-col items-end gap-1">
                <Select 
                    value={order.status} 
                    onValueChange={handleStatusUpdate}
                    disabled={updateStatusMutation.isPending || 
                              (order.delivery_option === "school_post" && 
                               ["processing", "sent_to_post_office", "shipped", "delivered"].includes(order.status))}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        {order.delivery_option !== "school_post" && (
                          <>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                          </>
                        )}
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
                {order.delivery_option === "school_post" && order.status === "processing" && (
                    <span className="text-[10px] text-blue-600 font-medium">
                        Scan at Post Office to Ship ↗
                    </span>
                )}
            </div>
        </div>
      </div>

      <div className="gap-6 grid grid-cols-1 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5" />
                        Items
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {order.items.map((item) => (
                        <div key={item.product_id._id} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
                             <div className="bg-gray-100 rounded-md w-20 h-20 overflow-hidden shrink-0">
                                <img 
                                    src={item.product_id?.img?.[0] || "/placeholder.svg"} 
                                    alt={item.name} 
                                    className="w-full h-full object-cover"
                                />
                             </div>
                             <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-medium">{item.product_id?.title || item.name}</h4>
                                        <p className="text-muted-foreground text-sm">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="font-semibold">₦{((item.product_id?.price ?? item.price ?? 0) * item.quantity).toLocaleString()}</p>
                                </div>
                             </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Payment Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₦{((totalAmount - (order.delivery_fee || 0))).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery Fee</span>
                        <span>₦{(order.delivery_fee || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold text-lg">
                        <span>Total Revenue</span>
                        <span>₦{totalAmount.toLocaleString()}</span>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            {/* QR Code for Post Office Handoff */}
            {order.delivery_option === "school_post" && 
             ["pending", "confirmed", "processing"].includes(order.status) && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center gap-2 text-base">
                    <Truck className="w-4 h-4" />
                    Post Office Handoff
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center pb-6">
                  <OrderQR 
                    orderId={order.order_id || order._id} 
                    sellerId={order.vendor_id}
                    deliveryType="school_post"
                    action="handoff"
                  />
                </CardContent>
              </Card>
            )}

            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-base">
                        <User className="w-4 h-4" />
                        Customer Information
                     </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">{order.customer_id?.firstname} {order.customer_id?.lastname}</p>
                            <p className="text-muted-foreground">{order.customer_id?.email}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-base">
                        <Truck className="w-4 h-4" />
                        Delivery Details
                     </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Method</p>
                        <p className="font-medium capitalize">{order.delivery_option?.replace("_", " ") || "Standard"}</p>
                    </div>
                    <div>
                         <p className="text-muted-foreground">Date Placed</p>
                         <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{format(new Date(order.createdAt), "PPP p")}</span>
                         </div>
                    </div>
                    {order.rider_info && (
                        <div className="border-t pt-2">
                            <p className="mb-1 font-medium">Rider Info</p>
                            <p className="text-muted-foreground">{order.rider_info.name}</p>
                            <p className="text-muted-foreground">{order.rider_info.phone}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
