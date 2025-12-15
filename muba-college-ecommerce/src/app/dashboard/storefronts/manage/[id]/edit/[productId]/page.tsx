"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProductForm from "@/components/dashboard/ProductForm";
import { useProduct } from "@/hooks/useProducts";

export default function EditProductPage() {
  const params = useParams();
  const storeId = Array.isArray(params.id) ? params.id[0] : params.id;
   // Route is /dashboard/storefronts/manage/[id]/edit/[productId]
   // Next.js params usually flattens specific segments if defined, check usage.
   // Assuming [productId] folder name means params.productId
  const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;

  const { data: product, isLoading, error } = useProduct(productId || "");

  if (!storeId || !productId) return null;

  if (isLoading) {
      return (
          <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
      )
  }

  if (error || !product) {
      return (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
              <p className="text-red-500">Failed to load product</p>
               <Link href={`/dashboard/storefronts/manage/${storeId}`}>
                  <Button variant="outline">Go Back</Button>
               </Link>
          </div>
      )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/storefronts/manage/${storeId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground text-sm">Update product details and variations.</p>
        </div>
      </div>

      <ProductForm storeId={storeId} initialData={product} isEditing={true} />
    </div>
  );
}
