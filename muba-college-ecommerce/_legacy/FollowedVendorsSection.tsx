"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Heart, Search, Store, Star, UserMinus } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

// Mock data - replace with actual API calls
const mockFollowedVendors = [
  {
    id: "vendor-1",
    name: "Tech Hub UNILAG",
    logo: "/placeholder.svg?height=60&width=60&text=TH",
    description: "Premium electronics and gadgets for students",
    campus: "University of Lagos (UNILAG)",
    rating: 4.8,
    totalReviews: 156,
    totalProducts: 45,
    followedDate: "2024-01-10",
    isActive: true,
    specialties: ["Electronics", "Laptops", "Phones"],
  },
  {
    id: "vendor-2",
    name: "BookStore UI",
    logo: "/placeholder.svg?height=60&width=60&text=BS",
    description: "Academic textbooks and course materials",
    campus: "University of Ibadan (UI)",
    rating: 4.9,
    totalReviews: 203,
    totalProducts: 128,
    followedDate: "2024-01-08",
    isActive: true,
    specialties: ["Textbooks", "Course Materials", "Stationery"],
  },
  {
    id: "vendor-3",
    name: "Fashion Forward ABU",
    logo: "/placeholder.svg?height=60&width=60&text=FF",
    description: "Trendy clothing and accessories",
    campus: "Ahmadu Bello University (ABU)",
    rating: 4.6,
    totalReviews: 89,
    totalProducts: 67,
    followedDate: "2024-01-05",
    isActive: false,
    specialties: ["Clothing", "Accessories", "Shoes"],
  },
  {
    id: "vendor-4",
    name: "Campus Eats UNILAG",
    logo: "/placeholder.svg?height=60&width=60&text=CE",
    description: "Delicious meals and snacks delivered to your doorstep",
    campus: "University of Lagos (UNILAG)",
    rating: 4.7,
    totalReviews: 124,
    totalProducts: 23,
    followedDate: "2024-01-12",
    isActive: true,
    specialties: ["Food", "Snacks", "Beverages"],
  },
];

const FollowedVendorsSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [vendors, setVendors] = useState(mockFollowedVendors);

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.campus.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.specialties.some((specialty) =>
        specialty.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const handleUnfollow = (vendorId: string, vendorName: string) => {
    if (window.confirm(`Are you sure you want to unfollow ${vendorName}?`)) {
      setVendors(vendors.filter((vendor) => vendor.id !== vendorId));
      toast.success(`Unfollowed ${vendorName}`);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  return (
    <div className='space-y-6'>
      {/* Stats */}
      <div className='gap-6 grid grid-cols-1 md:grid-cols-3'>
        <Card>
          <CardContent className='p-6 text-center'>
            <div className='font-bold text-gray-900 text-2xl'>
              {vendors.length}
            </div>
            <div className='text-gray-600 text-sm'>Following</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-6 text-center'>
            <div className='font-bold text-gray-900 text-2xl'>
              {vendors.filter((v) => v.isActive).length}
            </div>
            <div className='text-gray-600 text-sm'>Active Vendors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-6 text-center'>
            <div className='font-bold text-gray-900 text-2xl'>
              {vendors.reduce((sum, vendor) => sum + vendor.totalProducts, 0)}
            </div>
            <div className='text-gray-600 text-sm'>Total Products</div>
          </CardContent>
        </Card>
      </div>

      {/* Followed Vendors */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Heart className='w-5 h-5' />
            Followed Vendors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className='relative mb-6'>
            <Search className='top-3 left-3 absolute w-4 h-4 text-gray-400' />
            <Input
              placeholder='Search vendors...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>

          {/* Vendors Grid */}
          {filteredVendors.length === 0 ? (
            <div className='py-12 text-center'>
              <Heart className='mx-auto mb-4 w-12 h-12 text-gray-400' />
              <h3 className='mb-2 font-medium text-gray-900 text-lg'>
                No vendors found
              </h3>
              <p className='text-gray-600'>
                {searchQuery
                  ? "Try adjusting your search terms."
                  : "You're not following any vendors yet. Discover amazing vendors in the marketplace!"}
              </p>
              {!searchQuery && (
                <Link to='/marketplace'>
                  <Button className='bg-[#3bb85e] hover:bg-[#457753] mt-4'>
                    Browse Marketplace
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className='gap-6 grid grid-cols-1 md:grid-cols-2'>
              {filteredVendors.map((vendor) => (
                <Card
                  key={vendor.id}
                  className='hover:shadow-md border border-gray-200 transition-shadow'
                >
                  <CardContent className='p-6'>
                    <div className='flex items-start gap-4'>
                      {/* Vendor Logo */}
                      <Avatar className='shrink-0 w-16 h-16'>
                        <AvatarImage
                          src={vendor.logo || "/placeholder.svg"}
                          alt={vendor.name}
                        />
                        <AvatarFallback className='font-semibold text-lg'>
                          {vendor.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Vendor Info */}
                      <div className='flex-1 min-w-0'>
                        <div className='flex justify-between items-start gap-2 mb-2'>
                          <div>
                            <h3 className='font-semibold text-gray-900 truncate'>
                              {vendor.name}
                            </h3>
                            <p className='text-gray-600 text-sm'>
                              {vendor.campus}
                            </p>
                          </div>
                          <div className='flex items-center gap-1'>
                            {!vendor.isActive && (
                              <Badge variant='secondary' className='text-xs'>
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </div>

                        <p className='mb-3 text-gray-700 text-sm line-clamp-2'>
                          {vendor.description}
                        </p>

                        {/* Rating and Stats */}
                        <div className='flex items-center gap-4 mb-3 text-gray-600 text-sm'>
                          <div className='flex items-center gap-1'>
                            {renderStars(vendor.rating)}
                            <span className='ml-1'>{vendor.rating}</span>
                          </div>
                          <div>{vendor.totalReviews} reviews</div>
                          <div>{vendor.totalProducts} products</div>
                        </div>

                        {/* Specialties */}
                        <div className='flex flex-wrap gap-1 mb-4'>
                          {vendor.specialties.slice(0, 3).map((specialty) => (
                            <Badge
                              key={specialty}
                              variant='outline'
                              className='text-xs'
                            >
                              {specialty}
                            </Badge>
                          ))}
                          {vendor.specialties.length > 3 && (
                            <Badge variant='outline' className='text-xs'>
                              +{vendor.specialties.length - 3} more
                            </Badge>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className='flex gap-2'>
                          <Link
                            to={`/storefronts/${vendor.id}`}
                            className='flex-1'
                          >
                            <Button
                              variant='outline'
                              size='sm'
                              className='bg-transparent w-full'
                            >
                              <Store className='mr-2 w-4 h-4' />
                              Visit Store
                            </Button>
                          </Link>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              handleUnfollow(vendor.id, vendor.name)
                            }
                            className='hover:bg-red-50 text-red-600 hover:text-red-700'
                          >
                            <UserMinus className='w-4 h-4' />
                          </Button>
                        </div>

                        {/* Followed Date */}
                        <p className='mt-2 text-gray-500 text-xs'>
                          Following since {vendor.followedDate}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FollowedVendorsSection;
