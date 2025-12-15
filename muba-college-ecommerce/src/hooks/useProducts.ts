import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import {
  productService,
  type ProductFilters,
  type Product,
} from "../services/productService";
import toast from "react-hot-toast";

export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => productService.getAllProducts(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useInfiniteProducts = (filters: ProductFilters) => {
  return useInfiniteQuery({
    queryKey: ["infiniteProducts", filters],
    queryFn: async ({ pageParam = 1 }) => {
      // Ensure page param overrides filter page
      return productService.getAllProducts({ ...filters, page: pageParam as number });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      // Adjusted based on API response structure
      const pagination = lastPage.pagination;
      if (pagination && pagination.hasMore) {
        return pagination.page + 1;
      }
      return undefined;
    },
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productService.getProductById(id),
    enabled: !!id,
  });
};

export const useStoreProducts = (storeId: string, filters?: any) => {
  return useQuery({
    queryKey: ["storeProducts", storeId, filters],
    queryFn: () => productService.getProductsByStore(storeId, filters),
    enabled: !!storeId,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => productService.createProduct(data),
    onSuccess: () => {
      toast.success("Product created successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["storeProducts"] });
      queryClient.invalidateQueries({ queryKey: ["infiniteProducts"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create product");
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      productService.updateProduct(id, data),
    onSuccess: (data, variables) => {
      toast.success("Product updated successfully");
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["storeProducts"] });
      queryClient.invalidateQueries({ queryKey: ["infiniteProducts"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update product");
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["storeProducts"] });
      queryClient.invalidateQueries({ queryKey: ["infiniteProducts"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete product");
    },
  });
};
