"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

import { ProfileCompletionBanner } from "@/components/ProfileCompletionBanner";

import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { Loader2, ShoppingBag, Star, Heart, Shield } from "lucide-react";

const DashboardOverview = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<any>({
    queryKey: ["customerAnalytics"],
    queryFn: async () => {
      const response = await api.get("/api/v1/analytics/customer");
      return response.data.data;
    },
    enabled: !!user?._id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-[#3bb85e]" />
      </div>
    );
  }

  const { orders, reviews, following } = data || {};

  return (
    <div className="space-y-6">
      <ProfileCompletionBanner user={user} />
      
      {/* Stats Cards */}
      <div className="w-full overflow-x-auto">
        <div
          className="
            flex gap-4 p-2
            sm:grid sm:grid-cols-2 sm:gap-4 sm:p-0
            lg:grid-cols-4
          "
        >
          {/* CARD 1 */}
          <Card className="min-w-[180px] sm:min-w-0 shrink-0">
            <CardHeader className="flex flex-row items-center justify-between pb-1">
              <CardTitle className="text-xs font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{orders?.total || 0}</div>
              <p className="text-[10px] text-muted-foreground">{orders?.active || 0} Active Shipments</p>
            </CardContent>
          </Card>

          {/* CARD 2 */}
          <Card className="min-w-[180px] sm:min-w-0 shrink-0">
            <CardHeader className="flex flex-row items-center justify-between pb-1">
              <CardTitle className="text-xs font-medium">Reviews Given</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{reviews?.total || 0}</div>
              <p className="text-[10px] text-muted-foreground">Thank you for sharing!</p>
            </CardContent>
          </Card>

          {/* CARD 3 */}
          <Card className="min-w-[180px] sm:min-w-0 shrink-0">
            <CardHeader className="flex flex-row items-center justify-between pb-1">
              <CardTitle className="text-xs font-medium">Followed Vendors</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{following?.total || 0}</div>
              <p className="text-[10px] text-muted-foreground">Favorite storefronts</p>
            </CardContent>
          </Card>

          {/* CARD 4 */}
          <Card className="min-w-[180px] sm:min-w-0 shrink-0">
            <CardHeader className="flex flex-row items-center justify-between pb-1">
              <CardTitle className="text-xs font-medium">Account Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">Active</div>
              <p className="text-[10px] text-muted-foreground">
                {user?.isVerified ? "Verified" : "Pending verification"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <ShoppingBag className="w-6 h-6 text-[#3bb85e] mb-2" />
              <h3 className="font-medium">Browse Marketplace</h3>
              <p className="text-sm text-gray-500">Discover new products</p>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Star className="w-6 h-6 text-[#3bb85e] mb-2" />
              <h3 className="font-medium">Leave a Review</h3>
              <p className="text-sm text-gray-500">Rate your recent purchases</p>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Heart className="w-6 h-6 text-[#3bb85e] mb-2" />
              <h3 className="font-medium">Follow Vendors</h3>
              <p className="text-sm text-gray-500">Stay updated with favorites</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
