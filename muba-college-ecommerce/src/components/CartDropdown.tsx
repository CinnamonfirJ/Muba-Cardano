import React from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Package,
  Loader2,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";

export const CartDropdown = () => {
  const { state, removeItem, updateQuantity } = useCart();
  const [isOpen, setIsOpen] = React.useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleQuantityChange = async (
    productId: string,
    currentQty: number,
    change: number
  ) => {
    const newQty = currentQty + change;
    if (newQty > 0) {
      await updateQuantity(productId, newQty);
    }
  };

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='relative p-2 text-gray-700 hover:text-[#3bb85e] transition-colors'
      >
        <ShoppingCart className='w-6 h-6' />
        {state.itemCount > 0 && (
          <span className='-top-1 -right-1 absolute flex justify-center items-center bg-[#3bb85e] rounded-full w-5 h-5 text-white text-xs'>
            {state.itemCount}
          </span>
        )}
        {state.syncing && (
          <span className='-right-1 -bottom-1 absolute flex justify-center items-center bg-blue-500 rounded-full w-4 h-4 text-white'>
            <Loader2 className='w-3 h-3 animate-spin' />
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className='z-40 fixed inset-0'
            onClick={() => setIsOpen(false)}
          />

          <div className='right-0 z-50 absolute flex flex-col bg-white shadow-xl mt-2 border border-gray-200 rounded-lg w-96 max-h-[450px]'>
            <div className='p-4 border-gray-200 border-b'>
              <div className='flex justify-between items-center'>
                <h3 className='font-semibold text-lg'>Shopping Cart</h3>
                <span className='text-gray-600 text-sm'>
                  {state.itemCount} {state.itemCount === 1 ? "item" : "items"}
                </span>
              </div>
              {state.syncing && (
                <p className='flex items-center gap-1 mt-1 text-blue-600 text-xs'>
                  <Loader2 className='w-3 h-3 animate-spin' />
                  Syncing...
                </p>
              )}
            </div>

            <div className='flex-1 overflow-y-auto'>
              {state.loading ? (
                <div className='p-8 text-center'>
                  <Loader2 className='mx-auto mb-4 w-12 h-12 text-[#3bb85e] animate-spin' />
                  <p className='text-gray-500'>Loading cart...</p>
                </div>
              ) : state.items.length === 0 ? (
                <div className='p-8 text-center'>
                  <Package className='mx-auto mb-4 w-16 h-16 text-gray-300' />
                  <p className='mb-4 text-gray-500'>Your cart is empty</p>
                  <Link href='/marketplace' onClick={() => setIsOpen(false)}>
                    <Button className='bg-[#3bb85e] hover:bg-[#2d8f4a]'>
                      Browse Products
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className='divide-y divide-gray-200'>
                  {state.items.map((item) => (
                    <div
                      key={`${item.product._id}-${JSON.stringify(item.selectedVariants)}`}
                      className='hover:bg-gray-50 p-4'
                    >
                      <div className='flex gap-3'>
                        <img
                          src={item.product.images?.[0] || "/placeholder.svg"}
                          alt={item.product.title || item.product.title}
                          className='rounded w-16 h-16 object-cover'
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg?height=64&width=64";
                          }}
                        />

                        <div className='flex-1 min-w-0'>
                          <h4 className='font-medium text-gray-900 text-sm truncate'>
                            {item.product.title}
                          </h4>
                          <p className='mt-1 font-semibold text-[#3bb85e] text-sm'>
                            {formatCurrency(item.product.price)}
                          </p>

                          {item.selectedVariants &&
                            Object.keys(item.selectedVariants).length > 0 && (
                              <p className='mt-1 text-gray-500 text-xs'>
                                {Object.entries(item.selectedVariants)
                                  .map(([key, value]) => `${key}: ${value}`)
                                  .join(", ")}
                              </p>
                            )}

                          <div className='flex items-center gap-2 mt-2'>
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  item.product._id,
                                  item.quantity,
                                  -1
                                )
                              }
                              className='hover:bg-gray-200 disabled:opacity-50 p-1 rounded disabled:cursor-not-allowed'
                              disabled={item.quantity <= 1}
                            >
                              <Minus className='w-3 h-3' />
                            </button>
                            <span className='px-2 font-medium text-sm'>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  item.product._id,
                                  item.quantity,
                                  1
                                )
                              }
                              className='hover:bg-gray-200 p-1 rounded'
                            >
                              <Plus className='w-3 h-3' />
                            </button>
                            <button
                              onClick={() => removeItem(item.product._id)}
                              className='hover:bg-red-50 ml-auto p-1 rounded text-red-500'
                            >
                              <Trash2 className='w-4 h-4' />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {state.items.length > 0 && !state.loading && (
              <div className='bg-gray-50 p-4 border-gray-200 border-t'>
                <div className='flex justify-between items-center mb-4'>
                  <span className='font-semibold'>Subtotal:</span>
                  <span className='font-bold text-[#3bb85e] text-xl'>
                    {formatCurrency(state.subtotal)}
                  </span>
                </div>

                {state.savings > 0 && (
                  <p className='mb-4 text-green-600 text-sm'>
                    You're saving {formatCurrency(state.savings)}!
                  </p>
                )}

                <Link href='/checkout' onClick={() => setIsOpen(false)}>
                  <Button className='bg-[#3bb85e] hover:bg-[#2d8f4a] w-full'>
                    View Cart
                    <ArrowRight className='ml-2 w-4 h-4' />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
