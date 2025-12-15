"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import toast from "react-hot-toast";

const VerifyContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    const reference = searchParams.get("reference");
    
    if (!reference) {
        setStatus("error");
        setMessage("No payment reference found.");
        return;
    }

    const verifyPayment = async () => {
      try {
        const response = await api.get(`/api/v1/payment/verify/${reference}`);
        
        if (response.data.status) {
            setStatus("success");
            setMessage("Payment verified successfully!");
            clearCart(); // Clear local cart
            toast.success("Payment successful!");
        } else {
            setStatus("error");
            setMessage(response.data.message || "Payment verification failed.");
            toast.error("Payment failed.");
        }
      } catch (error: any) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage(error.response?.data?.message || "An error occurred during verification.");
        toast.error("Verification failed.");
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <Loader2 className="w-16 h-16 text-[#3bb85e] animate-spin mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Payment</h2>
        <p className="text-gray-600">Please wait while we confirm your transaction...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful! 🎉</h2>
        <p className="text-gray-600 mb-8 max-w-md">
            Your order has been placed successfully. You can track its status in your dashboard.
        </p>
        <div className="flex gap-4">
            <Button 
                onClick={() => router.push("/dashboard/orders")}
                className="bg-[#3bb85e] hover:bg-[#457753]"
            >
                View Orders
            </Button>
            <Button 
                onClick={() => router.push("/marketplace")}
                variant="outline"
            >
                Continue Shopping
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <XCircle className="w-10 h-10 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
      <p className="text-gray-600 mb-8 max-w-md">{message}</p>
      <div className="flex gap-4">
        <Button 
            onClick={() => router.push("/checkout")}
            className="bg-[#3bb85e] hover:bg-[#457753]"
        >
            Try Again
        </Button>
        <Button 
            onClick={() => router.push("/marketplace")}
            variant="outline"
        >
            Return to Marketplace
        </Button>
      </div>
    </div>
  );
};

export default function VerifyPage() {
  return (
    <div className="bg-gray-50 min-h-screen pt-20 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
                <CardContent className="p-6">
                    <Suspense fallback={<div>Loading...</div>}>
                        <VerifyContent />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
