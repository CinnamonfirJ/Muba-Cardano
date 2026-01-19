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
  Shield,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { calculateSplit } from "@/utils/paymentSplit.util";
import paymentService from "@/services/paymentService";
import ExpandableTitle from "@/components/ExpandableTitle";

const CheckoutPage = () => {
  const { state: cartState, updateQuantity, removeItem, dispatch } = useCart();
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
    email: "", 
    deliveryMethod: "school_post",
    specialInstructions: "",
  });

  useEffect(() => {
    if (user) {
      setShippingInfo((prev) => ({
        ...prev,
        fullName: prev.fullName || `${user.firstname} ${user.lastname}`,
        phone: prev.phone || user.phone || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const split = calculateSplit(cartState.total);
  const finalTotal = cartState.total;
  const serviceFee = split.platform_fee;

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      await removeItem(productId);
    } else {
      await updateQuantity(productId, newQuantity);
    }
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shippingInfo.fullName || shippingInfo.fullName.trim().split(" ").length < 2) {
        toast.error("Please provide your full first and last name.");
        return;
    }

    if (!shippingInfo.phone || shippingInfo.phone.length < 10) {
        toast.error("Please provide a valid phone number for delivery.");
        return;
    }

    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address || !shippingInfo.deliveryMethod) {
      toast.error("Please fill in all required shipping information");
      return;
    }
    
    setStep("payment");
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // 1. Lock the cart immediately (Synchronous Commitment)
      // Cart locking removed as per new sequential flow design.

      const paymentData = {
        email: user?.email || "",
        amount: finalTotal,
        metadata: {
          userId: user?._id,
          deliveryMethod: shippingInfo.deliveryMethod,
          shippingInfo,
          delivery_fee: 0,
        },
      };

      const initResponse = await paymentService.initializePayment(paymentData);

      if (initResponse?.authorization_url) {
        window.location.href = initResponse.authorization_url;
      } else {
        throw new Error("No authorization URL received from payment gateway");
      }
    } catch (error: any) {
      console.error("Payment initialization failed:", error);
      toast.error(error.message || "Failed to initialize payment");
      setIsProcessing(false);
    }
  };

  if (cartState.items.length === 0 && step !== "confirmation") {
    return (
      <div className='flex justify-center items-center bg-gray-50 min-h-screen'>
        <div className='text-center'>
          <ShoppingCart className='mx-auto mb-4 w-16 h-16 text-gray-400' />
          <h2 className='mb-2 font-bold text-gray-900 text-2xl'>Your cart is empty</h2>
          <p className='mb-6 text-gray-600'>Add some products to your cart to continue shopping.</p>
          <Button onClick={() => router.push("/marketplace")} className='bg-[#3bb85e] hover:bg-[#457753]'>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-gray-50 min-h-screen'>
      <div className='mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl'>
        <div className='flex items-center gap-4 mb-8'>
          <Button variant='ghost' onClick={() => router.back()}><ArrowLeft className='mr-2 w-4 h-4' />Back</Button>
          <h1 className='font-bold text-gray-900 text-3xl'>Checkout</h1>
        </div>

        <div className='flex justify-center mb-8 overflow-x-auto pb-4 sm:pb-0'>
          <div className='flex items-center space-x-2 sm:space-x-4 min-w-max px-4'>
            {["cart", "shipping", "payment"].map((stepName, index) => (
              <div key={stepName} className='flex items-center'>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors ${step === stepName ? "bg-[#3bb85e] text-white" : index < ["cart", "shipping", "payment"].indexOf(step) ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                  {index < ["cart", "shipping", "payment"].indexOf(step) ? <CheckCircle className='w-3 h-3 sm:w-4 sm:h-4' /> : index + 1}
                </div>
                <span className={`ml-1 sm:ml-2 font-medium text-xs sm:text-sm capitalize ${step === stepName ? 'text-[#3bb85e]' : 'text-gray-500'}`}>{stepName}</span>
                {index < 2 && <div className='bg-gray-300 mx-2 sm:mx-4 w-4 sm:w-8 h-px' />}
              </div>
            ))}
          </div>
        </div>

        <div className='flex flex-col lg:grid lg:grid-cols-3 gap-8'>
          <div className='order-2 lg:order-1 lg:col-span-2'>
            {step === "cart" && (
              <Card>
                <CardContent className='pt-6 space-y-4'>
                  {cartState.items.map((item) => (
                    <div key={item.product._id} className='flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg'>
                      <div className='flex items-center gap-4 w-full sm:w-auto'>
                        <img src={item.product.images?.[0] || "/placeholder.svg"} alt={item.product.title} className='rounded-lg w-16 h-16 object-cover flex-shrink-0' />
                        <div className='flex-1 sm:hidden'>
                           <ExpandableTitle text={item.product.title} />
                           <p className='text-gray-600 text-xs'>by {item.product.store?.owner?.firstname}</p>
                        </div>
                      </div>
                      <div className='hidden sm:block flex-1'>
                        <ExpandableTitle text={item.product.title} />
                        <p className='text-gray-600 text-sm'>by {item.product.store?.owner?.firstname}</p>
                      </div>
                      <div className='flex items-center justify-between w-full sm:w-auto gap-4'>
                        <div className='sm:text-right'><p className='font-bold text-[#3bb85e] text-lg'>₦{item.product.price.toLocaleString()}</p></div>
                        <div className='flex items-center gap-2'>
                          <div className='flex items-center border rounded-md'>
                            <Button variant='outline' size='icon' className="h-8 w-8" onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}><Minus className='w-3 h-3' /></Button>
                            <span className='w-8 text-center text-sm'>{item.quantity}</span>
                            <Button variant='outline' size='icon' className="h-8 w-8" onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}><Plus className='w-3 h-3' /></Button>
                          </div>
                          <Button variant='ghost' size='sm' onClick={() => removeItem(item.product._id)} className='text-red-600 hover:text-red-700 h-8 w-8 p-0'><Trash2 className='w-4 h-4' /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className='flex justify-end'>
                    <Button onClick={() => setStep("shipping")} className='bg-[#3bb85e] hover:bg-[#457753]'>Continue to Shipping</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === "shipping" && (
              <Card>
                <CardHeader><CardTitle className='flex items-center gap-2'><MapPin className='w-5 h-5' />Shipping Information</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleShippingSubmit} className='space-y-4'>
                    <div className='gap-4 grid grid-cols-1 md:grid-cols-2'>
                      <div className='space-y-2'><Label htmlFor='fullName'>Full Name *</Label><Input id='fullName' value={shippingInfo.fullName} onChange={(e) => setShippingInfo({...shippingInfo, fullName: e.target.value})} required /></div>
                      <div className='space-y-2'><Label htmlFor='phone'>Phone Number *</Label><Input id='phone' type='tel' value={shippingInfo.phone} onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})} required /></div>
                    </div>
                    <div className='space-y-2'><Label htmlFor='address'>Delivery Address *</Label><Input id='address' value={shippingInfo.address} onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})} placeholder='Room number, hostel name, or specific location' required /></div>
                    <div className='space-y-2'><Label htmlFor='deliveryMethod'>Delivery Method</Label><Select value={shippingInfo.deliveryMethod} onValueChange={(value) => setShippingInfo({...shippingInfo, deliveryMethod: value})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value='school_post'>Campus Post Office (Recommended ⭐)</SelectItem><SelectItem value='peer_to_peer'>Peer-to-Peer</SelectItem></SelectContent>
                    </Select></div>
                    <div className='space-y-2'><Label htmlFor='instructions'>Special Instructions (Optional)</Label><textarea id='instructions' value={shippingInfo.specialInstructions} onChange={(e) => setShippingInfo({...shippingInfo, specialInstructions: e.target.value})} className='px-3 py-2 border border-gray-300 focus:border-transparent rounded-md focus:ring-[#3bb85e] focus:ring-2 w-full resize-none' rows={3} placeholder='Any special delivery instructions...' /></div>
                    <div className='flex md:flex-row flex-col gap-3 justify-between'><Button type='button' variant='outline' onClick={() => setStep("cart")}>Back to Cart</Button><Button type='submit' className='bg-[#3bb85e] hover:bg-[#457753]'>Continue to Payment</Button></div>
                  </form>
                </CardContent>
              </Card>
            )}

            {step === "payment" && (
              <Card>
                <CardHeader><CardTitle className='flex items-center gap-2'><CreditCard className='w-5 h-5' />Payment Information</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handlePaymentSubmit} className='space-y-4'>
                    <div className='space-y-2'><Label>Payment Method</Label><div className='flex flex-col items-center space-y-4 text-center p-6 border rounded-xl bg-gray-50'><div className='text-4xl'>🏦</div><div><p className='font-bold text-lg'>Secure Paystack Checkout</p><p className='text-gray-500 text-sm'>Direct bank transfer, card, or USSD</p></div><Separator /><div className='flex justify-between w-full max-w-xs font-bold text-xl'><span>Total to Pay</span><span className='text-[#3bb85e]'>₦{finalTotal.toLocaleString()}</span></div></div></div>
                    <div className='flex md:flex-row flex-col gap-3 justify-between pt-4'><Button type='button' variant='outline' onClick={() => setStep("shipping")}>Back to Shipping</Button><Button type='submit' disabled={isProcessing} className='bg-[#3bb85e] hover:bg-[#457753] h-12 px-10 rounded-xl font-bold text-lg shadow-lg shadow-green-100'>{isProcessing ? "Redirecting..." : "Pay Now"}</Button></div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
          <div className='order-1 lg:order-2 lg:col-span-1'>
            <Card className='top-4 sticky'>
              <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'><div className='flex justify-between text-sm'><span>Subtotal ({cartState.itemCount} items)</span><span>₦{cartState.total.toLocaleString()}</span></div><div className='flex justify-between text-sm italic text-gray-500'><span>Service Fee (Included)</span><span>₦{serviceFee.toLocaleString()}</span></div><Separator /><div className='flex justify-between font-bold text-lg'><span>Total</span><span className='text-[#3bb85e]'>₦{finalTotal.toLocaleString()}</span></div></div>
                <div className='bg-blue-50 p-4 border border-blue-100 rounded-xl flex items-start gap-3'><Shield className='w-5 h-5 text-blue-600 mt-1' /><div><p className='font-bold text-blue-900 text-sm'>Buyer Protection</p><p className='text-blue-700 text-xs mt-1 leading-relaxed'>Funds are held in escrow until delivery is confirmed. 100% money-back guarantee.</p></div></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
