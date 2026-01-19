"use client";

import { useEffect, useState } from "react";
import { productService, type Product } from "@/services/productService";
import { ProductCard } from "@/components/productCard";
import { Loader2, Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFavorites = async () => {
        setIsLoading(true);
        try {
            const res = await productService.getFavorites();
            setFavorites(res.data || []);
        } catch (error) {
            console.error("Failed to fetch favorites", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-[#3bb85e] animate-spin mb-4" />
                <p className="text-gray-500 animate-pulse">Loading your favorites...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>
                    <p className="text-gray-500 text-sm mt-1">Products you've liked and saved for later</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-red-50 text-red-600 border-red-100">
                        {favorites.length} {favorites.length === 1 ? 'Product' : 'Products'}
                    </Badge>
                </div>
            </div>

            {favorites.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-20 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                        <Heart className="w-10 h-10 text-red-200" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Your favorites list is empty</h2>
                    <p className="text-gray-500 max-w-sm mb-8">
                        Like products while browsing to save them here. You can easily buy them again or keep an eye on price drops!
                    </p>
                    <Link href="/marketplace">
                        <Button className="bg-[#3bb85e] hover:bg-[#2d8f4a] text-white px-8 rounded-full h-11">
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Explore Marketplace
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {favorites.map((product) => (
                        <ProductCard key={product._id} item={product} />
                    ))}
                </div>
            )}
        </div>
    );
}

// Simple Badge component if UI kit badge is not available globally or needs import
function Badge({ children, className, variant }: any) {
    const variants: any = {
        secondary: "bg-gray-100 text-gray-800"
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant] || ""} ${className}`}>
            {children}
        </span>
    );
}
