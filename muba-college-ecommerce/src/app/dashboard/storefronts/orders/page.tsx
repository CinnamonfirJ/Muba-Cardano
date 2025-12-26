"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Package,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getVendorOrders, updateVendorOrder, VendorOrder } from "@/services/vendorOrder.service";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function VendorOrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ["vendorOrders"],
    queryFn: () => getVendorOrders(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      orderId,
      status,
    }: {
      orderId: string;
      status: VendorOrder["status"];
    }) => updateVendorOrder(orderId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendorOrders"] });
      toast.success("Order status updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
    },
  });

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
     // Type assertion since Select value is string but status is specific union
    updateStatusMutation.mutate({ orderId, status: newStatus as VendorOrder["status"] });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; icon: any }> = {
      pending: { bg: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
      processing: { bg: "bg-blue-100 text-blue-800 border-blue-200", icon: Loader2 },
      shipped: { bg: "bg-purple-100 text-purple-800 border-purple-200", icon: Truck },
      delivered: { bg: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
      cancelled: { bg: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
    };
    
    const style = styles[status] || { bg: "bg-gray-100 text-gray-800 border-gray-200", icon: Package };
    const Icon = style.icon;

    return (
      <Badge variant="outline" className={`${style.bg} px-2 py-1 flex items-center gap-1 font-medium capitalize animate-in fade-in zoom-in duration-300`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_id?.firstname
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#3bb85e] animate-spin mx-auto" />
          <p className="text-muted-foreground animate-pulse font-mona">Fetching your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] text-red-500 glass-card mx-4 rounded-2xl">
        <AlertCircle className="mb-4 w-16 h-16 opacity-50" />
        <h3 className="text-xl font-bold mb-2">Failed to load orders</h3>
        <p className="text-muted-foreground mb-6">Check your connection and try again</p>
        <Button
          variant="outline"
          className="border-red-200 hover:bg-red-50 text-red-600 rounded-full px-8"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["vendorOrders"] })}
        >
          <Loader2 className="mr-2 w-4 h-4" />
          Retry Now
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="px-4 pt-4">
          <h1 className="font-bold text-3xl tracking-tight font-mona flex items-center gap-3">
            <Package className="text-[#3bb85e] w-8 h-8" />
            Vendor Orders
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your store orders and fulfillment efficiently
          </p>
      </div>

      <div className="px-4 space-y-4 sticky top-0 z-20 bg-white/50 backdrop-blur-md pt-2 pb-4 border-b">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="top-1/2 -translate-y-1/2 left-3 absolute w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search Orders..."
                className="pl-10 rounded-full border-gray-200 focus-visible:ring-[#3bb85e] bg-white/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 shrink-0">
                <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                >
                    <SelectTrigger className="w-full md:w-[160px] rounded-full border-gray-200 bg-white/50">
                        <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
      </div>

      <div className="px-4">
        {filteredOrders.length === 0 ? (
          <Card className="glass-card py-20 border-dashed">
            <CardContent className="text-center">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No orders found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="font-bold">Order ID</TableHead>
                    <TableHead className="font-bold">Customer</TableHead>
                    <TableHead className="font-bold">Total</TableHead>
                    <TableHead className="font-bold text-center">Date</TableHead>
                    <TableHead className="font-bold text-center">Status</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order._id} className="hover:bg-gray-50/30 transition-colors">
                      <TableCell className="font-bold text-[#3bb85e]">
                        #{order._id.slice(-6).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{order.customer_id?.firstname || "Guest"}</span>
                          <span className="text-muted-foreground text-xs uppercase tracking-wider">
                            {order.customer_id?.email?.split('@')[0]}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">
                         ₦{order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center text-gray-500 text-sm">
                        {format(new Date(order.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                          <div className="flex justify-center">
                            {getStatusBadge(order.status)}
                          </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-10 h-10 p-0 rounded-full hover:bg-gray-100">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-gray-100 p-2">
                            <DropdownMenuLabel className="text-xs text-gray-400 uppercase tracking-widest px-2 py-1">Quick Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer flex items-center gap-2 px-3 py-2"
                              onClick={() => router.push(`/dashboard/storefronts/orders/${order._id}`)}
                            >
                              <div className="bg-green-50 p-1.5 rounded-lg">
                                <Eye className="w-4 h-4 text-[#3bb85e]" />
                              </div>
                              <span className="font-semibold">View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuLabel className="text-xs text-gray-400 uppercase tracking-widest px-2 py-1">Status Update</DropdownMenuLabel>
                             <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => handleStatusUpdate(order._id, "processing")}>
                                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                                Mark as Processing
                             </DropdownMenuItem>
                             <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => handleStatusUpdate(order._id, "shipped")}>
                                <div className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
                                Mark as Shipped
                             </DropdownMenuItem>
                             <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => handleStatusUpdate(order._id, "delivered")}>
                                <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                                Mark as Delivered
                             </DropdownMenuItem>
                             <DropdownMenuSeparator className="my-1" />
                             <DropdownMenuItem 
                                className="text-red-500 focus:text-red-600 rounded-lg cursor-pointer bg-red-50/50 hover:bg-red-50"
                                onClick={() => handleStatusUpdate(order._id, "cancelled")}
                             >
                                <XCircle className="mr-2 w-4 h-4" />
                                <span className="font-semibold">Cancel Order</span>
                             </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {filteredOrders.map((order, idx) => (
                    <div 
                        key={order._id}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500"
                        style={{ animationDelay: `${idx * 50}ms` }}
                        onClick={() => router.push(`/dashboard/storefronts/orders/${order._id}`)}
                    >
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Order ID</span>
                                <h3 className="font-bold text-gray-900 group-hover:text-[#3bb85e] transition-colors">
                                    #{order._id.slice(-6).toUpperCase()}
                                </h3>
                            </div>
                            {getStatusBadge(order.status)}
                        </div>

                        <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-50">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border shadow-sm shrink-0">
                                <span className="font-bold text-[#3bb85e]">{order.customer_id?.firstname?.[0] || 'G'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Customer</p>
                                <p className="font-bold text-gray-900 truncate">{order.customer_id?.firstname || "Guest Customer"}</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-end pt-1">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Amount</p>
                                <p className="text-lg font-bold text-gray-900">
                                    ₦{order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                                <p className="text-sm font-semibold text-gray-500">
                                    {format(new Date(order.createdAt), "MMM d, yyyy")}
                                </p>
                            </div>
                        </div>
                        
                        <div className="pt-3 border-t border-dashed flex items-center justify-between">
                            <span className="text-xs text-gray-500">{order.items.length} Product(s)</span>
                            <Button variant="ghost" size="sm" className="h-8 text-[#3bb85e] font-bold p-0">
                                View Details <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Helper icons missing for mobile
function ChevronRight(props: any) {
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
