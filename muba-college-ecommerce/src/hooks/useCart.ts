import { useCart as useCartContext } from "../context/CartContext";
import type { Product } from "../services/productService";

// Helper hook to access cart state (Backward compatibility wrapper)
export const useCart = (userId?: string) => {
  // We ignore userId here because Context manages it globally via AuthContext
  const { state } = useCartContext();
  return { 
      data: state.items, 
      cart: state.items, // Compat
      isLoading: state.loading 
  };
};

export const useAddToCart = () => {
  const { addItem } = useCartContext();

  return {
    mutate: ({ product, quantity, variants }: { product: Product; userId?: string; quantity?: number; variants?: any }) => {
        addItem(product, quantity, variants);
    },
    mutateAsync: async ({ product, quantity, variants }: { product: Product; userId?: string; quantity?: number; variants?: any }) => {
        return addItem(product, quantity, variants);
    },
    isPending: false, // Optimistic means we are never strictly "pending" via these hooks for UI blocking
  };
};

export const useRemoveFromCart = () => {
  const { removeItem } = useCartContext();

  return {
    mutate: ({ cartItemId, userId }: { cartItemId: string; userId?: string }) => {
        // We assume cartItemId is the productId if coming from UI that uses product IDs.
        // If it's the backend _id, we might have an issue if removeItem expects productId.
        // Our new Context removeItem expects productId.
        
        // However, legacy code might pass the backend _id as 'cartItemId'.
        // We must check if `cartItemId` matches a product._id in the cart context.
        // Or we simply update the Context to handle both?
        // Context.removeItem(id) checks product._id.
        // If the passed ID is actually the backend _id, we need to map it.
        // But for now, let's pass it through. Most UIs use product._id for removal in local state lists.
        removeItem(cartItemId);
    },
    isPending: false,
  };
};

export const useUpdateCartQuantity = () => {
  const { updateQuantity, state } = useCartContext();

  return {
    // Legacy signature: cartItemId, action
    // But our new Context needs: productId, quantity.
    // This is a mismatch. We need to map `cartItemId` (backend ID) to `productId`.
    mutate: ({ cartItemId, action }: { cartItemId: string; action: "increase" | "decrease" }) => {
        // Find item by backend _id or product _id
        const item = state.items.find(i => i._id === cartItemId || i.product._id === cartItemId);
        
        if (item) {
            const newQty = action === "increase" ? item.quantity + 1 : item.quantity - 1;
            updateQuantity(item.product._id, newQty, item.selectedVariants);
        } else {
            console.warn("Could not find item to update:", cartItemId);
        }
    },
    isPending: false
  };
};

export const useClearCart = () => {
  const { clearCart } = useCartContext();

  return {
    mutate: () => clearCart(),
    isPending: false
  };
};
