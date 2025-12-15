"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Truck, CreditCard, Calendar, ShoppingBag, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import OrderQR from "@/components/OrderQR";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: orderResponse, isLoading, error } = useQuery({
    queryKey: ["order", id],
    queryFn: () => orderService.getOrderById(id),
    enabled: !!id,
  });

  const order = orderResponse?.data;

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
            Failed to load order details. Please try again later.
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
      case "shipped": return "bg-purple-100 text-purple-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const calculateTotal = () => {
    const itemsTotal = order.items.reduce((sum: number, item: any) => {
        const price = item.product_id?.price ?? item.price ?? 0;
        return sum + (price * item.quantity);
    }, 0);
    return itemsTotal + (order.delivery_fee || 0);
  };

  const totalAmount = calculateTotal();

  return (
    <div className="space-y-6 max-w-5xl">
       <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-bold text-2xl sm:text-3xl">Order Details</h1>
          <p className="text-muted-foreground">Order #{order._id.slice(-8).toUpperCase()}</p>
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
                    {order.items.map((item: any) => (
                        <div key={item._id} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
                             <div className="bg-gray-100 rounded-md w-20 h-20 overflow-hidden shrink-0">
                                <img 
                                    src={item.product_id?.images?.[0] || item.product_id?.img?.[0] || item.img?.[0] || "/placeholder.svg"} 
                                    alt={item.name} 
                                    className="w-full h-full object-cover"
                                />
                             </div>
                             <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-medium">{item.product_id?.title || item.name || "Product"}</h4>
                                        <p className="text-muted-foreground text-sm">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="font-semibold">₦{((item.product_id?.price ?? item.price ?? 0) * item.quantity).toLocaleString()}</p>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2 items-center">
                                     <Badge className={getStatusColor(item.status)} variant="secondary">
                                        {item.status}
                                     </Badge>
                                     {/* QR for Pickup */}
                                     {item.status === "sent_to_post_office" && order.delivery_option === "school_post" && (
                                       <div className="mt-2">
                                         <p className="text-xs font-bold text-green-600 mb-2">Ready for Pickup!</p>
                                         <OrderQR 
                                           orderId={order._id} 
                                           sellerId={item.vendor_id}
                                           deliveryType="school_post"
                                           action="pickup"
                                           size={120}
                                           className="border-green-200 bg-green-50"
                                         />
                                       </div>
                                     )}
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
                        <span>Total</span>
                        <span>₦{totalAmount.toLocaleString()}</span>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-base">
                        <Truck className="w-4 h-4" />
                        Delivery Info
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
                    <div className="border-t pt-2">
                         <p className="mb-1 font-medium">Customer Details</p>
                         <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{order.user_id?.firstname || order.customer_id?.firstname} {order.user_id?.lastname || ""}</span>
                         </div>
                         <p className="mt-1 ml-6 text-muted-foreground text-xs">{order.user_id?.email || order.customer_id?.email}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
