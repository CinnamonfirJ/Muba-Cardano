import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "../services/orderService";
import toast from "react-hot-toast";

export const useMyOrders = () => {
  return useQuery({
    queryKey: ["my-orders"],
    queryFn: () => orderService.getMyOrders(),
  });
};

export const useOrder = (id: string, isVendor: boolean = false) => {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => orderService.getOrderById(id),
    enabled: !!id && !isVendor, // If vendor, use useVendorOrder
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => orderService.createOrder(data),
    onSuccess: () => {
      // toast.success("Order placed successfully"); // Usually handled by redirect
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to place order");
    },
  });
};
