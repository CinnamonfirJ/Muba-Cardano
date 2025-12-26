import api from "./api";

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string[];
  condition: string;
  location: string;
  seller: {
    _id: string;
    totalSales: number;
    firstname: string;
    lastname: string;
  };
  store: {
    _id: string;
    name: string;
    img?: string;
    verified?: boolean;
    owner: {
      _id: string;
      firstname: string;
      lastname: string;

      rating?: number;
    };
  };
  rating: number;
  reviews: number;
  inStock: boolean;
  createdAt: string;

  // Optional fields for different product types
  sizes?: (string | number)[];
  colors?: string[];
  productType?: 'simple' | 'variable' | 'batch';
  batchConfig?: {
    minOrder: number;
    currentOrder: number;
    batchStatus: 'collecting' | 'ordered' | 'shipped';
  };
  variantType?: string;
  variants?: any[]; 
  specifications?: { [key: string]: string };
  stockCount?: number;
  brand?: string;
  model?: string;
  weight?: string;
  dimensions?: string;
  features?: string[];
  tags?: string[];
  deliveryTime?: string;
  warranty?: string;
  views?: number;
  likes?: number;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  condition?: string;
  store?: string; // Added store filter
  seller?: string; // Added seller filter
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "price" | "rating" | "views";
  sortOrder?: "asc" | "desc";
}

export const productService = {
  async getAllProducts(filters?: ProductFilters) {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/api/v1/products?${params.toString()}`);
    return response.data;
  },

  async getProductById(id: string) {
    const response = await api.get(`/api/v1/products/${id}`);
    return response.data;
  },

  async getProductsByStore(
    storeId: string,
    filters?: {
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      minPrice?: number;
      maxPrice?: number;
      category?: string;
      condition?: string;
    }
  ) {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const url = queryString
      ? `/api/v1/products/store/${storeId}?${queryString}`
      : `/api/v1/products/store/${storeId}`;

    const response = await api.get(url);
    return response.data;
  },
  async getProductsBySeller(
    sellerId: string,
    filters?: Omit<ProductFilters, "seller">
  ) {
    const params = new URLSearchParams();
    params.append("seller", sellerId);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/api/v1/products?${params.toString()}`);
    return response.data;
  },

  async searchProducts(searchData: ProductFilters) {
    const response = await api.get("/api/v1/products/search", {
      params: searchData,
    });
    return response.data;
  },

  async createProduct(productData: FormData) {
    const response = await api.post("/api/v1/products", productData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 seconds for file uploads
    });
    return response.data;
  },

  async updateProduct(id: string, productData: FormData) {
    const response = await api.patch(`/api/v1/products/${id}`, productData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 seconds for file uploads
    });
    return response.data;
  },

  async updateProductStatus(id: string, inStock: boolean) {
    const response = await api.patch(`/api/v1/products/${id}/status`, {
      inStock,
    });
    return response.data;
  },

  async deleteProduct(id: string) {
    const response = await api.delete(`/api/v1/products/${id}`);
    return response.data;
  },

  // Analytics and reporting
  async getProductAnalytics(
    id: string,
    period: "week" | "month" | "year" = "month"
  ) {
    const response = await api.get(`/api/v1/products/${id}/analytics`, {
      params: { period },
    });
    return response.data;
  },

  async bulkUpdateProducts(productIds: string[], updates: Partial<Product>) {
    const response = await api.patch("/api/v1/products/bulk-update", {
      productIds,
      updates,
    });
    return response.data;
  },

  async duplicateProduct(id: string) {
    const response = await api.post(`/api/v1/products/${id}/duplicate`);
    return response.data;
  },
};

export const ProductService = productService;
export default productService;
