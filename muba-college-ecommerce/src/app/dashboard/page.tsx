"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Star, Heart, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

import { ProfileCompletionBanner } from "@/components/ProfileCompletionBanner";

const DashboardOverview = () => {
  const { user } = useAuth();

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
              <div className="text-xl font-bold">12</div>
              <p className="text-[10px] text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>

          {/* CARD 2 */}
          <Card className="min-w-[180px] sm:min-w-0 shrink-0">
            <CardHeader className="flex flex-row items-center justify-between pb-1">
              <CardTitle className="text-xs font-medium">Reviews Given</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">8</div>
              <p className="text-[10px] text-muted-foreground">+1 from last month</p>
            </CardContent>
          </Card>

          {/* CARD 3 */}
          <Card className="min-w-[180px] sm:min-w-0 shrink-0">
            <CardHeader className="flex flex-row items-center justify-between pb-1">
              <CardTitle className="text-xs font-medium">Followed Vendors</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">5</div>
              <p className="text-[10px] text-muted-foreground">+1 from last month</p>
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
