"use client";

import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProductForm from "@/components/dashboard/ProductForm";

export default function NewProductPage() {
  const params = useParams();
  const storeId = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!storeId) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/storefronts/manage/${storeId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Product</h1>
          <p className="text-muted-foreground text-sm">Create a new product for your store.</p>
        </div>
      </div>

      <ProductForm storeId={storeId} />
    </div>
  );
}
