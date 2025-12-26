"use client";

import { useVendorOrder, useUpdateVendorOrder } from "../../../../hooks/useVendorOrders";
import { useParams, useRouter } from "next/navigation";
import { Button } from "../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Separator } from "../../../../components/ui/separator";
import { ArrowLeft, Truck, Package, User, Phone, MapPin, Hash } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { getStatusLabel, formatDeliveryFee } from "../../../../utils/orderStatus";
import OrderQR from "../../../../components/OrderQR";

export default function VendorOrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const orderId = (Array.isArray(id) ? id[0] : id) || "";
  const { data: order, isLoading, error } = useVendorOrder(orderId);
  const updateMutation = useUpdateVendorOrder();

  const [status, setStatus] = useState<string>("");
  const [deliveryOption, setDeliveryOption] = useState<string>("");
  const [deliveryFee, setDeliveryFee] = useState<string>("");
  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setDeliveryOption(order.delivery_option || "school_post");
      setDeliveryFee(order.delivery_fee?.toString() || "0");
      if (order.rider_info) {
        setRiderName(order.rider_info.name || "");
        setRiderPhone(order.rider_info.phone || "");
      }
    }
  }, [order]);

  const handleUpdate = () => {
    if (!order) return;
    
    const updateData: any = {
      status,
      delivery_option: deliveryOption as any,
      delivery_fee: Number(deliveryFee),
    };

    if (deliveryOption === "rider" || order.rider_info) {
      updateData.rider_info = {
        name: riderName,
        phone: riderPhone,
      };
    }

    updateMutation.mutate({
      orderId: order._id,
      data: updateData,
      vendorId: order.vendor_id,
    });
  };

  if (isLoading) return <div>Loading order details...</div>;
  if (error || !order) return <div>Error loading order</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/vendor/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Order <span className="font-mono bg-slate-100 px-2 py-1 rounded">{order.refId || order._id.substring(0, 8).toUpperCase()}</span>
        </h1>
        <div className="ml-auto">
          <Button
            onClick={handleUpdate}
            disabled={updateMutation.isPending}
            className="bg-[#3bb85e] hover:bg-[#2d8a47]"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="relative h-16 w-16 rounded overflow-hidden bg-gray-100">
                    <Image
                      src={
                        item.img?.[0] ||
                        item.product_id?.img?.[0] ||
                        "/placeholder.svg"
                      }
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × ₦{item.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="font-medium">
                    ₦{(item.quantity * item.price).toLocaleString()}
                  </div>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Subtotal</span>
                <span>
                  ₦
                  {order.items
                    .reduce((acc, item) => acc + item.price * item.quantity, 0)
                    .toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {order.customer_id?.firstname} {order.customer_id?.lastname || ''}
                    </p>
                    <p className="text-xs text-muted-foreground">{order.customer_id?.email}</p>
                  </div>
                </div>
                
                {order.customer_id?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{order.customer_id.phone}</span>
                  </div>
                )}
                
                {order.customer_id?.delivery_location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span className="text-sm">{order.customer_id.delivery_location}</span>
                  </div>
                )}
                
                {order.customer_id?.matric_number && (
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-mono text-blue-600">{order.customer_id.matric_number}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management */}
        <div className="space-y-6">
           {/* QR Code for Handoff */}
           {status === "order_confirmed" && (order.delivery_option === "school_post" || order.is_pickup_order) && (
             <OrderQR 
               refId={order.refId}
               qrCodeValue={order.vendor_qr_code || `${order.refId}-V`}
               sellerId={order.vendor_id}
               action="handoff"
               className="mb-4 border-blue-200 bg-blue-50 w-full"
             />
           )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery & Status
              </CardTitle>
              <CardDescription>
                Update the status and delivery details for this order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Order Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order_confirmed">Order Confirmed</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  👆 "Handed to Post Office", "Ready for Pickup", and "Delivered" statuses are set automatically when the Post Office scans the package.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Delivery Option</Label>
                <Select
                  value={deliveryOption}
                  onValueChange={setDeliveryOption}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school_post">
                      School Post Office
                    </SelectItem>
                    <SelectItem value="self">Self Delivery</SelectItem>
                    <SelectItem value="rider">3rd Party Rider</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Delivery Fee (₦)</Label>
                <Input
                  type="number"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  placeholder="0"
                />
              </div>

              {(deliveryOption === "rider" || status === "assigned_to_rider") && (
                <div className="space-y-4 border-l-2 border-[#3bb85e] pl-4 mt-4">
                  <h4 className="font-medium text-sm">Rider Details</h4>
                  <div className="space-y-2">
                    <Label>Rider Name</Label>
                    <Input
                      value={riderName}
                      onChange={(e) => setRiderName(e.target.value)}
                      placeholder="Enter rider name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rider Phone</Label>
                    <Input
                      value={riderPhone}
                      onChange={(e) => setRiderPhone(e.target.value)}
                      placeholder="Enter rider phone"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
