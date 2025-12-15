"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  MapPin,
  CreditCard,
  Truck,
  Shield,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import paymentService from "@/services/paymentService";
import ExpandableTitle from "@/components/ExpandableTitle";

const CheckoutPage = () => {
  const { state: cartState, updateQuantity, removeItem, syncCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<
    "cart" | "shipping" | "payment" | "confirmation"
  >("cart");

  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
    email: "", // Changed from matric_number to email
    deliveryMethod: "school_post", // Set default to match Select value
    specialInstructions: "",
  });

  // Sync cart and initialize user info on mount
  useEffect(() => {
    syncCart();

    if (user) {
      setShippingInfo((prev) => ({
        ...prev,
        fullName: prev.fullName || `${user.firstname} ${user.lastname}`,
        phone: prev.phone || "", // user model doesn't seem to have phone?
        email: prev.email || user.email || "", // Changed to user.email
      }));
    }
  }, [user]);

  const deliveryFee = cartState.total > 10000 ? 0 : 500;
  const serviceFee = Math.round(cartState.total * 0.02);
  const finalTotal = cartState.total + deliveryFee + serviceFee;

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !shippingInfo.fullName ||
      !shippingInfo.phone ||
      !shippingInfo.address ||
      !shippingInfo.deliveryMethod
    ) {
      toast.error("Please fill in all required shipping information");
      return;
    }

      // NOTE: User requested removal of time restriction
    
    setStep("payment");
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // 🧩 Build metadata — send all important info to Paystack
      // const metadata = {
      //   cartItems: cartState.items.map((item) => ({
      //     id: item._id,
      //     name: item.product.title,
      //     price: item.product.price,
      //     quantity: item.quantity,
      //   })),
      //   user_id: user?._id,
      //   shippingInfo,
      //   total: finalTotal,
      // };

      // 🪙 Initialize payment
      const paymentData = {
        email: user?.email || "",
        amount: finalTotal,
        metadata: {
          userId: user?._id,
          deliveryMethod: shippingInfo.deliveryMethod, // Pass selected delivery method
          shippingInfo, // Pass full shipping info for reference
        },
      };

      const initResponse = await paymentService.initializePayment(paymentData);

      // 🧭 Redirect user to Paystack checkout page
      if (initResponse?.authorization_url) {
        window.location.href = initResponse.authorization_url;
      } else {
        throw new Error("No authorization URL received from payment gateway");
      }

      // 🧾 Optionally store temporary order details before redirecting
      localStorage.setItem(
        "pendingOrder",
        JSON.stringify({
          items: cartState.items,
          shipping: shippingInfo,
          amount: finalTotal,
          reference: initResponse.tx.reference,
        })
      );
    } catch (error: any) {
      console.error("Payment initialization failed:", error);
      toast.error(error.message || "Failed to initialize payment");
      setIsProcessing(false);
    }
  };

  if (cartState.items.length === 0 && step !== "confirmation") {
    // ... (rest of empty cart logic)
    return (
      <div className='flex justify-center items-center bg-gray-50 min-h-screen'>
        <div className='text-center'>
          <ShoppingCart className='mx-auto mb-4 w-16 h-16 text-gray-400' />
          <h2 className='mb-2 font-bold text-gray-900 text-2xl'>
            Your cart is empty
          </h2>
          <p className='mb-6 text-gray-600'>
            Add some products to your cart to continue shopping.
          </p>
          <Button
            onClick={() => router.push("/marketplace")}
            className='bg-[#3bb85e] hover:bg-[#457753]'
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  if (step === "confirmation") {
    return (
      <div className='flex justify-center items-center bg-gray-50 min-h-screen'>
        <Card className='w-full max-w-md'>
          <CardContent className='p-8 text-center'>
            <div className='flex justify-center items-center bg-green-100 mx-auto mb-4 p-4 rounded-full w-20 h-20'>
              <CheckCircle className='w-10 h-10 text-green-600' />
            </div>
            <h2 className='mb-2 font-bold text-gray-900 text-2xl'>
              Order Confirmed! 🎉
            </h2>
            <p className='mb-6 text-gray-600'>
              Your order has been placed successfully. You'll receive a
              confirmation email shortly.
            </p>
            <div className='space-y-3'>
              <Button
                onClick={() => router.push("/dashboard/orders")}
                className='bg-[#3bb85e] hover:bg-[#457753] w-full'
              >
                Track Your Order
              </Button>
              <Button
                onClick={() => router.push("/marketplace")}
                variant='outline'
                className='w-full'
              >
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='bg-gray-50 min-h-screen'>
      <div className='mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl'>
        {/* Header */}
        <div className='flex items-center gap-4 mb-8'>
          <Button variant='ghost' onClick={() => router.back()}>
            <ArrowLeft className='mr-2 w-4 h-4' />
            Back
          </Button>
          <h1 className='font-bold text-gray-900 text-3xl'>Checkout</h1>
        </div>

        {/* Progress Steps */}
        <div className='flex justify-center items-center mb-8'>
          {/* ... steps ... */}
          <div className='flex items-center space-x-4'>
            {["cart", "shipping", "payment"].map((stepName, index) => (
              <div key={stepName} className='flex items-center'>
                {/* ... */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === stepName
                      ? "bg-[#3bb85e] text-white"
                      : index < ["cart", "shipping", "payment"].indexOf(step)
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {/* ... */}
                  {index < ["cart", "shipping", "payment"].indexOf(step) ? (
                    <CheckCircle className='w-4 h-4' />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className='ml-2 font-medium text-sm capitalize'>
                  {stepName}
                </span>
                {index < 2 && <div className='bg-gray-300 mx-4 w-8 h-px' />}
              </div>
            ))}
          </div>
        </div>

        <div className='gap-8 grid grid-cols-1 lg:grid-cols-3'>
          {/* Main Content */}
          <div className='lg:col-span-2'>
            {/* ... Cart Step ... */}
            {step === "cart" && (
              <Card>
                {/* ... */}
                <CardContent className='space-y-4'>
                  {/* ... items ... */}
                  {cartState.items.map((item) => (
                    <div
                      key={item.product._id}
                      className='flex items-center gap-4 p-4 border rounded-lg'
                    >
                      <img
                        src={item.product.images?.[0] || "/placeholder.svg"}
                        alt={item.product.title}
                        className='rounded-lg w-16 h-16 object-cover'
                      />
                      <div className='flex-1'>
                        <ExpandableTitle text={item.product.title} />
                        <p className='text-gray-600 text-sm'>
                          by {item.product.seller?.firstname}
                        </p>
                        <p className='font-bold text-[#3bb85e] text-lg'>
                          ₦{item.product.price.toLocaleString()}
                        </p>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            handleQuantityChange(
                              item.product._id,
                              item.quantity - 1
                            )
                          }
                        >
                          <Minus className='w-4 h-4' />
                        </Button>
                        <span className='w-8 text-center'>{item.quantity}</span>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            handleQuantityChange(
                              item.product._id,
                              item.quantity + 1
                            )
                          }
                        >
                          <Plus className='w-4 h-4' />
                        </Button>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => removeItem(item.product._id)}
                        className='text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  ))}
                  <div className='flex justify-end'>
                    <Button
                      onClick={() => setStep("shipping")}
                      className='bg-[#3bb85e] hover:bg-[#457753]'
                    >
                      Continue to Shipping
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === "shipping" && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <MapPin className='w-5 h-5' />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleShippingSubmit} className='space-y-4'>
                    {/* ... name/phone ... */}
                    <div className='gap-4 grid grid-cols-1 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <Label htmlFor='fullName'>Full Name *</Label>
                        <Input
                          id='fullName'
                          value={shippingInfo.fullName}
                          onChange={(e) =>
                            setShippingInfo({
                              ...shippingInfo,
                              fullName: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='phone'>Phone Number *</Label>
                        <Input
                          id='phone'
                          type='tel'
                          value={shippingInfo.phone}
                          onChange={(e) =>
                            setShippingInfo({
                              ...shippingInfo,
                              phone: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    {/* ... address ... */}
                    <div className='space-y-2'>
                      <Label htmlFor='address'>Delivery Address *</Label>
                      <Input
                        id='address'
                        value={shippingInfo.address}
                        onChange={(e) =>
                          setShippingInfo({
                            ...shippingInfo,
                            address: e.target.value,
                          })
                        }
                        placeholder='Room number, hostel name, or specific location'
                        required
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='deliveryMethod'>Delivery Method</Label>
                      <Select
                        value={shippingInfo.deliveryMethod}
                        onValueChange={(value) =>
                          setShippingInfo({
                            ...shippingInfo,
                            deliveryMethod: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='school_post'>
                            Campus Post Office (Recommended ⭐)
                          </SelectItem>
                          <SelectItem value='peer_to_peer'>
                            Peer-to-Peer
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {shippingInfo.deliveryMethod === "school_post" && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-green-600">
                             Available at Campus Post Office
                          </p>
                        </div>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='instructions'>
                        Special Instructions (Optional)
                      </Label>
                      <textarea
                        id='instructions'
                        value={shippingInfo.specialInstructions}
                        onChange={(e) =>
                          setShippingInfo({
                            ...shippingInfo,
                            specialInstructions: e.target.value,
                          })
                        }
                        className='px-3 py-2 border border-gray-300 focus:border-transparent rounded-md focus:ring-[#3bb85e] focus:ring-2 w-full resize-none'
                        rows={3}
                        placeholder='Any special delivery instructions...'
                      />
                    </div>

                    <div className='flex justify-between'>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => setStep("cart")}
                      >
                        Back to Cart
                      </Button>
                      <Button
                        type='submit'
                        className='bg-[#3bb85e] hover:bg-[#457753]'
                      >
                        Continue to Payment
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {step === "payment" && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <CreditCard className='w-5 h-5' />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePaymentSubmit} className='space-y-4'>
                    <div className='space-y-2'>
                      <Label>Payment Method</Label>
                      <div>
                        <div className='flex flex-col items-center space-y-2 text-center'>
                          <div className='mb-2 text-2xl'>🏦</div>
                          <div className='font-medium text-sm'>
                            Proceed to Paystack Checkout
                          </div>
                          <div className='flex gap-32 max-w-5xl font-semibold text-xl'>
                            <span>Total</span>
                            <span className='text-[#3bb85e]'>
                              ₦{finalTotal.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='flex justify-between'>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => setStep("shipping")}
                      >
                        Back to Shipping
                      </Button>
                      <Button
                        type='submit'
                        disabled={isProcessing}
                        className='bg-[#3bb85e] hover:bg-[#457753]'
                      >
                        {isProcessing ? "Processing..." : "Place Order"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className='lg:col-span-1'>
            <Card className='top-4 sticky'>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>Subtotal ({cartState.itemCount} items)</span>
                    <span>₦{cartState.total.toLocaleString()}</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span>Delivery Fee</span>
                    <span>
                      {deliveryFee === 0
                        ? "Free"
                        : `₦${deliveryFee.toLocaleString()}`}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span>Service Fee</span>
                    <span>₦{serviceFee.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className='flex justify-between font-semibold'>
                    <span>Total</span>
                    <span className='text-[#3bb85e]'>
                      ₦{finalTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {deliveryFee === 0 && (
                  <div className='bg-green-50 p-3 border border-green-200 rounded-lg'>
                    <div className='flex items-center gap-2 text-green-800 text-sm'>
                      <Truck className='w-4 h-4' />
                      <span>Free delivery on orders over ₦10,000!</span>
                    </div>
                  </div>
                )}

                <div className='bg-blue-50 p-3 border border-blue-200 rounded-lg'>
                  <div className='flex items-start gap-2 text-blue-800 text-sm'>
                    <Shield className='mt-0.5 w-4 h-4' />
                    <div>
                      <div className='mb-1 font-medium'>Secure Checkout</div>
                      <div>
                        Your payment information is encrypted and secure.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
