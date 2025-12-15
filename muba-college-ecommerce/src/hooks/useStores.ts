import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeService, type Store } from "../services/storeService";
import toast from "react-hot-toast";

export const useStores = (params?: any) => {
  return useQuery({
    queryKey: ["stores", params],
    queryFn: () => storeService.getAllStores(params),
  });
};

export const useStore = (id: string) => {
  return useQuery({
    queryKey: ["store", id],
    queryFn: () => storeService.getStoreById(id),
    enabled: !!id,
  });
};

export const useMyStores = () => {
  return useQuery({
    queryKey: ["myStores"],
    queryFn: () => storeService.getMyStores(),
  });
};

export const useCreateStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData | Partial<Store>) => storeService.createStore(data),
    onSuccess: () => {
      toast.success("Store created successfully");
      queryClient.invalidateQueries({ queryKey: ["myStores"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create store");
    },
  });
};

export const useUpdateStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData | Partial<Store> }) =>
      storeService.updateStore(id, data),
    onSuccess: (data, variables) => {
      toast.success("Store updated successfully");
      queryClient.invalidateQueries({ queryKey: ["store", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["myStores"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update store");
    },
  });
};

export const useDeleteStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storeService.deleteStore(id),
    onSuccess: () => {
      toast.success("Store deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["myStores"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete store");
    },
  });
};

export const useFollowStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storeService.followStore(id),
    onSuccess: (data, id) => {
      toast.success("Followed store successfully");
      queryClient.invalidateQueries({ queryKey: ["store", id] });
      queryClient.invalidateQueries({ queryKey: ["myStores"] }); // Or specific user following list
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to follow store");
    },
  });
};

export const useUnfollowStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storeService.unfollowStore(id),
    onSuccess: (data, id) => {
      toast.success("Unfollowed store successfully");
      queryClient.invalidateQueries({ queryKey: ["store", id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to unfollow store");
    },
  });
};

export const useRateStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { rating: number; review: string } }) =>
      storeService.rateStore(id, data),
    onSuccess: (data, variables) => {
      toast.success("Rated store successfully");
      queryClient.invalidateQueries({ queryKey: ["store", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["storeReviews", variables.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to rate store");
    },
  });
};

export const useStoreReviews = (id: string) => {
  return useQuery({
    queryKey: ["storeReviews", id],
    queryFn: () => storeService.getStoreReviews(id),
    enabled: !!id,
  });
};
