"use client";

import { useVendorOrders } from "../../../hooks/useVendorOrders";
import { useMyStores } from "../../../hooks/useStores";
import { useAuth } from "../../../context/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { ArrowLeft, Store } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

export default function VendorOrdersPage() {
  const { user } = useAuth();
  
  // Fetch vendor's stores to get vendorId (Store ID)
  const { data: stores, isLoading: isLoadingStores } = useMyStores();
  
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");

  // Set default store when loaded
  useEffect(() => {
    if (stores && stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0]._id);
    }
  }, [stores, selectedStoreId]);

  // Fetch orders for the selected store
  const { 
    data: orders, 
    isLoading: isLoadingOrders, 
    error 
  } = useVendorOrders(selectedStoreId);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  if (isLoadingStores) return <div className="p-8 text-center">Loading your stores...</div>;
  if (!stores || stores.length === 0) return (
    <div className="p-8 text-center text-gray-500">
      <h3 className="text-lg font-medium">No Stores Found</h3>
      <p>You need to create a store to manage orders.</p>
      <Link href="/dashboard/storefronts/new">
        <Button className="mt-4">Create Store</Button>
      </Link>
    </div>
  );

  if (isLoadingOrders && selectedStoreId) return <div className="p-8 text-center">Loading orders...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading orders: {(error as any).message || "Unknown error"}</div>;

  const filteredOrders = orders?.filter((order) => {
    const matchesStatus =
      filterStatus === "all" || order.status === filterStatus;
    const matchesSearch =
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_id.firstname.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <Link href="/vendor/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by Order ID or Customer Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="sm:w-[300px]"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="sent_to_post_office">Sent to Post Office</SelectItem>
            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
            <SelectItem value="assigned_to_rider">Assigned to Rider</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {stores.length > 1 && (
          <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
            <SelectTrigger className="w-[200px]">
              <Store className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select Store" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store: any) => (
                <SelectItem key={store._id} value={store._id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Items</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders && filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell className="font-medium">
                    {order._id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {order.customer_id?.firstname || "Unknown"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="capitalize">
                    {order.delivery_option?.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getOrderStatusVariant(order.status)}>
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {order.items.length}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/vendor/orders/${order._id}`}>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function getOrderStatusVariant(status: string) {
  switch (status) {
    case "confirmed":
    case "processing":
      return "default"; // blue-ish typically
    case "sent_to_post_office":
    case "out_for_delivery":
    case "assigned_to_rider":
      return "secondary"; // yellow/orange-ish
    case "delivered":
      return "outline"; // green-ish usually but outline is neutral. Shadcn badge variants are limited by default
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}
