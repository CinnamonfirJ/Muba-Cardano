import api from "./api";
import type { Product } from "./productService";

export const cartService = {
  // Add product to cart
  async addToCart(
    product: Product,
    userId: string,
    quantity: number = 1,
    variants?: any
  ) {
    const response = await api.post("/api/v1/cart/", {
      _id: product._id,
      user_id: userId,
      name: product.title,
      img: product.images[0],
      description: product.description,
      category: Array.isArray(product.category)
        ? product.category[0]
        : product.category,
      quantity,
      price: product.price,
      store: product.store?._id || product.store,
      variants,
    });
    return response.data;
  },

  // Remove product from cart
  async removeFromCart(cartItemId: string) {
    const response = await api.post(`/api/v1/cart/${cartItemId}`, {
      _id: cartItemId,
    });
    return response.data;
  },

  // Remove all products from cart
  async deleteAllFromCart(user_id: string) {
    try {
      const response = await api.delete(`/api/v1/cart/clear`, {
        data: { user_id },
      });
      return response.data;
    } catch (error: any) {
      console.error("Delete All From Cart Error:", error);
      throw error.response?.data || { message: "Failed to clear cart" };
    }
  },

  // Decrease product quantity
  async decreaseQuantity(cartItemId: string) {
    const response = await api.patch(`/api/v1/cart/${cartItemId}/decrease`, {
      _id: cartItemId,
    });
    return response.data;
  },

  // Increase product quantity
  async increaseQuantity(cartItemId: string) {
    const response = await api.patch(`/api/v1/cart/${cartItemId}/increase`, {
      _id: cartItemId,
    });
    return response.data;
  },

  // Update product quantity (Direct Set)
  async updateQuantity(cartItemId: string, quantity: number) {
    const response = await api.patch(`/api/v1/cart/update-quantity`, {
      _id: cartItemId,
      quantity,
    });
    return response.data;
  },

  // Get user's cart
  async getCart(userId: string) {
    const response = await api.get(`/api/v1/cart/${userId}`);
    return response.data;
  },

  // Clear cart
  async clearCart(userId: string) {
    const response = await api.delete(`/api/v1/cart/user/${userId}`);
    return response.data;
  },
};
