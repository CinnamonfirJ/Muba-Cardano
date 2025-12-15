import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getVendorOrders,
  getVendorOrder,
  updateVendorOrder,
  VendorOrder,
} from "../services/vendorOrder.service";
import toast from "react-hot-toast";

export const useVendorOrders = (vendorId?: string) => {
  return useQuery({
    queryKey: ["vendorOrders", vendorId],
    queryFn: () => getVendorOrders(vendorId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!vendorId,
  });
};

export const useVendorOrder = (orderId: string, vendorId?: string) => {
  return useQuery({
    queryKey: ["vendorOrder", orderId, vendorId],
    queryFn: () => getVendorOrder(orderId, vendorId),
    enabled: !!orderId,
  });
};

export const useUpdateVendorOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      data,
      vendorId,
    }: {
      orderId: string;
      data: Partial<VendorOrder>;
      vendorId?: string;
    }) => updateVendorOrder(orderId, data, vendorId),
    onSuccess: (data, variables) => {
      toast.success("Order updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["vendorOrders", variables.vendorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["vendorOrder", variables.orderId],
      });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update order";
      toast.error(message);
    },
  });
};
