"use client";
import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Badge } from "../../ui/badge";
import {
  Package,
  Save,
  ArrowLeft,
  Upload,
  X,
  Plus,
  Loader2,
  MapPin,
  Tag,
  //   CheckCircle,
  DollarSign,
  Star,
  Palette,
  Ruler,
  Info,
  Truck,
  //   Shield,
} from "lucide-react";
import { productService } from "@/services/productService";
import { storeService } from "@/services/storeService";
import { authService } from "@/services/authService";
import toast from "react-hot-toast";

interface ProductFormData {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string[];
  condition: string;
  location: string;
  inStock: boolean;
  stockCount?: number;
  brand?: string;
  model?: string;
  weight?: string;
  dimensions?: string;
  deliveryTime?: string;
  warranty?: string;
  sizes?: (string | number)[];
  colors?: string[];
  features?: string[];
  tags?: string[];
  specifications?: { [key: string]: string };
  storeId?: string;
}

const CreateEditProductPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(id);
  const preSelectedStore = searchParams.get("store");

  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    price: 0,
    originalPrice: undefined,
    category: [],
    condition: "new",
    location: "",
    inStock: true,
    stockCount: undefined,
    brand: "",
    model: "",
    weight: "",
    dimensions: "",
    deliveryTime: "",
    warranty: "",
    sizes: [],
    colors: [],
    features: [],
    tags: [],
    specifications: {},
    storeId: preSelectedStore || "",
  });

  const [newCategory, setNewCategory] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [currentImageUrls, setCurrentImageUrls] = useState<string[]>([]);

  const [availableStores, setAvailableStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Condition options
  const conditionOptions = [
    { value: "new", label: "New" },
    { value: "used", label: "Used - Like New" },
    { value: "good", label: "Used - Good" },
    { value: "fair", label: "Used - Fair" },
    { value: "refurbished", label: "Refurbished" },
  ];

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Get current user
        const user = authService.getCurrentUser();
        if (!user) {
          setError("Please log in to create or edit a product");
          navigate("/login");
          return;
        }
        setCurrentUser(user);

        // Load user's stores
        await loadUserStores(user);

        // Load product data for editing
        if (isEditMode && id) {
          await loadProductData(id, user);
        }
      } catch (err: any) {
        setError("Failed to load user data");
        console.error("Error loading initial data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    loadInitialData();
  }, [id, isEditMode, navigate]);

  const loadUserStores = async (user: any) => {
    try {
      const response = await storeService.getAllStores();
      const stores = response.data || response.stores || response;
      // Filter stores owned by current user
      const userStores = Array.isArray(stores)
        ? stores.filter((store) => {
            const ownerId =
              typeof store.owner === "object" ? store.owner._id : store.owner;
            return ownerId === user._id;
          })
        : [];
      setAvailableStores(userStores);
    } catch (err: any) {
      console.error("Error loading user stores:", err);
      setAvailableStores([]);
    }
  };

  const loadProductData = async (productId: string, user: any) => {
    try {
      setError(null);
      const response = await productService.getProductById(productId);
      const product = response.data || response;

      // Verify ownership
      if (product.seller && product.seller._id !== user._id) {
        setError("You don't have permission to edit this product");
        return;
      }

      setFormData({
        title: product.title || "",
        description: product.description || "",
        price: product.price || 0,
        originalPrice: product.originalPrice || undefined,
        category: product.category || [],
        condition: product.condition || "new",
        location: product.location || "",
        inStock: product.inStock !== false,
        stockCount: product.stockCount || undefined,
        brand: product.brand || "",
        model: product.model || "",
        weight: product.weight || "",
        dimensions: product.dimensions || "",
        deliveryTime: product.deliveryTime || "",
        warranty: product.warranty || "",
        sizes: product.sizes || [],
        colors: product.colors || [],
        features: product.features || [],
        tags: product.tags || [],
        specifications: product.specifications || {},
        storeId: product.store?._id || "",
      });

      if (product.images && product.images.length > 0) {
        setCurrentImageUrls(product.images);
        setImagePreviews(product.images);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load product data");
      console.error("Error loading product:", err);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // Validate total images (max 5)
    if (imagePreviews.length + files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    files.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image file`);
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return;
      }

      validFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFiles.length) {
          setImageFiles((prev) => [...prev, ...validFiles]);
          setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setError(null);
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));

    // Remove from imageFiles if it's a new file
    if (index >= currentImageUrls.length) {
      const fileIndex = index - currentImageUrls.length;
      setImageFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    } else {
      // Remove from current URLs if it's an existing image
      setCurrentImageUrls((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Helper functions for adding/removing array items
  const addToArray = (
    field: keyof ProductFormData,
    _value: string,
    newValue: string,
    setNewValue: (val: string) => void
  ) => {
    const trimmedValue = newValue.trim();
    if (trimmedValue && !(formData[field] as string[]).includes(trimmedValue)) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...(prev[field] as string[]), trimmedValue],
      }));
      setNewValue("");
    }
  };

  const removeFromArray = (
    field: keyof ProductFormData,
    valueToRemove: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter(
        (item) => item !== valueToRemove
      ),
    }));
  };

  const addSpecification = () => {
    const trimmedKey = newSpecKey.trim();
    const trimmedValue = newSpecValue.trim();

    if (trimmedKey && trimmedValue && !formData.specifications?.[trimmedKey]) {
      setFormData((prev) => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [trimmedKey]: trimmedValue,
        },
      }));
      setNewSpecKey("");
      setNewSpecValue("");
    }
  };

  const removeSpecification = (keyToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      specifications: Object.fromEntries(
        Object.entries(prev.specifications || {}).filter(
          ([key]) => key !== keyToRemove
        )
      ),
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Product title is required";
    } else if (formData.title.trim().length < 3) {
      errors.title = "Title must be at least 3 characters";
    }

    if (!formData.description.trim()) {
      errors.description = "Product description is required";
    } else if (formData.description.trim().length < 20) {
      errors.description = "Description must be at least 20 characters";
    }

    if (!formData.price || formData.price <= 0) {
      errors.price = "Valid price is required";
    }

    if (!formData.location.trim()) {
      errors.location = "Location is required";
    }

    if (formData.category.length === 0) {
      errors.category = "At least one category is required";
    }

    if (!formData.storeId) {
      errors.storeId = "Please select a store";
    }

    // Image validation: at least one image required
    if (!isEditMode && imageFiles.length === 0) {
      errors.images = "At least one product image is required";
    }

    if (isEditMode && imagePreviews.length === 0) {
      errors.images = "At least one product image is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!currentUser || !currentUser._id) {
      toast.error("User authentication required");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Create FormData for multipart/form-data request
      const formDataPayload = new FormData();

      // Add all text fields
      formDataPayload.append("title", formData.title.trim());
      formDataPayload.append("description", formData.description.trim());
      formDataPayload.append("price", formData.price.toString());

      if (formData.originalPrice && formData.originalPrice > formData.price) {
        formDataPayload.append(
          "originalPrice",
          formData.originalPrice.toString()
        );
      }

      formDataPayload.append("condition", formData.condition);
      formDataPayload.append("location", formData.location.trim());
      formDataPayload.append("inStock", formData.inStock.toString());

      if (formData.stockCount !== undefined) {
        formDataPayload.append("stockCount", formData.stockCount.toString());
      }

      // Optional fields
      if (formData.brand?.trim())
        formDataPayload.append("brand", formData.brand.trim());
      if (formData.model?.trim())
        formDataPayload.append("model", formData.model.trim());
      if (formData.weight?.trim())
        formDataPayload.append("weight", formData.weight.trim());
      if (formData.dimensions?.trim())
        formDataPayload.append("dimensions", formData.dimensions.trim());
      if (formData.deliveryTime?.trim())
        formDataPayload.append("deliveryTime", formData.deliveryTime.trim());
      if (formData.warranty?.trim())
        formDataPayload.append("warranty", formData.warranty.trim());

      // Add arrays as JSON strings
      formDataPayload.append("category", JSON.stringify(formData.category));
      if (formData.sizes && formData.sizes.length > 0) {
        formDataPayload.append("sizes", JSON.stringify(formData.sizes));
      }
      if (formData.colors && formData.colors.length > 0) {
        formDataPayload.append("colors", JSON.stringify(formData.colors));
      }
      if (formData.features && formData.features.length > 0) {
        formDataPayload.append("features", JSON.stringify(formData.features));
      }
      if (formData.tags && formData.tags.length > 0) {
        formDataPayload.append("tags", JSON.stringify(formData.tags));
      }
      if (
        formData.specifications &&
        Object.keys(formData.specifications).length > 0
      ) {
        formDataPayload.append(
          "specifications",
          JSON.stringify(formData.specifications)
        );
      }

      // Add seller and store info
      if (!isEditMode) {
        formDataPayload.append("seller", currentUser._id);
      }

      if (formData.storeId) {
        formDataPayload.append("store", formData.storeId);
      }

      // Handle image uploads
      imageFiles.forEach((file) => {
        formDataPayload.append(`images`, file);
      });

      // Handle existing images for edit mode
      if (isEditMode && currentImageUrls.length > 0) {
        formDataPayload.append(
          "existingImages",
          JSON.stringify(currentImageUrls)
        );
      }

      // Debug: Log FormData contents
      console.log("=== Product FormData Debug ===");
      console.log("Is Edit Mode:", isEditMode);
      console.log("Store ID:", formData.storeId);
      console.log("Seller ID:", currentUser._id);
      console.log("New images:", imageFiles.length);
      console.log("Existing images:", currentImageUrls.length);

      // Call appropriate service method
      let response;
      if (isEditMode && id) {
        response = await productService.updateProduct(id, formDataPayload);
      } else {
        response = await productService.createProduct(formDataPayload);
      }

      // Show success message
      toast.success(
        response.message ||
          `Product ${isEditMode ? "updated" : "created"} successfully!`
      );

      // Navigate back to appropriate page
      if (formData.storeId) {
        navigate(`/dashboard/storefronts/manage/${formData.storeId}`, {
          state: {
            message: `Product ${isEditMode ? "updated" : "created"} successfully!`,
          },
        });
      } else {
        navigate("/dashboard/products", {
          state: {
            message: `Product ${isEditMode ? "updated" : "created"} successfully!`,
          },
        });
      }
    } catch (err: any) {
      console.error("Error saving product:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        `Failed to ${isEditMode ? "update" : "create"} product`;

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-[400px]'>
        <div className='flex items-center gap-2'>
          <Loader2 className='w-6 h-6 animate-spin' />
          <span className='text-gray-600'>Loading product data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6 mx-auto max-w-4xl'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button
          variant='outline'
          onClick={() => {
            if (formData.storeId) {
              navigate(`/dashboard/storefronts/manage/${formData.storeId}`);
            } else {
              navigate("/dashboard/products");
            }
          }}
          className='flex items-center gap-2'
        >
          <ArrowLeft className='w-4 h-4' />
          Back
        </Button>
        <div>
          <h1 className='font-bold text-gray-900 text-2xl'>
            {isEditMode ? "Edit Product" : "Add New Product"}
          </h1>
          <p className='text-gray-600'>
            {isEditMode
              ? "Update your product information and details"
              : "Create a new product listing for your store"}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className='bg-red-50 border-red-200'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 text-red-800'>
              <span className='font-medium'>Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Package className='w-5 h-5' />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Store Selection */}
            <div>
              <label
                htmlFor='store'
                className='block mb-1 font-medium text-gray-700 text-sm'
              >
                Store *
              </label>
              <select
                id='store'
                value={formData.storeId}
                onChange={(e) => handleInputChange("storeId", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3bb85e] ${
                  validationErrors.storeId
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                disabled={Boolean(preSelectedStore)}
              >
                <option value=''>Select a store</option>
                {availableStores.map((store) => (
                  <option key={store._id} value={store._id}>
                    {store.name}
                  </option>
                ))}
              </select>
              {validationErrors.storeId && (
                <p className='mt-1 text-red-500 text-xs'>
                  {validationErrors.storeId}
                </p>
              )}
              {availableStores.length === 0 && (
                <p className='mt-1 text-gray-500 text-xs'>
                  You need to create a store first.
                  <Button
                    type='button'
                    variant='link'
                    className='p-0 h-auto text-[#3bb85e] text-xs'
                    onClick={() => navigate("/dashboard/storefronts/new")}
                  >
                    Create Store
                  </Button>
                </p>
              )}
            </div>

            <div className='gap-4 grid grid-cols-1 md:grid-cols-2'>
              <div>
                <label
                  htmlFor='title'
                  className='block mb-1 font-medium text-gray-700 text-sm'
                >
                  Product Title *
                </label>
                <Input
                  id='title'
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder='Enter product title'
                  className={validationErrors.title ? "border-red-500" : ""}
                />
                {validationErrors.title && (
                  <p className='mt-1 text-red-500 text-xs'>
                    {validationErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor='condition'
                  className='block mb-1 font-medium text-gray-700 text-sm'
                >
                  Condition *
                </label>
                <select
                  id='condition'
                  value={formData.condition}
                  onChange={(e) =>
                    handleInputChange("condition", e.target.value)
                  }
                  className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#3bb85e] focus:ring-2 w-full'
                >
                  {conditionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor='description'
                className='block mb-1 font-medium text-gray-700 text-sm'
              >
                Description *
              </label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder='Describe your product in detail...'
                rows={4}
                className={validationErrors.description ? "border-red-500" : ""}
              />
              {validationErrors.description && (
                <p className='mt-1 text-red-500 text-xs'>
                  {validationErrors.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Stock */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <DollarSign className='w-5 h-5' />
              Pricing & Stock
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='gap-4 grid grid-cols-1 md:grid-cols-3'>
              <div>
                <label
                  htmlFor='price'
                  className='block mb-1 font-medium text-gray-700 text-sm'
                >
                  Price (₦) *
                </label>
                <Input
                  id='price'
                  type='number'
                  min='0'
                  step='0.01'
                  value={formData.price || ""}
                  onChange={(e) =>
                    handleInputChange("price", parseFloat(e.target.value) || 0)
                  }
                  placeholder='0.00'
                  className={validationErrors.price ? "border-red-500" : ""}
                />
                {validationErrors.price && (
                  <p className='mt-1 text-red-500 text-xs'>
                    {validationErrors.price}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor='originalPrice'
                  className='block mb-1 font-medium text-gray-700 text-sm'
                >
                  Original Price (₦) - Optional
                </label>
                <Input
                  id='originalPrice'
                  type='number'
                  min='0'
                  step='0.01'
                  value={formData.originalPrice || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "originalPrice",
                      parseFloat(e.target.value) || undefined
                    )
                  }
                  placeholder='0.00'
                />
                {formData.originalPrice &&
                  formData.originalPrice <= formData.price && (
                    <p className='mt-1 text-orange-500 text-xs'>
                      Original price should be higher than current price
                    </p>
                  )}
              </div>

              <div>
                <label
                  htmlFor='stockCount'
                  className='block mb-1 font-medium text-gray-700 text-sm'
                >
                  Stock Count
                </label>
                <Input
                  id='stockCount'
                  type='number'
                  min='0'
                  value={formData.stockCount || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "stockCount",
                      parseInt(e.target.value) || undefined
                    )
                  }
                  placeholder='Unlimited'
                />
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='inStock'
                checked={formData.inStock}
                onChange={(e) => handleInputChange("inStock", e.target.checked)}
                className='border-gray-300 rounded focus:ring-[#3bb85e] w-4 h-4 text-[#3bb85e]'
              />
              <label htmlFor='inStock' className='text-gray-700 text-sm'>
                Product is in stock and available for sale
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Product Images */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Upload className='w-5 h-5' />
              Product Images * (Max 5)
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className='gap-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5'>
                {imagePreviews.map((preview, index) => (
                  <div key={index} className='relative'>
                    <img
                      src={preview}
                      alt={`Product ${index + 1}`}
                      className='border rounded-lg w-full h-24 object-cover'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => removeImage(index)}
                      className='-top-2 -right-2 absolute bg-red-500 hover:bg-red-600 p-0 border-red-500 w-6 h-6 text-white'
                    >
                      <X className='w-3 h-3' />
                    </Button>
                    {index === 0 && (
                      <Badge className='bottom-1 left-1 absolute bg-[#3bb85e] text-xs'>
                        Main
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload Area */}
            {imagePreviews.length < 5 && (
              <div className='p-6 border-2 border-gray-300 hover:border-[#3bb85e] border-dashed rounded-lg text-center transition-colors'>
                <input
                  type='file'
                  accept='image/*'
                  multiple
                  onChange={handleImageChange}
                  className='hidden'
                  id='images-upload'
                />
                <label htmlFor='images-upload' className='cursor-pointer'>
                  <Upload className='mx-auto mb-2 w-12 h-12 text-gray-400' />
                  <p className='mb-1 text-gray-600 text-sm'>
                    Click to upload or drag and drop
                  </p>
                  <p className='text-gray-500 text-xs'>
                    PNG, JPG, JPEG up to 5MB each ({5 - imagePreviews.length}{" "}
                    remaining)
                  </p>
                </label>
              </div>
            )}

            {validationErrors.images && (
              <p className='text-red-500 text-xs'>{validationErrors.images}</p>
            )}
          </CardContent>
        </Card>

        {/* Categories & Location */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Tag className='w-5 h-5' />
              Categories & Location
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Categories */}
            <div>
              <label className='block mb-1 font-medium text-gray-700 text-sm'>
                Categories *
              </label>
              <div className='flex gap-2 mb-2'>
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder='Add a category...'
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(),
                    addToArray(
                      "category",
                      formData.category.join(","),
                      newCategory,
                      setNewCategory
                    ))
                  }
                />
                <Button
                  type='button'
                  onClick={() =>
                    addToArray(
                      "category",
                      formData.category.join(","),
                      newCategory,
                      setNewCategory
                    )
                  }
                  disabled={!newCategory.trim()}
                >
                  <Plus className='w-4 h-4' />
                </Button>
              </div>

              {formData.category.length > 0 && (
                <div className='flex flex-wrap gap-2'>
                  {formData.category.map((cat, index) => (
                    <Badge
                      key={index}
                      variant='secondary'
                      className='flex items-center gap-1'
                    >
                      {cat}
                      <button
                        type='button'
                        onClick={() => removeFromArray("category", cat)}
                        className='hover:bg-gray-300 ml-1 p-0.5 rounded-full'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {validationErrors.category && (
                <p className='text-red-500 text-xs'>
                  {validationErrors.category}
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor='location'
                className='block mb-1 font-medium text-gray-700 text-sm'
              >
                Location *
              </label>
              <div className='relative'>
                <MapPin className='top-3 left-3 absolute w-4 h-4 text-gray-400' />
                <Input
                  id='location'
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  placeholder='Enter product location'
                  className={`pl-10 ${validationErrors.location ? "border-red-500" : ""}`}
                />
              </div>
              {validationErrors.location && (
                <p className='mt-1 text-red-500 text-xs'>
                  {validationErrors.location}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Info className='w-5 h-5' />
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='gap-4 grid grid-cols-1 md:grid-cols-2'>
              <div>
                <label
                  htmlFor='brand'
                  className='block mb-1 font-medium text-gray-700 text-sm'
                >
                  Brand
                </label>
                <Input
                  id='brand'
                  value={formData.brand || ""}
                  onChange={(e) => handleInputChange("brand", e.target.value)}
                  placeholder='Enter brand name'
                />
              </div>

              <div>
                <label
                  htmlFor='model'
                  className='block mb-1 font-medium text-gray-700 text-sm'
                >
                  Model
                </label>
                <Input
                  id='model'
                  value={formData.model || ""}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                  placeholder='Enter model number/name'
                />
              </div>

              <div>
                <label
                  htmlFor='weight'
                  className='block mb-1 font-medium text-gray-700 text-sm'
                >
                  Weight
                </label>
                <Input
                  id='weight'
                  value={formData.weight || ""}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  placeholder='e.g., 1.5kg, 500g'
                />
              </div>

              <div>
                <label
                  htmlFor='dimensions'
                  className='block mb-1 font-medium text-gray-700 text-sm'
                >
                  Dimensions
                </label>
                <Input
                  id='dimensions'
                  value={formData.dimensions || ""}
                  onChange={(e) =>
                    handleInputChange("dimensions", e.target.value)
                  }
                  placeholder='e.g., 30x20x15cm'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variants & Options */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Palette className='w-5 h-5' />
              Variants & Options
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Colors */}
            <div>
              <label className='block mb-2 font-medium text-gray-700 text-sm'>
                Available Colors
              </label>
              <div className='flex gap-2 mb-2'>
                <Input
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder='Add a color...'
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(),
                    addToArray(
                      "colors",
                      formData.colors?.join(",") || "",
                      newColor,
                      setNewColor
                    ))
                  }
                />
                <Button
                  type='button'
                  onClick={() =>
                    addToArray(
                      "colors",
                      formData.colors?.join(",") || "",
                      newColor,
                      setNewColor
                    )
                  }
                  disabled={!newColor.trim()}
                >
                  <Plus className='w-4 h-4' />
                </Button>
              </div>

              {formData.colors && formData.colors.length > 0 && (
                <div className='flex flex-wrap gap-2'>
                  {formData.colors.map((color, index) => (
                    <Badge
                      key={index}
                      variant='outline'
                      className='flex items-center gap-1'
                    >
                      <div
                        className='border border-gray-300 rounded-full w-3 h-3'
                        style={{ backgroundColor: color.toLowerCase() }}
                      />
                      {color}
                      <button
                        type='button'
                        onClick={() => removeFromArray("colors", color)}
                        className='hover:bg-gray-200 ml-1 p-0.5 rounded-full'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Sizes */}
            <div>
              <label className='block mb-2 font-medium text-gray-700 text-sm'>
                Available Sizes
              </label>
              <div className='flex gap-2 mb-2'>
                <Input
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  placeholder='Add a size (e.g., XL, 42, Large)...'
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(),
                    addToArray(
                      "sizes",
                      formData.sizes?.join(",") || "",
                      newSize,
                      setNewSize
                    ))
                  }
                />
                <Button
                  type='button'
                  onClick={() =>
                    addToArray(
                      "sizes",
                      formData.sizes?.join(",") || "",
                      newSize,
                      setNewSize
                    )
                  }
                  disabled={!newSize.trim()}
                >
                  <Plus className='w-4 h-4' />
                </Button>
              </div>

              {formData.sizes && formData.sizes.length > 0 && (
                <div className='flex flex-wrap gap-2'>
                  {formData.sizes.map((size, index) => (
                    <Badge
                      key={index}
                      variant='outline'
                      className='flex items-center gap-1'
                    >
                      <Ruler className='w-3 h-3' />
                      {size}
                      <button
                        type='button'
                        onClick={() =>
                          removeFromArray("sizes", size.toString())
                        }
                        className='hover:bg-gray-200 ml-1 p-0.5 rounded-full'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Features & Tags */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Star className='w-5 h-5' />
              Features & Tags
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Features */}
            <div>
              <label className='block mb-2 font-medium text-gray-700 text-sm'>
                Key Features
              </label>
              <div className='flex gap-2 mb-2'>
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder='Add a feature...'
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(),
                    addToArray(
                      "features",
                      formData.features?.join(",") || "",
                      newFeature,
                      setNewFeature
                    ))
                  }
                />
                <Button
                  type='button'
                  onClick={() =>
                    addToArray(
                      "features",
                      formData.features?.join(",") || "",
                      newFeature,
                      setNewFeature
                    )
                  }
                  disabled={!newFeature.trim()}
                >
                  <Plus className='w-4 h-4' />
                </Button>
              </div>

              {formData.features && formData.features.length > 0 && (
                <div className='flex flex-wrap gap-2'>
                  {formData.features.map((feature, index) => (
                    <Badge
                      key={index}
                      variant='secondary'
                      className='flex items-center gap-1'
                    >
                      {feature}
                      <button
                        type='button'
                        onClick={() => removeFromArray("features", feature)}
                        className='hover:bg-gray-300 ml-1 p-0.5 rounded-full'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className='block mb-2 font-medium text-gray-700 text-sm'>
                Tags
              </label>
              <div className='flex gap-2 mb-2'>
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder='Add a tag...'
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(),
                    addToArray(
                      "tags",
                      formData.tags?.join(",") || "",
                      newTag,
                      setNewTag
                    ))
                  }
                />
                <Button
                  type='button'
                  onClick={() =>
                    addToArray(
                      "tags",
                      formData.tags?.join(",") || "",
                      newTag,
                      setNewTag
                    )
                  }
                  disabled={!newTag.trim()}
                >
                  <Plus className='w-4 h-4' />
                </Button>
              </div>

              {formData.tags && formData.tags.length > 0 && (
                <div className='flex flex-wrap gap-2'>
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant='outline'
                      className='flex items-center gap-1'
                    >
                      #{tag}
                      <button
                        type='button'
                        onClick={() => removeFromArray("tags", tag)}
                        className='hover:bg-gray-200 ml-1 p-0.5 rounded-full'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Specifications</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='gap-2 grid grid-cols-1 md:grid-cols-2'>
              <Input
                value={newSpecKey}
                onChange={(e) => setNewSpecKey(e.target.value)}
                placeholder='Specification name (e.g., RAM, Storage)'
              />
              <div className='flex gap-2'>
                <Input
                  value={newSpecValue}
                  onChange={(e) => setNewSpecValue(e.target.value)}
                  placeholder='Value (e.g., 8GB, 256GB)'
                />
                <Button
                  type='button'
                  onClick={addSpecification}
                  disabled={!newSpecKey.trim() || !newSpecValue.trim()}
                >
                  <Plus className='w-4 h-4' />
                </Button>
              </div>
            </div>

            {formData.specifications &&
              Object.keys(formData.specifications).length > 0 && (
                <div className='space-y-2'>
                  {Object.entries(formData.specifications).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className='flex justify-between items-center bg-gray-50 p-2 rounded'
                      >
                        <span className='text-sm'>
                          <strong>{key}:</strong> {value}
                        </span>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => removeSpecification(key)}
                          className='p-0 w-6 h-6'
                        >
                          <X className='w-3 h-3' />
                        </Button>
                      </div>
                    )
                  )}
                </div>
              )}
          </CardContent>
        </Card>

        {/* Shipping & Warranty */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Truck className='w-5 h-5' />
              Shipping & Warranty
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='gap-4 grid grid-cols-1 md:grid-cols-2'>
              <div>
                <label
                  htmlFor='deliveryTime'
                  className='block mb-1 font-medium text-gray-700 text-sm'
                >
                  Delivery Time
                </label>
                <Input
                  id='deliveryTime'
                  value={formData.deliveryTime || ""}
                  onChange={(e) =>
                    handleInputChange("deliveryTime", e.target.value)
                  }
                  placeholder='e.g., 1-3 business days'
                />
              </div>

              <div>
                <label
                  htmlFor='warranty'
                  className='block mb-1 font-medium text-gray-700 text-sm'
                >
                  Warranty
                </label>
                <Input
                  id='warranty'
                  value={formData.warranty || ""}
                  onChange={(e) =>
                    handleInputChange("warranty", e.target.value)
                  }
                  placeholder='e.g., 1 year manufacturer warranty'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className='flex justify-end gap-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => {
              if (formData.storeId) {
                navigate(`/dashboard/storefronts/manage/${formData.storeId}`);
              } else {
                navigate("/dashboard/products");
              }
            }}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={isSaving || availableStores.length === 0}
            className='bg-[#3bb85e] hover:bg-[#457753]'
          >
            {isSaving ? (
              <>
                <Loader2 className='mr-2 w-4 h-4 animate-spin' />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className='mr-2 w-4 h-4' />
                {isEditMode ? "Update Product" : "Create Product"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditProductPage;
