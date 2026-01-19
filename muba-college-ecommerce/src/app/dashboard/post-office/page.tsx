"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package, Truck, CheckCircle, BarChart3 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function PostOfficeDashboardPage() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["postOfficeAnalytics"],
    queryFn: async () => {
      const response = await api.get("/api/v1/analytics/post-office");
      return response.data.data;
    },
    enabled: !!user?._id,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading post office analytics. Please check permissions.
      </div>
    );
  }

  const { deliveries, efficiency } = data || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Post Office Operations</h1>
        <p className="text-slate-500">Overview of delivery performance and terminal status.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveries?.total || 0}</div>
            <p className="text-xs text-muted-foreground">All time handled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Terminal</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveries?.atPostOffice || 0}</div>
            <p className="text-xs text-muted-foreground">Ready for pickup / In-sort</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveries?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">Pickups confirmed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(efficiency?.successRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Delivery efficiency</p>
          </CardContent>
        </Card>
      </div>

      {/* Operational Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Terminal Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Pending Handoff</span>
              <span className="font-semibold">{deliveries?.pendingHandoff || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Active Storage</span>
              <span className="font-semibold text-blue-600">{deliveries?.atPostOffice || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Post Office Name</span>
                <span className="font-semibold text-slate-800">{user?.postOfficeName || "Platform Global"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
