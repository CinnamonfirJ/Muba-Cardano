"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Store, Search, Heart, Star, Package, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

interface Vendor {
  _id: string;
  name: string;
  img?: string;
  rating: number;
  followers: number;
  products: number;
  verified: boolean;
}

export default function VendorsPage() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Using localStorage as temporary storage until backend is ready
  useEffect(() => {
    loadVendors();
  }, [user]);

  const loadVendors = () => {
    try {
      const saved = localStorage.getItem(`followed_vendors_${user?._id}`);
      if (saved) {
        setVendors(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading vendors:", error);
    }
  };

  const saveVendors = (newVendors: Vendor[]) => {
    try {
      localStorage.setItem(
        `followed_vendors_${user?._id}`,
        JSON.stringify(newVendors)
      );
      setVendors(newVendors);
    } catch (error) {
      console.error("Error saving vendors:", error);
    }
  };

  const handleUnfollow = (vendorId: string) => {
    if (window.confirm("Are you sure you want to unfollow this vendor?")) {
      const filtered = vendors.filter((v) => v._id !== vendorId);
      saveVendors(filtered);
    }
  };

  const filteredVendors = vendors.filter((vendor) =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Followed Vendors</h1>
        <p className="text-muted-foreground">
          Vendors you're currently following
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Followed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Verified Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendors.filter((v) => v.verified).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendors.reduce((sum, v) => sum + v.products, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vendors List */}
      {filteredVendors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? "No vendors found" : "No followed vendors yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? "Try adjusting your search terms."
                : "Discover vendors in the marketplace and follow your favorites."}
            </p>
            {!searchQuery && (
              <Link href="/marketplace">
                <Button className="bg-[#3bb85e] hover:bg-[#2d8a47]">
                  Browse Marketplace
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => (
            <Card key={vendor._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Vendor Header */}
                  <div className="flex items-start gap-3">
                    <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-100 shrink-0">
                      {vendor.img ? (
                        <Image
                          src={vendor.img}
                          alt={vendor.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#3bb85e]">
                          <Store className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{vendor.name}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{vendor.rating.toFixed(1)}</span>
                        </div>
                        {vendor.verified && (
                          <Badge variant="secondary" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Heart className="h-4 w-4" />
                      <span>{vendor.followers} followers</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{vendor.products} products</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/store/${vendor._id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Store
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => handleUnfollow(vendor._id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
