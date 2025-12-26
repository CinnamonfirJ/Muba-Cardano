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
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "ready_for_pickup": return "bg-orange-100 text-orange-800 border-orange-200";
      case "handed_to_post_office": return "bg-purple-100 text-purple-800 border-purple-200";
      case "paid":
      case "order_confirmed": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending_payment": return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending_payment": return "Pending Payment";
      case "paid": return "Paid";
      case "order_confirmed": return "Order Confirmed";
      case "handed_to_post_office": return "Handed to Post Office";
      case "ready_for_pickup": return "Ready for Pickup";
      case "delivered": return "Delivered";
      case "cancelled": return "Cancelled";
      default: return status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Pending";
    }
  };
  
  const totalAmount = order.total_amount || order.total || 0;
  const deliveryFee = order.delivery_fee || 0;
  const serviceFee = order.service_fee || 0;
  const subtotal = order.subtotal || (totalAmount - deliveryFee - serviceFee);

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
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                                                {getStatusLabel(item.status || order.status)}
                                            </Badge>
                                            {(item.refId || order.refId) && (
                                                <p className="text-[10px] items-center font-mono text-blue-600">Ref: {item.refId || order.refId}</p>
                                            )}
                                        </div>
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
                        <span>₦{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery Fee</span>
                        <span>₦{deliveryFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Service Fee</span>
                        <span>₦{serviceFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2 font-bold text-lg">
                        <span>Total</span>
                        <span>₦{totalAmount.toLocaleString()}</span>
                    </div>
                </CardContent>
            </Card>
        </div>


        <div className="space-y-6">
           {/* QR Code Section - Visible ONLY after handoff to PO */}
           {(order.refId || order.client_qr_code) && 
            (order.delivery_option === "school_post" || order.is_pickup_order) && 
            (order.status === "handed_to_post_office" || order.status === "ready_for_pickup") ? (
             <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-2">
                     <CardTitle className="flex items-center gap-2 text-base text-blue-700">
                        <Truck className="w-4 h-4" />
                        {order.status === "ready_for_pickup" ? "Ready for Pickup!" : "Pickup QR Code"}
                     </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center w-full">
                        <OrderQR 
                            refId={order.refId}
                            qrCodeValue={order.client_qr_code || `${order.refId}-C`}
                            sellerId={typeof order.vendor_id === 'string' ? order.vendor_id : order.vendor_id?._id}
                            deliveryType="school_post"
                            action="pickup"
                            size={180}
                            className="bg-white border-blue-100 mx-auto"
                        />
                        <p className="text-xs font-medium text-blue-600 mt-3">
                            {order.status === "ready_for_pickup" 
                                ? "Present this QR code at the Campus Post Office to receive your package."
                                : order.status === "handed_to_post_office"
                                ? "Your package is currently at the Post Office. You will receive a notification when it's ready for pickup."
                                : "Your order is confirmed. You will need this QR code once the package is at the Post Office."}
                        </p>
                    </div>
                </CardContent>
            </Card>
           ) : (
            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-base">
                        <Truck className="w-4 h-4" />
                        Order Status
                     </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                         <Badge className={getStatusColor(order.status)} variant="secondary">
                            {getStatusLabel(order.status)}
                         </Badge>
                    </div>
                </CardContent>
            </Card>
           )}
            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-base">
                        <MapPin className="w-4 h-4" />
                        Delivery & Customer Info
                     </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="gap-4 grid grid-cols-2">
                        <div>
                            <p className="text-muted-foreground">Method</p>
                            <p className="font-medium capitalize">{order.delivery_option?.replace(/_/g, " ") || "Standard"}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Date Placed</p>
                            <p className="font-medium">{format(new Date(order.createdAt), "MMM d, yyyy")}</p>
                        </div>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                         <div>
                            <p className="text-muted-foreground">Recipient</p>
                            <p className="font-medium">
                                {order.user_id?.firstname || order.customer_id?.firstname} {order.user_id?.lastname || ""}
                            </p>
                         </div>
                         {(order.shipping_info?.phone || order.user_id?.phone) && (
                            <div>
                                <p className="text-muted-foreground">Phone</p>
                                <p className="font-medium">{order.shipping_info?.phone || order.user_id?.phone}</p>
                            </div>
                         )}
                         {(order.shipping_info?.address || order.user_id?.delivery_location) && (
                            <div>
                                <p className="text-muted-foreground">Delivery Address</p>
                                <p className="font-medium text-xs leading-relaxed">
                                    {order.shipping_info?.address || order.user_id?.delivery_location}
                                </p>
                            </div>
                         )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
