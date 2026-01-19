"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { CheckCircle, XCircle, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import toast from "react-hot-toast";

const VerifyContent = () => {
  const params = useParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your payment with Paystack...");
  const reference = params.reference as string;
  
  // Prevent double-execution of verification
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!reference) {
      router.push("/marketplace");
      return;
    }

    // Guard against double verification (React Strict Mode, HMR, etc.)
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyPayment = async () => {
      try {
        const response = await api.get(`/api/v1/payment/verify/${reference}`);
        
        if (response.data.success) {
          // 1. Success Outcome
          setStatus("success");
          setMessage("Payment successful! Your order has been placed.");
          
          // 2. Clear Cart (backend already cleared during init, this is just local cleanup)
          await clearCart();
          
          toast.success("Order successful!");
        } else {
          throw new Error(response.data.message || "Verification failed");
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setStatus("error");
        setMessage(err.response?.data?.message || "We couldn't verify your payment. Please check your dashboard.");
      }
    };

    verifyPayment();
  }, [reference, router]); // Only depend on stable references


  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <Loader2 className="w-16 h-16 text-[#3bb85e] animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Almost there!</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
            <ShieldCheck className="w-4 h-4" /> Secure Verification
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Payment Confirmed!</h2>
        <p className="text-gray-600 mb-8 max-w-sm">{message}</p>
        <Button 
          onClick={() => router.push("/dashboard/orders")}
          className="bg-[#3bb85e] hover:bg-[#2fa04e] h-12 px-8 rounded-xl font-bold"
        >
          View My Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <XCircle className="w-10 h-10 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-8 max-w-sm">{message}</p>
      <div className="flex gap-4">
        <Button 
            onClick={() => router.push("/dashboard/orders")}
            variant="outline"
            className="h-12 px-8 rounded-xl font-bold"
        >
            My Orders
        </Button>
        <Button 
            onClick={() => router.push("/marketplace")}
            className="bg-[#3bb85e] hover:bg-[#2fa04e] h-12 px-8 rounded-xl font-bold"
        >
            Back to Home
        </Button>
      </div>
    </div>
  );
};

export default function VerifyPage() {
  return (
    <div className="bg-white min-h-screen pt-20">
      <div className="max-w-4xl mx-auto px-4">
        <Suspense fallback={<Loader2 className="animate-spin" />}>
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}
