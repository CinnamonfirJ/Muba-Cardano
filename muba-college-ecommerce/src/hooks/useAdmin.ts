import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../services/adminService";
import toast from "react-hot-toast";

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: () => adminService.getStats(),
  });
};

export const useAdminUsers = (page = 1, limit = 10, search = "") => {
  return useQuery({
    queryKey: ["adminUsers", page, limit, search],
    queryFn: () => adminService.getUsers(page, limit, search),
  });
};

export const useAdminStores = (page = 1, limit = 10, status = "all") => {
  return useQuery({
    queryKey: ["adminStores", page, limit, status],
    queryFn: () => adminService.getStores(page, limit, status),
  });
};

export const useVerifyStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storeId: string) => adminService.verifyStore(storeId),
    onSuccess: () => {
      toast.success("Store verified successfully");
      queryClient.invalidateQueries({ queryKey: ["adminStores"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to verify store");
    },
  });
};
