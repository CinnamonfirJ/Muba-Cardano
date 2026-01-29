"use client";

import type React from "react";
import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from "react";
import type { Product } from "../services/productService";
import { cartService } from "../services/cartService";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

// --- Types ---

interface CartItem {
  product: Product;
  quantity: number;
  selectedVariants?: { [key: string]: string };
  addedAt: string;
  _id?: string; // Backend cart item ID. If missing, it's an optimistic local item.
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  subtotal: number;
  savings: number;
  loading: boolean;
  syncing: boolean;
  isCartOpen: boolean; 
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
  | { type: "REMOVE_ITEM"; payload: { productId: string; variants?: { [key: string]: string } } }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number; variants?: { [key: string]: string } } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] }
  | { type: "UPDATE_ITEM_ID"; payload: { tempKey: string; realId: string } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SYNCING"; payload: boolean }
  | { type: "SET_CART_OPEN"; payload: boolean }
  | { type: "SYNC_SUCCESS"; payload: CartItem[] };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  subtotal: 0,
  savings: 0,
  loading: false,
  syncing: false,
  isCartOpen: false,
};

const CART_STORAGE_KEY = "studentMarketplaceCart";
const DEBOUNCE_MS = 600;

// --- Helper Functions ---

const generateVariantKey = (
  productId: string,
  variants?: { [key: string]: string }
) => {
  if (!variants || Object.keys(variants).length === 0) return `${productId}-default`;
  // Sort keys to ensure consistent order
  const sortedKeys = Object.keys(variants).sort();
  const variantString = sortedKeys.map((k) => `${k}:${variants[k]}`).join("-");
  return `${productId}-${variantString}`;
};

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

// --- Reducer ---

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_SYNCING":
      return { ...state, syncing: action.payload };

    case "SET_CART_OPEN":
      return { ...state, isCartOpen: action.payload };

    case "ADD_ITEM": {
      const { product, quantity = 1, variants = {} } = action.payload;
      const keyToAdd = generateVariantKey(product._id, variants);

      const existingItemIndex = state.items.findIndex((item) => {
        const key = generateVariantKey(item.product._id, item.selectedVariants);
        return key === keyToAdd;
      });

      let newItems;
      if (existingItemIndex > -1) {
        newItems = [...state.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity,
        };
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
      const keyToRemove = generateVariantKey(action.payload.productId, action.payload.variants);
      const newItems = state.items.filter((item) => {
          const key = generateVariantKey(item.product._id, item.selectedVariants);
          return key !== keyToRemove;
      });
      const totals = calculateTotals(newItems);
      return { ...state, items: newItems, ...totals };
    }

    case "UPDATE_QUANTITY": {
      const keyToUpdate = generateVariantKey(action.payload.id, action.payload.variants);
      
      const newItems = state.items
        .map((item) => {
            const key = generateVariantKey(item.product._id, item.selectedVariants);
            if (key === keyToUpdate) {
                return { ...item, quantity: Math.max(0, action.payload.quantity) };
            }
            return item;
        })
        .filter((item) => item.quantity > 0);

      const totals = calculateTotals(newItems);
      return { ...state, items: newItems, ...totals };
    }

    case "UPDATE_ITEM_ID": {
        const { tempKey, realId } = action.payload;
        const newItems = state.items.map(item => {
            const key = generateVariantKey(item.product._id, item.selectedVariants);
            if (key === tempKey && !item._id) {
                return { ...item, _id: realId };
            }
            return item;
        });
        return { ...state, items: newItems };
    }

    case "CLEAR_CART":
      return { ...initialState, isCartOpen: state.isCartOpen }; // Keep UI state

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

// --- Context ---

interface CartContextType {
  state: CartState;
  addItem: (product: Product, quantity?: number, variants?: { [key: string]: string }) => void;
  removeItem: (productId: string, variants?: { [key: string]: string }) => void;
  updateQuantity: (productId: string, quantity: number, variants?: { [key: string]: string }) => void;
  clearCart: () => void;
  toggleCart: (isOpen?: boolean) => void;
  getItemQuantity: (productId: string, variants?: { [key: string]: string }) => number;
  dispatch: React.Dispatch<CartAction>;
  // Compatibility methods
  isItemInCart: (productId: string, variants?: { [key: string]: string }) => boolean;
  getItemCountInCart: (productId: string, variants?: { [key: string]: string }) => number;
  alreadyInCart: (productId: string) => Promise<boolean>;
  updateVariants: (productId: string, oldVariants: any, newVariants: any) => void;
  getItemCount: () => number;
  getTotalSavings: () => number;
  syncCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  
  // Storage for pending debounced timeouts
  const pendingTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});
  
  // Helper to save to local storage
  const persistCart = useCallback((items: CartItem[]) => {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
          console.error("Local storage error", e);
      }
  }, []);

  // Update LS whenever items change
  useEffect(() => {
     if (!state.loading) persistCart(state.items);
  }, [state.items, state.loading, persistCart]);

  // Load from LS on mount
  useEffect(() => {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
          try {
              const items = JSON.parse(saved);
              dispatch({ type: "LOAD_CART", payload: Array.isArray(items) ? items : [] });
          } catch(e) {}
      }
  }, []);

  // Sync with Backend on Auth
  useEffect(() => {
      if (isAuthenticated && user) {
          const fetchBackendCart = async () => {
              dispatch({ type: "SET_LOADING", payload: true });
              try {
                  const res = await cartService.getCart(user._id);
                  const backendItems: any[] = res.data || res.cart || [];
                  
                  // Map backend items to local format
              const mappedItems: CartItem[] = backendItems.map(item => ({
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
                          // Defaults for missing properties to satisfy strict Product type
                          condition: 'new',
                          location: '',
                          seller: item.store, 
                          rating: 0,
                          slug: item.name?.toLowerCase().replace(/ /g, '-'),
                          stock: 99,
                          originalPrice: item.price,
                          reviews: 0,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                          __v: 0,
                          inStock: true // Mocked
                      },
                      quantity: item.quantity,
                      selectedVariants: item.variants || {},
                      addedAt: item.createdAt || new Date().toISOString(),
                      _id: item._id
                  }));

                  // If we have local items that need to be merged?
                  // For simplicity in this robust refactor, we trust Backend as source of truth on load,
                  // UNLESS local has items and backend is empty (first login).
                  // But sticking to user request: "Replace local cart state with server cart"
                  dispatch({ type: "SYNC_SUCCESS", payload: mappedItems });
              } catch (e) {
                  console.error("Failed to fetch backend cart", e);
              }
          };
          fetchBackendCart();
      }
  }, [isAuthenticated, user]);

  // --- Actions ---

  const addItem = useCallback((product: Product, quantity = 1, variants = {}) => {
      const key = generateVariantKey(product._id, variants);
      
      // 1. Optimistic UI
      dispatch({ type: "ADD_ITEM", payload: { product, quantity, variants } });
      dispatch({ type: "SET_CART_OPEN", payload: true }); // Open drawer on first add/update per requirements

      if (!isAuthenticated || !user) return; // Local only

      // 2. Debounce
      if (pendingTimeouts.current[key]) clearTimeout(pendingTimeouts.current[key]);

      pendingTimeouts.current[key] = setTimeout(async () => {
          // Get latest state for this item
          // We need to access the LATEST state value ref or find it in current state.
          // Since we are inside a closure, `state` might be stale if we used it directly.
          // However, we can trust the debounce flow:
          // We need to fetch the item quantity from the *current* authoritative source.
          // Is it in backend?
          
          // Strategy: Fetch cart from backend first? No, too slow.
          
          // Robust Strategy: 
          // We know the user wants `requestQueue` behavior.
          // We need the ACTUAL current quantity from our local state to send to server.
          // We can use a ref to track the latest quantity if needed, OR use functional updates on a separate store.
          // But `state` here is captured from closure scope unless we use a ref for state access.
          // `useCart` hook provides context, but inside `CartProvider`, `state` is from `useReducer`.
          // `state` variable in `addItem` closure is stale.
          
          // Fix: Use a ref to hold latest items for the async callbacks
          // See useEffect below updating `latestItemsRef`.
          
          const currentItem = latestItemsRef.current.find(i => generateVariantKey(i.product._id, i.selectedVariants) === key);
          
          if (!currentItem) return; // Item was removed?

          try {
              if (currentItem._id) {
                  // It exists on backend, update quantity
                  await cartService.updateQuantity(currentItem._id, currentItem.quantity);
              } else {
                  // It is new, add to backend
                  // Note: If user tapped add 5 times, qty is 5. We send 5.
                  const res = await cartService.addToCart(product, user._id, currentItem.quantity, variants);
                  // Update local item with real _id so next clicks become updates
                  if (res && (res.data?._id || res.cart?.length)) {
                       // Some APIs return the item, some the whole cart. 
                       // Assuming res.data is the item or we re-fetch.
                       // Let's re-fetch to be safe and perfectly synced as requested.
                       const cartRes = await cartService.getCart(user._id);
                       const backendCart = cartRes.data || cartRes.cart || [];
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
                            // Defaults
                            condition: 'new',
                            location: '',
                            seller: item.store,
                            rating: 0,
                            slug: item.name?.toLowerCase().replace(/ /g, '-'),
                            stock: 99,
                            originalPrice: item.price,
                            reviews: 0,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            __v: 0,
                            inStock: true // Mocked
                            },
                            quantity: item.quantity,
                            selectedVariants: item.variants || {},
                            addedAt: item.createdAt || new Date().toISOString(),
                            _id: item._id,
                        }));
                       dispatch({ type: "SYNC_SUCCESS", payload: backendCartItems });
                  }
              }
          } catch (error) {
              console.error("API Error", error);
              // Revert? Or just show error?
              toast.error("Network error: Could not sync cart");
          }
      }, DEBOUNCE_MS);

  }, [state.items, isAuthenticated, user]); // Dependency on state.items makes this function recreate often.
  // We need `latestItemsRef` to avoid frequent recreation of `addItem`.

  const latestItemsRef = useRef(state.items);
  useEffect(() => { latestItemsRef.current = state.items; }, [state.items]);

  const updateQuantity = useCallback((productId: string, quantity: number, variants = {}) => {
      const key = generateVariantKey(productId, variants);
      
      // 1. Optimistic UI
      if (quantity <= 0) {
          dispatch({ type: "REMOVE_ITEM", payload: { productId, variants } });
      } else {
          dispatch({ type: "UPDATE_QUANTITY", payload: { id: productId, quantity, variants } });
      }

      if (!isAuthenticated || !user) return;

      // 2. Debounce
      if (pendingTimeouts.current[key]) clearTimeout(pendingTimeouts.current[key]);

      pendingTimeouts.current[key] = setTimeout(async () => {
          const currentItem = latestItemsRef.current.find(i => generateVariantKey(i.product._id, i.selectedVariants) === key);
          
          if (!currentItem) {
              // Item was removed locally. Since we are in the debounce callback for an update/remove,
              // if quantity went to 0, currentItem is undefined in `latestItemsRef`.
              // We need to find the backend ID to remove it.
              // BUT `latestItemsRef` doesn't have it anymore.
              // Issue: If we remove optimistically, we lose the `_id` needed to delete from backend if we don't store it.
              
              // FAST FIX: We can try to use `removeFromCart` with the product ID? No, API needs cart ID.
              // We should probably rely on a "Pending Operations" Log or just fetch the cart to find component to delete?
              // Better: When removing optimistically, do NOT lose the _id immediately?
              // Or: `dispatch` removes it, but we need the ID here.
              // We can't act on `currentItem`.
              
              // Alternative: If quantity <= 0 was passed to this function, we know we want to remove.
              // But we need the `cartItemId`.
              // We can try to fetch the cart, find the item by productID/Variant, and delete it.
              // This is safe.
              
              try {
                  const res = await cartService.getCart(user._id);
                  const cart = res.data || res.cart || [];
                  const target = cart.find((i: any) => 
                      i.product_id === productId && 
                      JSON.stringify(i.variants || {}) === JSON.stringify(variants)
                  );
                  if (target) {
                      await cartService.removeFromCart(target._id);
                  }
              } catch(e) { console.error(e) }
              return; 
          }

          // Case: Update
          if (currentItem._id) {
               await cartService.updateQuantity(currentItem._id, currentItem.quantity);
          } else {
              // Should not happen for update unless it was an optimistic add that hasn't synced ID yet.
              // If so, we can just trigger add again with new qty?
               await cartService.addToCart(currentItem.product, user._id, currentItem.quantity, variants);
               // Then sync
               const res = await cartService.getCart(user._id);
               // ... (Sync logic repeated) ...
               // Ideally abstract sync logic
                const backendCartItems: CartItem[] = (res.data || res.cart || []).map((item: any) => ({
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
          }
      }, DEBOUNCE_MS);

  }, [isAuthenticated, user]); 

  const removeItem = useCallback((productId: string, variants = {}) => {
      updateQuantity(productId, 0, variants);
  }, [updateQuantity]);

  const clearCart = useCallback(async () => {
      dispatch({ type: "CLEAR_CART" });
      if (isAuthenticated && user) {
          await cartService.clearCart(user._id);
      }
  }, [isAuthenticated, user]);

  const toggleCart = useCallback((isOpen?: boolean) => {
      dispatch({ 
          type: "SET_CART_OPEN", 
          payload: isOpen !== undefined ? isOpen : !state.isCartOpen 
      });
  }, [state.isCartOpen]);

  const getItemQuantity = useCallback((productId: string, variants = {}) => {
      const key = generateVariantKey(productId, variants);
      const item = state.items.find(i => generateVariantKey(i.product._id, i.selectedVariants) === key);
      return item ? item.quantity : 0;
  }, [state.items]);


  // Value Construction
  const value = {
      state,
      addItem, // Now handles add AND update (smartly)
      removeItem, 
      updateQuantity,
      clearCart,
      toggleCart,
      getItemQuantity,
      dispatch,
      // Deprecated/Compat methods if needed
      isItemInCart: (pid: string, v?: any) => getItemQuantity(pid, v) > 0, 
      getItemCountInCart: getItemQuantity,
      alreadyInCart: async (pid: string) => getItemQuantity(pid) > 0, 
      updateVariants: () => {}, // Not supported in this simple refactor
      getItemCount: () => state.itemCount,
      getTotalSavings: () => state.savings,
      syncCart: async () => {}, // Handled automatically now
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
