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
import { ArrowLeft, Truck, Package, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";

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
          Order #{order._id.substring(0, 8)}
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
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">
                  {order.customer_id?.firstname} {order.customer_id?._id}
                </span>
                <span className="text-muted-foreground">Email:</span>
                <span>{order.customer_id?.email}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management */}
        <div className="space-y-6">
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="sent_to_post_office">
                      Sent to Post Office
                    </SelectItem>
                    <SelectItem value="out_for_delivery">
                      Out for Delivery
                    </SelectItem>
                    <SelectItem value="assigned_to_rider">
                      Assigned to Rider
                    </SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
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
