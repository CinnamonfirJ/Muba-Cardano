"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVendorOrder, updateVendorOrder, VendorOrder } from "@/services/vendorOrder.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Truck, CreditCard, Calendar, ShoppingBag, MapPin, User, CheckCircle, XCircle, Package } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
      case "ready_for_pickup": return "bg-orange-100 text-orange-800";
      case "handed_to_post_office": return "bg-purple-100 text-purple-800";
      case "order_confirmed": return "bg-blue-100 text-blue-800";
      case "pending_payment": return "bg-gray-100 text-gray-800";
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
                    <h1 className="font-bold text-2xl sm:text-3xl font-mona">Order Details</h1>
                    <Badge variant="outline" className={`${getStatusColor(order.status)} border-none px-3 rounded-full font-bold uppercase text-[10px] tracking-widest`}>
                        {order.status.replace("_", " ")}
                    </Badge>
                </div>
                <p className="text-muted-foreground text-sm font-medium">Order Reference: <span className="text-[#3bb85e] font-bold">#{order.refId || order._id.slice(-8).toUpperCase()}</span></p>
            </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white/60 p-2 rounded-2xl border border-white/80 shadow-inner">
            <div className="flex flex-col gap-1 w-full sm:w-auto">
                <Select 
                    value={order.status} 
                    onValueChange={handleStatusUpdate}
                    disabled={updateStatusMutation.isPending || 
                              (order.delivery_option === "school_post" && 
                               ["sent_to_post_office", "shipped", "delivered"].includes(order.status))}
                >
                    <SelectTrigger className="w-full sm:w-[220px] rounded-xl border-none bg-white shadow-sm font-bold text-[#3bb85e] h-11">
                        <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl shadow-2xl border-gray-100 p-2">
                        <DropdownMenuLabel className="text-[10px] text-gray-400 uppercase tracking-[0.2em] px-2 py-2">Change Status</DropdownMenuLabel>
                        <SelectItem value="order_confirmed" className="rounded-lg mb-1">✅ Order Confirmed</SelectItem>
                        {order.delivery_option !== "school_post" && (
                          <>
                            <SelectItem value="shipped" className="rounded-lg mb-1">🚚 Shipped</SelectItem>
                            <SelectItem value="delivered" className="rounded-lg">🏁 Delivered</SelectItem>
                          </>
                        )}
                        <DropdownMenuSeparator className="my-2" />
                        <SelectItem value="cancelled" className="text-red-500 rounded-lg">❌ Cancel Order</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {updateStatusMutation.isPending && <Loader2 className="w-5 h-5 animate-spin text-[#3bb85e]" />}
        </div>
      </div>

      <div className="gap-6 grid grid-cols-1 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
            {/* Items Card */}
            <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden border-none bg-white/60 backdrop-blur-md">
                <CardHeader className="border-b border-gray-50 bg-gray-50/30">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold font-mona">
                        <ShoppingBag className="w-5 h-5 text-[#3bb85e]" />
                        Ordered Products
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-gray-50">
                        {order.items.map((item: any, idx) => (
                            <div 
                                key={item.product_id?._id || idx} 
                                className="flex gap-4 p-5 hover:bg-gray-50/50 transition-colors group"
                            >
                                <div className="bg-white rounded-2xl w-24 h-24 overflow-hidden shrink-0 border border-gray-100 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                    <img 
                                        src={item.product_id?.img?.[0] || "/placeholder.svg"} 
                                        alt={item.name} 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-900 group-hover:text-[#3bb85e] transition-colors line-clamp-2">
                                                {item.product_id?.title || item.name}
                                            </h4>
                                            <p className="font-black text-lg">₦{((item.product_id?.price ?? item.price ?? 0) * item.quantity).toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 font-bold border-none">
                                               Qty: {item.quantity}
                                            </Badge>
                                            {item.options && Object.entries(item.options).map(([key, value]) => (
                                                <Badge key={key} variant="outline" className="text-[10px] uppercase font-bold border-gray-200">
                                                    {key}: {value as string}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest gap-2">
                                        <Package className="w-3 h-3" />
                                        Unit Price: ₦{(item.product_id?.price ?? item.price ?? 0).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card className="rounded-3xl border-none bg-gradient-to-br from-[#3bb85e] to-[#2da653] text-white shadow-lg overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        <CreditCard className="w-5 h-5" />
                        Revenue Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-white/80 text-sm font-medium">
                            <span>Order Subtotal</span>
                            <span>₦{((totalAmount - (order.delivery_fee || 0))).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-white/80 text-sm font-medium">
                            <span>Delivery Logistics</span>
                            <span>₦{(order.delivery_fee || 0).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="border-t border-white/20 pt-4 flex justify-between items-center group">
                        <div>
                            <p className="text-white/70 text-xs font-black uppercase tracking-widest">Total Earned</p>
                            <span className="font-black text-4xl tracking-tighter tabular-nums drop-shadow-sm">₦{totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform">
                            <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6 lg:col-span-4">
            {/* QR Code Section */}
            {order.delivery_option === "school_post" && 
             order.status === "order_confirmed" && (
              <Card className="rounded-3xl border-2 border-blue-200 bg-blue-50/50 shadow-sm overflow-hidden animate-pulse">
                <CardHeader className="pb-2">
                  <CardTitle className="text-blue-800 flex items-center gap-2 text-base font-bold uppercase tracking-widest">
                    <Truck className="w-5 h-5 animate-bounce" />
                    Handoff QR
                  </CardTitle>
                  <p className="text-blue-600 text-xs font-medium">Post Office scanner needs this code</p>
                </CardHeader>
                <CardContent className="flex justify-center pb-8 pt-4 bg-white/50 backdrop-blur-md m-4 rounded-2xl border border-white">
                  <div className="relative group">
                    <OrderQR 
                        refId={order.refId} 
                        qrCodeValue={order.vendor_qr_code || `${order.refId}-V`}
                        sellerId={order.vendor_id}
                        deliveryType="school_post"
                        action="handoff"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Information */}
            <Card className="rounded-3xl border-none bg-white/60 backdrop-blur-md shadow-sm">
                <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-base font-bold font-mona">
                        <User className="w-4 h-4 text-[#3bb85e]" />
                        Client Profile
                     </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 shadow-inner">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-2xl font-black text-[#3bb85e] shadow-sm">
                            {order.customer_id?.firstname?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-black text-gray-900 truncate">
                                {order.customer_id?.firstname} {order.customer_id?.lastname}
                            </h4>
                            <p className="text-xs font-bold text-gray-400 capitalize tracking-widest truncate">{order.customer_id?.email?.split('@')[0]}</p>
                        </div>
                    </div>

                    <div className="space-y-3 px-2">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact Email</p>
                            <p className="text-sm font-bold text-gray-700 break-all">{order.customer_id?.email}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Phone Number</p>
                            <p className="text-sm font-bold text-gray-700">{order.customer_id?.phone || 'Not provided'}</p>
                        </div>
                        <div className="space-y-1 border-t pt-2 border-dashed">
                            <p className="text-[10px] font-black text-[#3bb85e] uppercase tracking-[0.2em]">Client Location</p>
                            <p className="text-sm font-bold text-gray-700 leading-relaxed italic">
                                "{order.customer_id?.delivery_location || 'Campus Address Only'}"
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Shipping Info */}
            <Card className="rounded-3xl border-none bg-white/60 backdrop-blur-md shadow-sm">
                <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-base font-bold font-mona">
                        <Truck className="w-4 h-4 text-[#3bb85e]" />
                        Logistics Detail
                     </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Method</p>
                             <div className="flex items-center gap-2">
                                <span className="font-bold text-xs capitalize">{order.delivery_option?.replace("_", " ") || "Standard"}</span>
                             </div>
                        </div>
                        <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Timeline</p>
                             <div className="flex items-center gap-2">
                                <span className="font-bold text-xs">Standard Delivery</span>
                             </div>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 border-dashed">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Order Date</p>
                         <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-[#3bb85e] opacity-50" />
                            <span className="text-sm font-bold text-gray-600">{format(new Date(order.createdAt), "PPP p")}</span>
                         </div>
                    </div>

                    {order.rider_info && (
                        <div className="bg-[#3bb85e]/5 p-4 rounded-2xl border border-[#3bb85e]/10 space-y-2">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="bg-[#3bb85e] w-2 h-2 rounded-full" />
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Rider Assigned</p>
                            </div>
                            <p className="font-black text-gray-800 text-base">{order.rider_info.name}</p>
                            <p className="text-sm font-bold text-[#3bb85e]">{order.rider_info.phone}</p>
                        </div>
                    )}

                    {order.delivery_option === "school_post" && (
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-bold text-blue-700 leading-snug">
                                This order uses <span className="font-black">School Post</span>. Please deliver to the nearest campus post hub and ensure they scan your handoff code.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

// Missing icons
function Info(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function Zap(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 14.75 15.3 3 13 10.25h7L8.7 22l2.3-7.25H4Z" />
      </svg>
    )
}
