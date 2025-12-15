"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getVendorOrder, updateVendorOrder } from "@/services/vendorOrder.service";
import { auditService } from "@/services/auditService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, QrCode, CheckCircle, Package, User, Truck, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function PostOfficeScannerPage() {
  const [scanInput, setScanInput] = useState("");
  const [scannedData, setScannedData] = useState<{
    order_id: string;
    action: "handoff" | "pickup";
    seller_id?: string;
    delivery_type?: string;
  } | null>(null);
  
  const [order, setOrder] = useState<any>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input for scanners
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setScanError(null);
    setOrder(null);
    setScannedData(null);

    try {
      // Try to parse JSON from QR
      // Handle cases where scanner might send just text or partial data if not configured correctly
      // But we expect JSON format: {"order_id":"...","action":"..."}
      const parsed = JSON.parse(scanInput);
      
      if (!parsed.order_id || !parsed.action) {
        throw new Error("Invalid QR Code format");
      }

      setScannedData(parsed);
      fetchOrderDetails(parsed.order_id);
    } catch (err) {
      // If JSON parse fails, maybe it's just the order ID manually entered?
      if (scanInput.length > 5 && !scanInput.includes("{")) {
         // Fallback: Assume Manual Entry of Order ID, default to Handoff (or ask user?)
         // For now, let's treat manual entry as just looking up the order
         setScannedData({
             order_id: scanInput,
             action: "handoff" // Default assumption or we could ask UI to choose
         });
         fetchOrderDetails(scanInput);
      } else {
        setScanError("Invalid QR Code. Please scan a valid Order QR.");
      }
    }
  };

  const fetchOrderDetails = async (id: string) => {
    setIsLoadingOrder(true);
    try {
        // We use getVendorOrder as a generic "get order details" for the system
        // In a real app, this would be a specialized "adminGetOrder"
        const data = await getVendorOrder(id);
        setOrder(data);
    } catch (err) {
        setScanError("Order not found or access denied.");
    } finally {
        setIsLoadingOrder(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!scannedData || !order) return;
    setIsProcessing(true);

    try {
        const targetStatus = scannedData.action === "handoff" ? "sent_to_post_office" : "delivered";
        const actionLabel = scannedData.action === "handoff" ? "Vendor Handoff" : "Customer Pickup";

        // 1. Audit to Cardano
        await auditService.recordEvent({
            order_id: order._id,
            action: scannedData.action,
            seller_id: order.vendor_id,
            metadata: {
                timestamp: Date.now(),
                location: "Campus Post Office Main",
                operator: "Staff_01" // Mock operator
            }
        });

        // 2. Update Order Status
        await updateVendorOrder(order._id, { status: targetStatus });

        toast.success(`${actionLabel} confirmed successfully!`);
        
        // Reset for next scan
        setScanInput("");
        setScannedData(null);
        setOrder(null);
        setTimeout(() => inputRef.current?.focus(), 100);

    } catch (err: any) {
        toast.error("Failed to process transaction: " + err.message);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto min-h-screen bg-gray-50">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Campus Post Office
        </h1>
        <p className="text-gray-500 text-sm">Scanner Terminal</p>
      </div>

      {/* SEARCH / SCAN INPUT */}
      <Card className="mb-6 shadow-md">
        <CardContent className="pt-6">
          <form onSubmit={handleScan} className="flex gap-2">
            <Input 
                ref={inputRef}
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scan QR or enter Order ID..."
                className="text-lg h-12"
                autoComplete="off"
            />
            <Button type="submit" size="lg" className="h-12 bg-blue-600 hover:bg-blue-700">
                <QrCode className="w-5 h-5 mr-2" />
                Scan
            </Button>
          </form>
          {scanError && (
              <p className="mt-2 text-sm text-red-500 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {scanError}
              </p>
          )}
        </CardContent>
      </Card>

      {/* ORDER PREVIEW CARD */}
      {isLoadingOrder && (
          <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
      )}

      {order && scannedData && !isLoadingOrder && (
          <Card className={`border-2 shadow-lg ${
              scannedData.action === 'handoff' ? 'border-blue-500 bg-blue-50/50' : 'border-green-500 bg-green-50/50'
          }`}>
              <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                      <Badge variant="outline" className="px-3 py-1 text-sm bg-white uppercase">
                          {scannedData.action} Event
                      </Badge>
                      <span className="font-mono text-xs text-gray-500">{order._id}</span>
                  </div>
                  <CardTitle className="text-2xl pt-2">
                      {scannedData.action === 'handoff' ? '📦 Vendor Drop-off' : '📬 Customer Pickup'}
                  </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                  {/* Order Info */}
                  <div className="bg-white p-4 rounded-lg border">
                      <div className="flex gap-4 mb-4">
                          <img 
                            src={order.items?.[0]?.product_id?.img?.[0] || order.items?.[0]?.img?.[0] || "/placeholder.svg"} 
                            className="w-16 h-16 object-cover rounded bg-gray-100"
                          />
                          <div>
                              <p className="font-bold">{order.items?.length} Items</p>
                              <p className="text-sm text-gray-500">
                                  Total: ₦{order.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0).toLocaleString()}
                              </p>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                              <p className="text-gray-500 flex items-center gap-1"><User className="w-3 h-3" /> Customer</p>
                              <p className="font-medium">{order.customer_id?.firstname} {order.customer_id?.lastname}</p>
                          </div>
                          <div>
                              <p className="text-gray-500 flex items-center gap-1"><Truck className="w-3 h-3" /> Current Status</p>
                              <p className="font-medium capitalize">{order.status.replace(/_/g, " ")}</p>
                          </div>
                      </div>
                  </div>

                  {/* Validation Logic UI */}
                  {scannedData.action === 'handoff' && order.status !== 'processing' && order.status !== 'confirmed' && (
                       <Alert variant="destructive">
                           <AlertTitle>Warning</AlertTitle>
                           <AlertDescription>Order status is {order.status}. Expected "processing". verify before accepting.</AlertDescription>
                       </Alert>
                  )}

                  {scannedData.action === 'pickup' && order.status !== 'sent_to_post_office' && (
                       <Alert variant="destructive">
                           <AlertTitle>Warning</AlertTitle>
                           <AlertDescription>Order status is {order.status}. Item might not be at Post Office yet.</AlertDescription>
                       </Alert>
                  )}

                  <Button 
                    className="w-full text-lg h-14" 
                    variant={scannedData.action === 'handoff' ? "default" : "secondary"}
                    onClick={handleConfirmAction}
                    disabled={isProcessing}
                  >
                      {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Verifying on Cardano...
                          </>
                      ) : (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Confirm {scannedData.action === 'handoff' ? 'Drop-off' : 'Pickup'}
                          </>
                      )}
                  </Button>
                  <p className="text-center text-xs text-gray-400">
                      Action will be permanently recorded on Cardano Blockchain
                  </p>
              </CardContent>
          </Card>
      )}
    </div>
  );
}
