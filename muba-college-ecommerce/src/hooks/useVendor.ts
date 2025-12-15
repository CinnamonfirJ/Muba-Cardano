import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  vendorService,
  type VendorApplicationData,
} from "../services/vendorService";
import toast from "react-hot-toast";

export const useCheckVendorStatus = () => {
  return useQuery({
    queryKey: ["vendorStatus"],
    queryFn: () => vendorService.getApplicationStatus(),
    retry: false,
  });
};

export const useMyVendorApplication = () => {
    return useQuery({
        queryKey: ["myVendorApplication"],
        queryFn: () => vendorService.getMyVendorApplication(),
        retry: false,
    });
};

export const useSubmitVendorApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VendorApplicationData) =>
      vendorService.submitApplication(data),
    onSuccess: (data) => {
      toast.success(data.message || "Application submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["vendorStatus"] });
      queryClient.invalidateQueries({ queryKey: ["myVendorApplication"] });
      queryClient.invalidateQueries({ queryKey: ["user"] }); // User role or status might change
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to submit application"
      );
    },
  });
};

export const useAllVendors = () => {
    return useQuery({
        queryKey: ["vendors"],
        queryFn: () => vendorService.getAllVendors(),
    });
};

export const useVendor = (id: string) => {
    return useQuery({
        queryKey: ["vendor", id],
        queryFn: () => vendorService.getVendorById(id),
        enabled: !!id,
    });
};

export const useUpdateVendorStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
            vendorService.updateVendorStatus(id, status),
        onSuccess: () => {
            toast.success("Vendor status updated");
            queryClient.invalidateQueries({ queryKey: ["vendors"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update vendor status");
        },
    });
};
