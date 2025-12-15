import { useMutation } from "@tanstack/react-query";
import { paymentService } from "../services/paymentService";
import toast from "react-hot-toast";

export const useInitiatePayment = () => {
  return useMutation({
    mutationFn: (data: { email: string; amount: number; name: string }) =>
      paymentService.initializePayment(data),
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to initiate payment"
      );
    },
  });
};

export const useVerifyPayment = () => {
  return useMutation({
    mutationFn: (reference: string) => paymentService.verifyPayment(reference),
    // Success handling usually involves redirect or order creation update
  });
};
