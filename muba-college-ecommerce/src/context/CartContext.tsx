"use client";

import type React from "react";
import { createContext, useContext, useReducer, useEffect } from "react";
import type { Product } from "../services/productService";
import { cartService } from "../services/cartService";
import { useAuth } from "./AuthContext";

interface CartItem {
  product: Product;
  quantity: number;
  selectedVariants?: { [key: string]: string };
  addedAt: string;
  _id?: string; // Backend cart item ID
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  subtotal: number;
  savings: number;
  loading: boolean;
  syncing: boolean;
}

type CartAction =
  | {
      type: "ADD_ITEM";
      payload: {
        product: Product;
        quantity?: number;
        variants?: { [key: string]: string };
      };
    }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] }
  | {
      type: "UPDATE_VARIANTS";
      payload: { id: string; variants: { [key: string]: string } };
    }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SYNCING"; payload: boolean }
  | { type: "SYNC_SUCCESS"; payload: CartItem[] };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  subtotal: 0,
  savings: 0,
  loading: false,
  syncing: false,
};

const CART_STORAGE_KEY = "studentMarketplaceCart";
const CART_TIMESTAMP_KEY = "studentMarketplaceCartTimestamp";
const CART_EXPIRY_DAYS = 30;

const calculateTotals = (items: CartItem[]) => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const originalTotal = items.reduce(
    (sum, item) =>
      sum + (item.product.originalPrice || item.product.price) * item.quantity,
    0
  );

  const savings = originalTotal - subtotal;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    total: subtotal,
    savings,
    itemCount,
  };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_SYNCING":
      return { ...state, syncing: action.payload };

    case "ADD_ITEM": {
      const { product, quantity = 1, variants = {} } = action.payload;

      const variantKey =
        Object.keys(variants).length > 0 ? JSON.stringify(variants) : "default";

      const existingItem = state.items.find((item) => {
        const existingVariantKey =
          item.selectedVariants && Object.keys(item.selectedVariants).length > 0
            ? JSON.stringify(item.selectedVariants)
            : "default";
        return (
          item.product._id === product._id && existingVariantKey === variantKey
        );
      });

      let newItems;
      if (existingItem) {
        newItems = state.items.map((item) => {
          const existingVariantKey =
            item.selectedVariants &&
            Object.keys(item.selectedVariants).length > 0
              ? JSON.stringify(item.selectedVariants)
              : "default";
          return item.product._id === product._id &&
            existingVariantKey === variantKey
            ? { ...item, quantity: item.quantity + quantity }
            : item;
        });
      } else {
        newItems = [
          ...state.items,
          {
            product,
            quantity,
            selectedVariants: variants,
            addedAt: new Date().toISOString(),
          },
        ];
      }

      const totals = calculateTotals(newItems);
      return { ...state, items: newItems, ...totals };
    }

    case "REMOVE_ITEM": {
      const newItems = state.items.filter(
        (item) => item.product._id !== action.payload
      );
      const totals = calculateTotals(newItems);
      return { ...state, items: newItems, ...totals };
    }

    case "UPDATE_QUANTITY": {
      const newItems = state.items
        .map((item) =>
          item.product._id === action.payload.id
            ? { ...item, quantity: Math.max(0, action.payload.quantity) }
            : item
        )
        .filter((item) => item.quantity > 0);

      const totals = calculateTotals(newItems);
      return { ...state, items: newItems, ...totals };
    }

    case "UPDATE_VARIANTS": {
      const newItems = state.items.map((item) =>
        item.product._id === action.payload.id
          ? { ...item, selectedVariants: action.payload.variants }
          : item
      );

      const totals = calculateTotals(newItems);
      return { ...state, items: newItems, ...totals };
    }

    case "CLEAR_CART":
      return { ...initialState };

    case "LOAD_CART":
    case "SYNC_SUCCESS": {
      const totals = calculateTotals(action.payload);
      return {
        ...state,
        items: action.payload,
        ...totals,
        loading: false,
        syncing: false,
      };
    }

    default:
      return state;
  }
};

// Helper functions for localStorage management
const saveToLocalStorage = (items: CartItem[]) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    localStorage.setItem(CART_TIMESTAMP_KEY, new Date().toISOString());
  } catch (error) {
    console.error("Error saving cart to localStorage:", error);
  }
};

const loadFromLocalStorage = (): CartItem[] | null => {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    const timestamp = localStorage.getItem(CART_TIMESTAMP_KEY);

    if (!savedCart || !timestamp) {
      return null;
    }

    // Check if cart has expired (30 days)
    const savedDate = new Date(timestamp);
    const now = new Date();
    const daysDifference =
      (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDifference > CART_EXPIRY_DAYS) {
      // Cart expired, clear it
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(CART_TIMESTAMP_KEY);
      console.log("Cart expired after 30 days");
      return null;
    }

    const cartItems = JSON.parse(savedCart);
    return Array.isArray(cartItems) ? cartItems : null;
  } catch (error) {
    console.error("Error loading cart from localStorage:", error);
    return null;
  }
};

const clearLocalStorage = () => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CART_TIMESTAMP_KEY);
  } catch (error) {
    console.error("Error clearing cart from localStorage:", error);
  }
};

interface CartContextType {
  state: CartState;
  addItem: (
    product: Product,
    quantity?: number,
    variants?: { [key: string]: string }
  ) => Promise<void>;
  alreadyInCart: (productId: string) => Promise<boolean>;

  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  updateVariants: (
    productId: string,
    variants: { [key: string]: string }
  ) => void;
  clearCart: () => Promise<void>;
  syncCart: () => Promise<void>;
  getItemCount: () => number;
  getTotalSavings: () => number;
  isItemInCart: (
    productId: string,
    variants?: { [key: string]: string }
  ) => boolean;
  getItemCountInCart: (
    productId: string,
    variants?: { [key: string]: string }
  ) => number;
  getItemQuantity: (
    productId: string,
    variants?: { [key: string]: string }
  ) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  // const [hasLoadedBackendCart, setHasLoadedBackendCart] = useState(false);

  // Load cart on mount
  useEffect(() => {
    const initializeCart = async () => {
      dispatch({ type: "SET_LOADING", payload: true });

      // First, load from localStorage
      const localCart = loadFromLocalStorage();

      if (isAuthenticated && user) {
        try {
          // Fetch backend cart
          const backendResponse = await cartService.getCart(user._id);
          const backendCart =
            backendResponse.data || backendResponse.cart || [];

          // Convert backend cart items to CartItem format
          const backendCartItems: CartItem[] = backendCart.map((item: any) => ({
            product: {
              _id: item.product_id,
              name: item.name,
              title: item.name,
              img: item.img,
              images: [item.img],
              description: item.description,
              category: item.category,
              price: item.price,
              store: item.store,
            },
            quantity: item.quantity,
            selectedVariants: item.variants || {},
            addedAt: item.createdAt || new Date().toISOString(),
            _id: item._id,
          }));

          // Merge localStorage cart with backend cart
          if (localCart && localCart.length > 0) {
            // Sync localStorage items to backend
            for (const localItem of localCart) {
              const existsInBackend = backendCartItems.some(
                (backendItem) =>
                  backendItem.product._id === localItem.product._id
              );

              if (!existsInBackend) {
                try {
                  await cartService.addToCart(
                    localItem.product,
                    user._id,
                    localItem.quantity,
                    localItem.selectedVariants
                  );
                  backendCartItems.push(localItem);
                } catch (error) {
                  console.error(
                    "Error syncing local cart item to backend:",
                    error
                  );
                }
              }
            }
          }

          // Load merged cart
          dispatch({ type: "LOAD_CART", payload: backendCartItems });
          // setHasLoadedBackendCart(true);

          // Update localStorage with merged cart
          saveToLocalStorage(backendCartItems);
        } catch (error) {
          console.error("Error fetching backend cart:", error);
          // If backend fails, use localStorage
          if (localCart) {
            dispatch({ type: "LOAD_CART", payload: localCart });
          }
        }
      } else {
        // Not logged in, use localStorage only
        if (localCart) {
          dispatch({ type: "LOAD_CART", payload: localCart });
        }
      }

      dispatch({ type: "SET_LOADING", payload: false });
    };

    initializeCart();
  }, [isAuthenticated, user]);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    if (state.items.length >= 0 && !state.loading) {
      saveToLocalStorage(state.items);
    }
  }, [state.items, state.loading]);

  const syncCart = async () => {
    if (!user || !isAuthenticated) return;

    try {
      dispatch({ type: "SET_SYNCING", payload: true });

      // Sync each item to backend
      for (const item of state.items) {
        if (!item._id) {
          // Only sync items that aren't already in backend
          try {
            await cartService.addToCart(
              item.product,
              user._id,
              item.quantity,
              item.selectedVariants
            );
          } catch (error) {
            console.error("Error syncing item to backend:", error);
          }
        }
      }

      // Fetch updated cart from backend
      const backendResponse = await cartService.getCart(user._id);
      const backendCart = backendResponse.data || backendResponse.cart || [];

      const backendCartItems: CartItem[] = backendCart.map((item: any) => ({
        product: {
          _id: item.product_id,
          name: item.name,
          title: item.name,
          img: item.img,
          images: [item.img],
          description: item.description,
          category: item.category,
          price: item.price,
          store: item.store,
        },
        quantity: item.quantity,
        selectedVariants: item.variants || {},
        addedAt: item.createdAt || new Date().toISOString(),
        _id: item._id,
      }));

      dispatch({ type: "SYNC_SUCCESS", payload: backendCartItems });
      saveToLocalStorage(backendCartItems);
    } catch (error) {
      console.error("Error syncing cart:", error);
    } finally {
      dispatch({ type: "SET_SYNCING", payload: false });
    }
  };

  const addItem = async (
    product: Product,
    quantity = 1,
    variants?: { [key: string]: string }
  ) => {
    // Add to local state immediately
    dispatch({ type: "ADD_ITEM", payload: { product, quantity, variants } });

    // Sync to backend if user is logged in
    if (isAuthenticated && user) {
      try {
        const response = await cartService.addToCart(
          product,
          user._id,
          quantity,
          variants
        );
        // Update the item with backend ID if needed
        console.log("Added to backend cart:", response);
      } catch (error) {
        console.error("Error adding to backend cart:", error);
        // Still keep in localStorage even if backend fails
      }
    }
  };

  const alreadyInCart = async (productId: string): Promise<boolean> => {
    const item = state.items.find((i) => i.product._id === productId);
    return !!item;
  };

  const removeItem = async (productId: string) => {
    const item = state.items.find((i) => i.product._id === productId);

    // Remove from local state immediately
    dispatch({ type: "REMOVE_ITEM", payload: productId });

    // Sync to backend if user is logged in
    if (isAuthenticated && user && item?._id) {
      try {
        await cartService.removeFromCart(item._id);
      } catch (error) {
        console.error("Error removing from backend cart:", error);
      }
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    const currentItem = state.items.find((i) => i.product._id === productId);
    const currentQuantity = currentItem?.quantity || 0;

    // Update local state immediately
    dispatch({ type: "UPDATE_QUANTITY", payload: { id: productId, quantity } });

    // Sync to backend if user is logged in
    if (isAuthenticated && user && currentItem?._id) {
      try {
        const difference = quantity - currentQuantity;

        if (difference > 0) {
          // Increase quantity multiple times if needed
          for (let i = 0; i < difference; i++) {
            await cartService.increaseQuantity(currentItem._id);
          }
        } else if (difference < 0) {
          // Decrease quantity multiple times if needed
          for (let i = 0; i < Math.abs(difference); i++) {
            await cartService.decreaseQuantity(currentItem._id);
          }
        }
      } catch (error) {
        console.error("Error updating quantity:", error);
      }
    }
  };

  const updateVariants = (
    productId: string,
    variants: { [key: string]: string }
  ) => {
    dispatch({ type: "UPDATE_VARIANTS", payload: { id: productId, variants } });
  };

  const clearCart = async () => {
    // Clear local state immediately
    dispatch({ type: "CLEAR_CART" });

    // Clear localStorage
    clearLocalStorage();

    // Sync to backend if user is logged in
    if (isAuthenticated && user) {
      try {
        await cartService.clearCart(user._id);
      } catch (error) {
        console.error("Error clearing backend cart:", error);
      }
    }
  };

  const getItemCount = () => state.itemCount;

  const getTotalSavings = () => state.savings;

  const isItemInCart = (
    productId: string,
    variants?: { [key: string]: string }
  ) => {
    const variantKey =
      variants && Object.keys(variants).length > 0
        ? JSON.stringify(variants)
        : "default";

    return state.items.some((item) => {
      const existingVariantKey =
        item.selectedVariants && Object.keys(item.selectedVariants).length > 0
          ? JSON.stringify(item.selectedVariants)
          : "default";
      return (
        item.product._id === productId && existingVariantKey === variantKey
      );
    });
  };

  const getItemCountInCart = (
    productId: string,
    variants?: { [key: string]: string }
  ) => {
    const variantKey =
      variants && Object.keys(variants).length > 0
        ? JSON.stringify(variants)
        : "default";

    return state.items.reduce((count, item) => {
      const existingVariantKey =
        item.selectedVariants && Object.keys(item.selectedVariants).length > 0
          ? JSON.stringify(item.selectedVariants)
          : "default";

      if (item.product._id === productId && existingVariantKey === variantKey) {
        return count + (item.quantity ?? 1);
      }
      return count;
    }, 0);
  };

  const getItemQuantity = (
    productId: string,
    variants?: { [key: string]: string }
  ) => {
    const variantKey =
      variants && Object.keys(variants).length > 0
        ? JSON.stringify(variants)
        : "default";

    const item = state.items.find((item) => {
      const existingVariantKey =
        item.selectedVariants && Object.keys(item.selectedVariants).length > 0
          ? JSON.stringify(item.selectedVariants)
          : "default";
      return (
        item.product._id === productId && existingVariantKey === variantKey
      );
    });

    return item ? item.quantity : 0;
  };

  const value = {
    state,
    addItem,
    removeItem,
    alreadyInCart,
    updateQuantity,
    updateVariants,
    clearCart,
    syncCart,
    getItemCount,
    getTotalSavings,
    isItemInCart,
    getItemCountInCart,
    getItemQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
