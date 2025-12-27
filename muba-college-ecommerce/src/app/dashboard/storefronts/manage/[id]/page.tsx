"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { productService } from "@/services/productService";
import { useStore } from "@/hooks/useStores";
import Image from "next/image";
import toast from "react-hot-toast";

interface Product {
  _id: string;
  title: string;
  desc: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
  store: any;
  createdAt: string;
}

export default function ManageStorePage() {
  const params = useParams();
  const router = useRouter();
  const storeId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { data: store, isLoading: isLoadingStore } = useStore(storeId || "");
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storeId) {
      fetchProducts();
    }
  }, [storeId]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (!storeId) return;
      const response = await productService.getProductsByStore(storeId);
      setProducts(response.data || response.products || response);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch products");
      console.error("Error fetching products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${productName}"? This action cannot be undone.`
      )
    ) {
      try {
        await productService.deleteProduct(productId);
        setProducts(products.filter((p) => p._id !== productId));
        toast.success("Product deleted successfully");
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || "Failed to delete product";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Error deleting product:", err);
      }
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoadingStore) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3bb85e]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/storefronts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Manage Products
            </h1>
            <p className="text-muted-foreground">
              {store?.name || "Store"}
            </p>
          </div>
        </div>
        <Link href={`/dashboard/storefronts/manage/${storeId}/new`}>
          <Button className="bg-[#3bb85e] hover:bg-[#2d8a47]">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? "No products found" : "No products yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery
                  ? "Try adjusting your search terms."
                  : "Add your first product to start selling."}
              </p>
              {!searchQuery && (
                <Link href={`/dashboard/storefronts/manage/${storeId}/new`}>
                  <Button className="bg-[#3bb85e] hover:bg-[#2d8a47]">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="relative h-12 w-12 rounded overflow-hidden bg-gray-100 shrink-0">
                            {product.images?.[0] && (
                              <Image
                                src={product.images[0]}
                                alt={product.title}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1">{product.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {product.desc}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="whitespace-nowrap">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">₦{product.price.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={product.stock > 0 ? "default" : "destructive"}
                          className="whitespace-nowrap"
                        >
                          {product.stock} in stock
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/dashboard/storefronts/manage/${storeId}/edit/${product._id}`}
                          >
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDelete(product._id, product.title)
                            }
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
