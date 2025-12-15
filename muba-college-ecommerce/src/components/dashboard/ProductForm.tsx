"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, Upload, Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useStore } from "@/hooks/useStores";
import toast from "react-hot-toast";

interface ProductFormProps {
  storeId: string;
  initialData?: any;
  isEditing?: boolean;
}

export default function ProductForm({ storeId, initialData, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();
  const { data: storeData } = useStore(storeId);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    initialData?.images || []
  );

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      price: initialData?.price || "",
      originalPrice: initialData?.originalPrice || "",
      category: Array.isArray(initialData?.category) ? initialData.category[0] : (initialData?.category || ""),
      condition: initialData?.condition || "New",
      inStock: initialData?.inStock ?? true,
      stockCount: initialData?.stockCount || 1,
      productType: initialData?.productType || (initialData?.variants?.length ? "variant" : "single"),
      variantType: initialData?.variantType || (initialData?.colors?.length ? "Color" : "None"),
      variants: initialData?.variants || [],
      batchConfig: initialData?.batchConfig || {
        minOrder: 5,
        currentOrder: 0,
        batchStatus: "collecting"
      },
      specifications: initialData?.specifications || {},
      deliveryTime: initialData?.deliveryTime || "3-5 days",
      warranty: initialData?.warranty || "No Warranty"
    },
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: "variants",
  });

  const productType = watch("productType");
  const variantType = watch("variantType");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles((prev) => [...prev, ...files]);

      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: any) => {
    const formData = new FormData();

    // Basic Fields
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("price", data.price);
    if(data.originalPrice) formData.append("originalPrice", data.originalPrice);
    formData.append("condition", data.condition);
    formData.append("store", storeId);

    // Validate Store Data availability
    if (!storeData?.owner?._id) {
        toast.error("Store data not loaded. Please try again.");
        return;
    }
    formData.append("seller", storeData.owner._id);
    
    // Arrays / Objects
    formData.append("category", JSON.stringify([data.category])); // Simple single category for now
    formData.append("productType", data.productType);
    
    // Batch Config
    if (data.productType === "batch") {
         formData.append("batchConfig", JSON.stringify(data.batchConfig));
    }

    // Variants
    if (["variant", "random"].includes(data.productType)) {
         formData.append("variantType", data.variantType);
         formData.append("variants", JSON.stringify(data.variants));
    } else {
         // Single product stock
         formData.append("stockCount", data.stockCount.toString());
         formData.append("inStock", data.inStock.toString());
    }

    // Images
    imageFiles.forEach((file) => {
      formData.append("images", file); // For Create
    });
    
    // For Edit: existing images are handled differently usually, lets assume replace for now or need existing logic
    if (isEditing) {
         formData.append("existingImages", JSON.stringify(initialData?.images?.filter((img: string) => imagePreviews.includes(img)) || []));
         // New images key might be different for edit controller?
         // Checked EditController: expects 'images' for new files. 
    }

    if (isEditing) {
      updateProduct(
        { productId: initialData._id, data: formData as any }, // strict typing issue fix later
        {
          onSuccess: () => {
            toast.success("Product updated successfully!");
            router.push(`/dashboard/storefronts/manage/${storeId}`);
          },
          onError: (err: any) => {
            toast.error(err.message || "Failed to update product");
          },
        }
      );
    } else {
      createProduct(formData as any, {
        onSuccess: () => {
          toast.success("Product created successfully!");
          router.push(`/dashboard/storefronts/manage/${storeId}`);
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to create product");
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-10">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Title</Label>
                        <Input placeholder="Product Name" {...register("title", { required: true })} />
                        {errors.title && <span className="text-red-500 text-sm">Required</span>}
                    </div>
                    
                    <div className="grid gap-2">
                        <Label>Description</Label>
                        <Textarea placeholder="Describe your product..." {...register("description", { required: true })} />
                        {errors.description && <span className="text-red-500 text-sm">Required</span>}
                    </div>

                    <div className="grid gap-2">
                        <Label>Category</Label>
                        <Select onValueChange={(val) => setValue("category", val)} defaultValue={initialData?.category || ""}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Fashion">Fashion</SelectItem>
                                <SelectItem value="Electronics">Electronics</SelectItem>
                                <SelectItem value="Food">Food & Drinks</SelectItem>
                                <SelectItem value="Books">Books</SelectItem>
                                <SelectItem value="Services">Services</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Pricing & Stock */}
            <Card>
                <CardHeader>
                   <CardTitle>Pricing & Type</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Base Price (₦)</Label>
                            <Input type="number" {...register("price", { required: true })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Original Price (Optional)</Label>
                            <Input type="number" {...register("originalPrice")} />
                        </div>
                     </div>

                     <div className="grid gap-2">
                        <Label>Product Structure</Label>
                        <Select onValueChange={(val) => setValue("productType", val)} defaultValue="single">
                            <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="single">Single Item</SelectItem>
                                <SelectItem value="variant">With Variants (Size, Color)</SelectItem>
                                <SelectItem value="batch">Group Order (Food/Batch)</SelectItem>
                                <SelectItem value="random">Mystery / Random</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                </CardContent>
            </Card>

            {/* Variants Section */}
            {(productType === "variant" || productType === "random") && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Variants</CardTitle>
                        <Button type="button" onClick={() => appendVariant({ name: "", price: "", stock: 1 })} size="sm">
                            <Plus className="w-4 h-4 mr-2" /> Add Variant
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="mb-4">
                            <Label>Variant Type</Label>
                             <Select onValueChange={(val) => setValue("variantType", val)} defaultValue="Size">
                                <SelectTrigger>
                                    <SelectValue placeholder="e.g. Size, Color" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Size">Size (S, M, L)</SelectItem>
                                    <SelectItem value="Color">Color (Red, Blue)</SelectItem>
                                    <SelectItem value="Color+Size">Color & Size</SelectItem>
                                    <SelectItem value="Custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {variantFields.map((field, index) => (
                            <div key={field.id} className="flex gap-3 items-end border p-3 rounded-md bg-gray-50/50">
                                <div className="grid gap-2 flex-1">
                                    <Label className="text-xs">Option Name</Label>
                                    <Input placeholder="e.g. Red, XL" {...register(`variants.${index}.name` as const, { required: true })} />
                                </div>
                                <div className="grid gap-2 w-24">
                                    <Label className="text-xs">Price (+/-)</Label>
                                    <Input type="number" placeholder="0" {...register(`variants.${index}.price` as const)} />
                                </div>
                                <div className="grid gap-2 w-20">
                                    <Label className="text-xs">Stock</Label>
                                    <Input type="number" {...register(`variants.${index}.stock` as const)} />
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(index)} className="text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Batch Config */}
            {productType === "batch" && (
                <Card className="border-blue-200 bg-blue-50/20">
                    <CardHeader>
                        <CardTitle>Batch Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                             <Label>Min Orders Required</Label>
                             <Input type="number" {...register("batchConfig.minOrder")} />
                        </div>
                        <div className="grid gap-2">
                             <Label>Deadline (Optional)</Label>
                             <Input type="date" {...register("batchConfig.batchDeadline")} />
                        </div>
                    </CardContent>
                </Card>
            )}

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
            {/* Images */}
            <Card>
                <CardHeader>
                    <CardTitle>Images</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {imagePreviews.map((src, idx) => (
                            <div key={idx} className="relative aspect-square rounded-md overflow-hidden border">
                                <Image src={src} alt="Preview" fill className="object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50 transition">
                            <Upload className="w-6 h-6 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500">Upload</span>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                    </div>
                </CardContent>
            </Card>

            {/* Stock (Single Only) */}
            {productType === "single" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Inventory</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>In Stock</Label>
                            <Controller
                                control={control}
                                name="inStock"
                                render={({ field }) => (
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                )}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Quantity</Label>
                            <Input type="number" {...register("stockCount")} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Inherited Location */}
            <Card>
                <CardHeader>
                    <CardTitle>Shipping</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="text-sm text-gray-500">
                        Products ship from: <br />
                        <span className="font-semibold text-gray-900">{storeData?.location || "Loading..."}</span>
                     </div>
                     <div className="grid gap-2">
                        <Label>Delivery Time</Label>
                        <Input placeholder="e.g. 1-2 days" {...register("deliveryTime")} />
                     </div>
                </CardContent>
            </Card>

        </div>
      </div>

      <div className="flex justify-end gap-4 fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-10 md:static md:bg-transparent md:border-none md:p-0">
         <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
         <Button type="submit" disabled={isCreating || isUpdating} className="bg-[#3bb85e] hover:bg-[#2d8a47] text-white">
            {isCreating || isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isEditing ? "Save Changes" : "Create Product"}
         </Button>
      </div>
    </form>
  );
}
