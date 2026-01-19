"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Truck, CreditCard, Calendar, ShoppingBag, MapPin, Clock, CheckCircle, ShieldAlert, PackageIcon, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import OrderQR from "@/components/OrderQR";
import { useState } from "react";
import DisputeModal from "@/components/DisputeModal";

export default function OrderDetailsPage() {
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: orderResponse, isLoading, error, refetch } = useQuery({
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
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
       <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between bg-white/40 backdrop-blur-sm p-4 rounded-3xl border border-white/60 shadow-sm">
        <div className="flex items-center gap-4">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.back()}
                className="rounded-full bg-white shadow-sm hover:bg-gray-50 border border-gray-100"
            >
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="font-bold text-2xl sm:text-3xl font-mona">Order Info</h1>
                    <Badge variant="outline" className={`${getStatusColor(order.status)} border-none px-3 rounded-full font-bold uppercase text-[10px] tracking-widest`}>
                        {getStatusLabel(order.status)}
                    </Badge>
                </div>
                <p className="text-muted-foreground text-sm font-medium">Tracking ID: <span className="text-[#3bb85e] font-bold">#{order.refId || order._id.slice(-8).toUpperCase()}</span></p>
            </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white/80 shadow-inner">
             <div className="flex flex-col">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Created</p>
                <p className="text-sm font-bold text-gray-700">{format(new Date(order.createdAt), "MMM d, h:mm a")}</p>
             </div>
             <div className="w-px h-8 bg-gray-200 mx-2" />
             <div className="bg-[#3bb85e]/10 p-2 rounded-xl">
                <ShoppingBag className="w-5 h-5 text-[#3bb85e]" />
             </div>
        </div>
      </div>

      <div className="gap-6 grid grid-cols-1 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
            {/* Order Progress Visualization */}
            <Card className="rounded-3xl border-none bg-white/60 backdrop-blur-md shadow-sm overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold font-mona text-gray-800">Order Progress</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                    <div className="relative flex justify-between items-center w-full px-2">
                        {/* Progress Line */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0 rounded-full" />
                        <div 
                            className="absolute top-1/2 left-0 h-1 bg-[#3bb85e] -translate-y-1/2 z-0 rounded-full transition-all duration-1000" 
                            style={{ 
                                width: order.status === 'delivered' ? '100%' : 
                                       order.status === 'ready_for_pickup' ? '75%' : 
                                       order.status === 'handed_to_post_office' ? '50%' : 
                                       ['order_confirmed', 'paid'].includes(order.status) ? '25%' : '5%' 
                            }}
                        />

                        {[
                            { id: 'placed', label: 'Placed', icon: Clock, active: true },
                            { id: 'confirmed', label: 'Confirmed', icon: CheckCircle, active: ['order_confirmed', 'paid', 'handed_to_post_office', 'ready_for_pickup', 'delivered'].includes(order.status) },
                            { id: 'shipping', label: 'Shipping', icon: Truck, active: ['handed_to_post_office', 'ready_for_pickup', 'delivered'].includes(order.status) },
                            { id: 'pickup', label: 'Arrival', icon: MapPin, active: ['ready_for_pickup', 'delivered'].includes(order.status) },
                            { id: 'delivered', label: 'Received', icon: PackageIcon, active: order.status === 'delivered' }
                        ].map((step, idx) => (
                            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${step.active ? 'bg-white border-[#3bb85e] text-[#3bb85e]' : 'bg-gray-50 border-gray-100 text-gray-300'} shadow-sm transition-all duration-500`}>
                                    <step.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-tighter ${step.active ? 'text-[#3bb85e]' : 'text-gray-300'}`}>{step.label}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Items Card */}
            <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden border-none bg-white/60 backdrop-blur-md">
                <CardHeader className="border-b border-gray-50 bg-gray-50/30">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold font-mona">
                        <ShoppingBag className="w-5 h-5 text-[#3bb85e]" />
                        Ordered Items
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-gray-50">
                        {order.items.map((item: any, idx: number) => (
                            <div 
                                key={item._id || idx} 
                                className="flex gap-4 p-5 hover:bg-gray-50/50 transition-colors group"
                            >
                                <div className="bg-white rounded-2xl w-24 h-24 overflow-hidden shrink-0 border border-gray-100 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                    <img 
                                        src={item.product_id?.images?.[0] || item.product_id?.img?.[0] || item.img?.[0] || "/placeholder.svg"} 
                                        alt={item.name} 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-900 group-hover:text-[#3bb85e] transition-colors line-clamp-2">
                                                {item.product_id?.title || item.name || "Campus Product"}
                                            </h4>
                                            <p className="font-black text-lg">₦{((item.product_id?.price ?? item.price ?? 0) * item.quantity).toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 font-bold border-none">
                                               Qty: {item.quantity}
                                            </Badge>
                                            <Badge variant="outline" className={`${getStatusColor(item.status || order.status)} border-none text-[10px] uppercase font-bold`}>
                                                {getStatusLabel(item.status || order.status)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest gap-2">
                                        <div className="bg-gray-100 p-1 rounded-md">
                                            <PackageIcon className="w-3 h-3" />
                                        </div>
                                        Seller ID: {(order.vendor_id?._id || order.vendor_id || 'Standard Vendor').toString().slice(-6)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card className="rounded-3xl border-none bg-white shadow-sm overflow-hidden">
                <CardHeader className="pb-2 border-b border-gray-50">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold font-mona">
                        <CreditCard className="w-5 h-5 text-[#3bb85e]" />
                        Billing Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                    <div className="space-y-3">
                        <div className="flex justify-between text-gray-500 text-sm font-medium">
                            <span>Order Subtotal</span>
                            <span className="text-gray-900 font-bold">₦{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 text-sm font-medium">
                            <span>Delivery Logistics</span>
                            <span className="text-gray-900 font-bold">₦{deliveryFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 text-sm font-medium">
                            <span>Safe-Trade Fee</span>
                            <span className="text-gray-900 font-bold">₦{serviceFee.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between items-center">
                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Total Paid</p>
                        <span className="font-black text-3xl tracking-tighter text-[#3bb85e]">₦{totalAmount.toLocaleString()}</span>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6 lg:col-span-4">
            {/* QR Code Section */}
            {(order.refId || order.client_qr_code) && 
             (order.delivery_option === "school_post" || order.is_pickup_order) && 
             ["handed_to_post_office", "ready_for_pickup", "order_confirmed"].includes(order.status) && (
              <Card className={`rounded-3xl border-2 ${order.status === 'ready_for_pickup' ? 'border-[#3bb85e] bg-[#3bb85e]/5' : 'border-blue-200 bg-blue-50/50'} shadow-lg overflow-hidden relative`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`${order.status === 'ready_for_pickup' ? 'text-[#3bb85e]' : 'text-blue-800'} flex items-center gap-2 text-base font-bold uppercase tracking-widest`}>
                    <Truck className="w-5 h-5" />
                    Pickup Ticket
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center pb-8 pt-4 bg-white m-4 rounded-2xl shadow-inner border border-gray-50">
                    <OrderQR 
                        refId={order.refId}
                        qrCodeValue={order.client_qr_code || `${order.refId}-C`}
                        sellerId={typeof order.vendor_id === 'string' ? order.vendor_id : order.vendor_id?._id}
                        deliveryType="school_post"
                        action="pickup"
                        size={180}
                    />
                </CardContent>
              </Card>
            )}

            {/* Shipping Info */}
            <Card className="rounded-3xl border-none bg-white/60 backdrop-blur-md shadow-sm">
                <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-base font-bold font-mona text-gray-800">
                        <MapPin className="w-4 h-4 text-[#3bb85e]" />
                        Shipping To
                     </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="flex items-center gap-4 bg-gray-50/20 p-4 rounded-2xl border border-white/60 shadow-inner">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-xl font-black text-[#3bb85e] shadow-sm">
                            {(order.user_id?.firstname || order.customer_id?.firstname)?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-black text-gray-900 truncate">
                                {order.user_id?.firstname || order.customer_id?.firstname} {order.user_id?.lastname || ""}
                            </h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.delivery_option?.replace(/_/g, " ") || "Standard"}</p>
                        </div>
                    </div>
                    <div className="space-y-4 px-2">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Primary Contact</p>
                            <p className="text-sm font-bold text-gray-700">{order.shipping_info?.phone || order.user_id?.phone || 'Not provided'}</p>
                        </div>
                        <div className="space-y-1 border-t pt-3 border-gray-100/50">
                            <p className="text-[10px] font-black text-[#3bb85e] uppercase tracking-[0.2em]">Drop-off Location</p>
                            <p className="text-sm font-bold text-gray-700 leading-relaxed italic">
                                "{order.shipping_info?.address || order.user_id?.delivery_location || 'Campus Hub'}"
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Actions for Unpaid Orders */}
            {order.status === "pending_payment" && (
                <Card className="rounded-3xl border-2 border-red-100 bg-red-50/50 shadow-sm overflow-hidden p-6 text-center">
                    <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-2" />
                    <h3 className="font-bold text-red-800 uppercase text-xs tracking-widest mb-1">Payment Required</h3>
                    <p className="text-[10px] text-red-600 mb-4 font-medium italic">
                        This order is currently a pending commitment. Pay now to secure your items or delete them to unlock your cart.
                    </p>
                    <div className="flex flex-col gap-2">
                        <Button 
                            className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                            onClick={() => router.push(`/payment/verify/${order.payment_reference}`)}
                        >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Retry Payment
                        </Button>
                        <Button 
                            variant="ghost"
                            className="w-full rounded-xl text-red-600 hover:bg-red-50 font-bold"
                            onClick={async () => {
                                if (!confirm("Are you sure you want to cancel this pending commitment?")) return;
                                try {
                                    await orderService.deleteOrder(order._id);
                                    toast.success("Order deleted");
                                    router.push("/dashboard/orders");
                                } catch (err: any) {
                                    toast.error(err.message || "Failed to delete order");
                                }
                            }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Order
                        </Button>
                    </div>
                </Card>
            )}

            {/* Dispute Section */}
            <div className="space-y-4">
                {order.dispute_status && order.dispute_status !== 'none' ? (
                    <Card className="rounded-3xl border-2 border-red-100 bg-red-50/50 shadow-sm overflow-hidden text-center p-6">
                        <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-2" />
                        <h3 className="font-bold text-red-800 uppercase text-xs tracking-widest mb-1">Dispute Active</h3>
                        <p className="text-[10px] text-red-600 mb-4">Under Review by Admin</p>
                        <Button className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold" onClick={() => router.push(`/dashboard/disputes/${order.active_dispute_id?._id || order.active_dispute_id}`)}>
                            Track Dispute
                        </Button>
                    </Card>
                ) : order.status === 'delivered' && (
                    <Button 
                        variant="ghost" 
                        className="w-full rounded-2xl text-red-500 hover:text-red-600 hover:bg-red-50 font-bold py-6 border border-dashed border-red-200"
                        onClick={() => setShowDisputeModal(true)}
                    >
                        <ShieldAlert className="w-5 h-5 mr-2" />
                        Report an Issue
                    </Button>
                )}
            </div>
        </div>
      </div>

      <DisputeModal 
        isOpen={showDisputeModal} 
        onClose={() => setShowDisputeModal(false)}
        vendorOrderId={order._id}
        onSuccess={() => {
            setShowDisputeModal(false);
            refetch();
        }}
      />
    </div>
  );
}

function Info(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
  );
}
