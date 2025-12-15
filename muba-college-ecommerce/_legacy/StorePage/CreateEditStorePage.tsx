"use client";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Badge } from "../../ui/badge";
import {
  Store,
  Save,
  ArrowLeft,
  Upload,
  X,
  Plus,
  Loader2,
  MapPin,
  Tag,
  CheckCircle,
} from "lucide-react";
import { storeService } from "@/services/storeService";
import { authService } from "@/services/authService";
import toast from "react-hot-toast";

interface StoreFormData {
  name: string;
  description: string;
  location: string;
  categories: string[];
}

const CreateEditStorePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<StoreFormData>({
    name: "",
    description: "",
    location: "",
    categories: [],
  });

  const [newCategory, setNewCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load current user and store data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Get current user
        const user = authService.getCurrentUser();
        if (!user) {
          setError("Please log in to create or edit a store");
          navigate("/login");
          return;
        }
        setCurrentUser(user);

        // Load store data for editing
        if (isEditMode && id) {
          await loadStoreData(id, user);
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

  const loadStoreData = async (storeId: string, user: any) => {
    try {
      setError(null);
      const response = await storeService.getStoreById(storeId);
      const store = response.data || response;

      // Verify ownership - owner is now a single object, not array
      if (store.owner) {
        const ownerId =
          typeof store.owner === "object" ? store.owner._id : store.owner;
        if (ownerId !== user._id) {
          setError("You don't have permission to edit this store");
          return;
        }
      } else {
        setError("Store owner information not found");
        return;
      }

      setFormData({
        name: store.name || "",
        description: store.description || "",
        location: store.location || "",
        categories: store.categories || [],
      });

      if (store.img) {
        setCurrentImageUrl(store.img);
        setImagePreview(store.img);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load store data");
      console.error("Error loading store:", err);
    }
  };

  const handleInputChange = (field: keyof StoreFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setError(null);
    }
  };

  const addCategory = () => {
    const trimmedCategory = newCategory.trim();
    if (trimmedCategory && !formData.categories.includes(trimmedCategory)) {
      setFormData((prev) => ({
        ...prev,
        categories: [...prev.categories, trimmedCategory],
      }));
      setNewCategory("");
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((cat) => cat !== categoryToRemove),
    }));
  };

  const clearImage = () => {
    setImagePreview("");
    setImageFile(null);
    setCurrentImageUrl("");

    // Clear file input
    const fileInput = document.getElementById(
      "image-upload"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Store name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Store name must be at least 2 characters";
    }

    if (!formData.description.trim()) {
      errors.description = "Store description is required";
    } else if (formData.description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters";
    }

    if (!formData.location.trim()) {
      errors.location = "Location is required";
    }

    if (formData.categories.length === 0) {
      errors.categories = "At least one category is required";
    }

    // Image validation: required for new stores, optional for edits
    if (!isEditMode && !imageFile) {
      errors.img = "Store image is required";
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
      formDataPayload.append("name", formData.name.trim());
      formDataPayload.append("description", formData.description.trim());
      formDataPayload.append("location", formData.location.trim());

      // Add categories as JSON string (backend expects this format)
      formDataPayload.append("categories", JSON.stringify(formData.categories));

      formDataPayload.append("owner", currentUser._id);
      // Add owner for new store creation - send as string directly
      // if (!isEditMode) {
      //   formDataPayload.append("owner", currentUser._id);
      // }

      // Handle image upload
      if (imageFile) {
        formDataPayload.append("img", imageFile);
      } else if (isEditMode && currentImageUrl) {
        formDataPayload.append("existingImg", currentImageUrl);
      }

      // Debug: Log FormData contents before sending
      console.log("=== FINAL FormData Debug ===");
      console.log("Categories array:", formData.categories);
      console.log("Owner ID:", currentUser._id);
      console.log("Is Edit Mode:", isEditMode);
      console.log("Image file:", imageFile ? imageFile.name : "No new image");
      console.log("Current image URL:", currentImageUrl);

      for (const pair of formDataPayload.entries()) {
        console.log(
          `${pair[0]}: ${pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]}`
        );
      }

      // Call appropriate service method
      let response;
      if (isEditMode && id) {
        response = await storeService.updateStore(id, formDataPayload as any);
      } else {
        response = await storeService.createStore(formDataPayload as any);
      }

      // Show success message
      toast.success(
        response.message ||
          `Store ${isEditMode ? "updated" : "created"} successfully!`
      );

      // Navigate back to storefronts page
      navigate("/dashboard/storefronts", {
        state: {
          message: `Store ${isEditMode ? "updated" : "created"} successfully!`,
        },
      });
    } catch (err: any) {
      console.error("Error saving store:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        `Failed to ${isEditMode ? "update" : "create"} store`;

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
          <span className='text-gray-600'>Loading store data...</span>
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
          onClick={() => navigate("/dashboard/storefronts")}
          className='flex items-center gap-2'
        >
          <ArrowLeft className='w-4 h-4' />
          Back to Storefronts
        </Button>
        <div>
          <h1 className='font-bold text-gray-900 text-2xl'>
            {isEditMode ? "Edit Store" : "Create New Store"}
          </h1>
          <p className='text-gray-600'>
            {isEditMode
              ? "Update your store information and settings"
              : "Set up your new storefront to start selling"}
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
              <Store className='w-5 h-5' />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='gap-4 grid grid-cols-1 md:grid-cols-2'>
              <div>
                <label
                  htmlFor='name'
                  className='block mb-1 font-medium text-gray-700 text-sm'
                >
                  Store Name *
                </label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder='Enter store name'
                  className={validationErrors.name ? "border-red-500" : ""}
                />
                {validationErrors.name && (
                  <p className='mt-1 text-red-500 text-xs'>
                    {validationErrors.name}
                  </p>
                )}
              </div>

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
                    placeholder='Enter store location'
                    className={`pl-10 ${validationErrors.location ? "border-red-500" : ""}`}
                  />
                </div>
                {validationErrors.location && (
                  <p className='mt-1 text-red-500 text-xs'>
                    {validationErrors.location}
                  </p>
                )}
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
                placeholder='Describe your store and what you sell...'
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

        {/* Store Image */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Upload className='w-5 h-5' />
              Store Image {!isEditMode && "*"}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {imagePreview ? (
              <div className='relative'>
                <img
                  src={imagePreview}
                  alt='Store preview'
                  className='border rounded-lg w-full max-w-md h-48 object-cover'
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={clearImage}
                  className='top-2 right-2 absolute bg-white hover:bg-gray-50'
                >
                  <X className='w-4 h-4' />
                </Button>
                {imageFile && (
                  <div className='flex items-center gap-2 mt-2 text-green-600 text-sm'>
                    <CheckCircle className='w-4 h-4' />
                    New image selected: {imageFile.name}
                  </div>
                )}
              </div>
            ) : (
              <div className='p-6 border-2 border-gray-300 hover:border-[#3bb85e] border-dashed rounded-lg text-center transition-colors'>
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleImageChange}
                  className='hidden'
                  id='image-upload'
                />
                <label htmlFor='image-upload' className='cursor-pointer'>
                  <Upload className='mx-auto mb-2 w-12 h-12 text-gray-400' />
                  <p className='mb-1 text-gray-600 text-sm'>
                    Click to upload or drag and drop
                  </p>
                  <p className='text-gray-500 text-xs'>
                    PNG, JPG, JPEG up to 5MB
                  </p>
                </label>
              </div>
            )}

            {!imagePreview && (
              <div>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    document.getElementById("image-upload")?.click()
                  }
                  className='flex items-center gap-2'
                >
                  <Upload className='w-4 h-4' />
                  Upload Image
                </Button>
              </div>
            )}

            {validationErrors.img && (
              <p className='text-red-500 text-xs'>{validationErrors.img}</p>
            )}
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Tag className='w-5 h-5' />
              Categories *
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex gap-2'>
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder='Add a category...'
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addCategory())
                }
              />
              <Button
                type='button'
                onClick={addCategory}
                disabled={!newCategory.trim()}
              >
                <Plus className='w-4 h-4' />
              </Button>
            </div>

            {formData.categories.length > 0 && (
              <div className='flex flex-wrap gap-2'>
                {formData.categories.map((category, index) => (
                  <Badge
                    key={index}
                    variant='secondary'
                    className='flex items-center gap-1'
                  >
                    {category}
                    <button
                      type='button'
                      onClick={() => removeCategory(category)}
                      className='hover:bg-gray-300 ml-1 p-0.5 rounded-full'
                    >
                      <X className='w-3 h-3' />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {validationErrors.categories && (
              <p className='text-red-500 text-xs'>
                {validationErrors.categories}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className='flex justify-end gap-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => navigate("/dashboard/storefronts")}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={isSaving}
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
                {isEditMode ? "Update Store" : "Create Store"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditStorePage;
