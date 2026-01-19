"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, DollarSign, Users, ShoppingBag, Store } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const formatNaira = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["adminAnalytics"],
    queryFn: async () => {
      const response = await api.get("/api/v1/analytics/admin");
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading analytics. Please check permissions.
      </div>
    );
  }

  const { products, orders, revenue, growth, delivery } = data || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Analytics</h1>
        <p className="text-slate-500">Comprehensive overview of platform performance and operations.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNaira(revenue?.gross || 0)}</div>
            <p className="text-xs text-muted-foreground">Successful deliveries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Earnings</CardTitle>
            <div className="text-xs text-green-600 font-bold px-2 py-1 bg-green-100 rounded">
                Profit
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNaira(revenue?.platform || 0)}</div>
            <p className="text-xs text-muted-foreground">Fees collected</p>
          </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Growth</CardTitle>
                <Users className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{growth?.users || 0} Users</div>
                <p className="text-xs text-muted-foreground">
                    {growth?.vendors || 0} Registered Vendors
                </p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivery Stats</CardTitle>
                <ShoppingBag className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{delivery?.successful || 0}</div>
                <p className="text-xs text-muted-foreground">
                    {delivery?.pending || 0} Pending Shipments
                </p>
            </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Order Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Total Orders</span>
              <span className="font-semibold">{orders?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Successful</span>
              <span className="font-semibold text-green-600">{orders?.successful || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Cancelled</span>
              <span className="font-semibold text-red-600">{orders?.cancelled || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Inventory Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Total Products</span>
              <span className="font-semibold">{products?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Active Listing</span>
              <span className="font-semibold text-green-600">{products?.active || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Finance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Vendor Payouts</span>
              <span className="font-semibold">{formatNaira(revenue?.payouts || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Delivery Revenue</span>
              <span className="font-semibold">{formatNaira(revenue?.delivery || 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
