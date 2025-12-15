import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartService } from "../services/cartService";
import type { Product } from "../services/productService";
import toast from "react-hot-toast";

export const useCart = (userId: string) => {
  return useQuery({
    queryKey: ["cart", userId],
    queryFn: () => cartService.getCart(userId),
    enabled: !!userId,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      product,
      userId,
      quantity,
      variants,
    }: {
      product: Product;
      userId: string;
      quantity?: number;
      variants?: any;
    }) => cartService.addToCart(product, userId, quantity, variants),
    onSuccess: (data, variables) => {
      toast.success("Added to cart");
      queryClient.invalidateQueries({ queryKey: ["cart", variables.userId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add to cart");
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartItemId, userId }: { cartItemId: string; userId: string }) =>
      cartService.removeFromCart(cartItemId),
    onSuccess: (data, variables) => {
      toast.success("Removed from cart");
      queryClient.invalidateQueries({ queryKey: ["cart", variables.userId] });
    },
    onError: (error: any) => {
      console.error(error);
      toast.error("Failed to remove from cart");
    },
  });
};

export const useUpdateCartQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cartItemId,
      action,
    }: {
      cartItemId: string;
      action: "increase" | "decrease";
    }) =>
      action === "increase"
        ? cartService.increaseQuantity(cartItemId)
        : cartService.decreaseQuantity(cartItemId),
    onSuccess: (data, variables) => {
      // We need userId to invalidate properly, but it's not in the mutation arg directly unless we pass it.
      // Ideally we invalidate all 'cart' queries or pass userId. 
      // For now, let's just invalidate all cart queries which is safer but slightly less efficient.
       queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: any) => {
       console.error(error);
      toast.error("Failed to update quantity");
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => cartService.clearCart(userId),
    onSuccess: (data, userId) => {
      toast.success("Cart cleared");
      queryClient.invalidateQueries({ queryKey: ["cart", userId] });
    },
    onError: (error: any) => {
      console.error(error);
      toast.error("Failed to clear cart");
    },
  });
};
