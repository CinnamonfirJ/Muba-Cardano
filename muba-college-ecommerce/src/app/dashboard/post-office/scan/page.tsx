"use client";

import { useState, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Box, CheckCircle, Search } from "lucide-react";
import toast from "react-hot-toast";

interface ScanResult {
  orderId: string;
  type: "handoff" | "pickup";
  timestamp: number;
}

export default function PostOfficeScanner() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Robust Scanner Lifecycle Management
  useEffect(() => {
    let isMounted = true; 

    const initScanner = async () => {
        if (!isScanning) return;
        
        // Wait for DOM element to be available
        await new Promise(resolve => setTimeout(resolve, 50)); 
        if (!document.getElementById("reader")) {
            console.error("Scanner element not found");
            return;
        }

        try {
            // Cleanup existing instance if any
            if (scannerRef.current) {
                try { await scannerRef.current.stop(); } catch (e) { /* ignore */ }
                try { await scannerRef.current.clear(); } catch (e) { /* ignore */ }
            }

            const html5QrCode = new Html5Qrcode("reader");
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" }, 
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                (decodedText) => {
                    if (isMounted) handleScanSuccess(decodedText);
                },
                (errorMessage) => {
                     // Suppress frame errors
                }
            );
        } catch (err) {
            console.error("Failed to start scanner", err);
            if (isMounted) {
                // toast.error("Could not access camera. Ensure permissions are granted.");
                setIsScanning(false);
            }
        }
    };

    if (isScanning) {
        initScanner();
    } else {
        // Cleanup when scanning stops
        if (scannerRef.current) {
             scannerRef.current.stop().catch(err => console.error("Stop failed", err));
        }
    }

    return () => {
        isMounted = false;
        if (scannerRef.current && scannerRef.current.isScanning) {
             scannerRef.current.stop().catch(() => {});
             scannerRef.current.clear();
        }
    };
  }, [isScanning]);

  const stopScanner = () => {
      setIsScanning(false);
  };

  const handleScanSuccess = (decodedText: string) => {
      // Logic to stop scanner is handled by the effect dependency change (setIsScanning(false))
      setIsScanning(false);
      setScanResult(decodedText);
      try {
          const data = JSON.parse(decodedText);
          if (data.orderId) {
             setParsedData(data); 
          } else {
             setParsedData({ orderId: decodedText, type: "handoff", timestamp: Date.now() }); 
          }
      } catch (e) {
           setParsedData({ orderId: decodedText, type: "handoff", timestamp: Date.now() });
      }
  };

  const isPickup = parsedData?.type === "pickup" || parsedData?.orderId?.includes("-");

  const handoffMutation = useMutation({
      mutationFn: async (orderId: string) => {
          const response = await api.post("/api/v1/delivery/handover", { orderId });
          return response.data;
      },
      onSuccess: (data) => {
          const actionWord = isPickup ? "Delivery" : "Handoff";
          toast.success(`${actionWord} Confirmed! Tx: ${data.data.handoffTxHash?.substring(0, 10)}${data.data.deliveryTxHash?.substring(0, 10)}...`);
          setScanResult(null);
          setParsedData(null);
          setManualCode(""); 
      },
      onError: (err: any) => {
          toast.error(err.response?.data?.message || "Handoff Failed");
      }
  });

  const handleManualSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!manualCode.trim()) return;
      handleScanSuccess(manualCode.trim());
  }

  const handleAction = () => {
      if (!parsedData?.orderId) return;

      handoffMutation.mutate(parsedData.orderId);
  }

  return (
    <div className='mx-auto py-8 max-w-md container'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Box className='w-6 h-6 text-blue-600' />
            Post Office Scanner
          </CardTitle>
          <CardDescription>
            Scan Vendor packages to confirm receipt (Handoff).
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          
          {/* Default View: Buttons and Manual Entry */}
          {!isScanning && !scanResult && (
             <div className='space-y-4'>
                 <Button 
                    onClick={() => setIsScanning(true)} 
                    className='bg-blue-600 hover:bg-blue-700 py-8 w-full text-lg'
                 >
                    Start Camera Scan
                 </Button>
                 
                 <div className='relative'>
                    <div className='absolute inset-0 flex items-center'>
                        <span className='border-t w-full' />
                    </div>
                    <div className='relative flex justify-center text-xs uppercase'>
                        <span className='bg-white px-2 text-muted-foreground'>Or enter manually</span>
                    </div>
                </div>

                <form onSubmit={handleManualSubmit} className='flex gap-2'>
                    <div className='relative flex-1'>
                        <Search className='top-2.5 left-2 absolute w-4 h-4 text-muted-foreground' />
                        <input
                            type='text'
                            placeholder='Order ID...'
                            className='flex bg-background file:bg-transparent disabled:opacity-50 px-3 py-2 pl-8 border border-input file:border-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ring-offset-background focus-visible:ring-offset-2 w-full h-10 file:font-medium placeholder:text-muted-foreground text-sm file:text-sm disabled:cursor-not-allowed'
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                        />
                    </div>
                    <Button type='submit'>Check</Button>
                </form>
             </div>
          )}

          {/* Scanning View: Camera Frame */}
          {isScanning && (
              <div className='flex flex-col items-center'>
                  <div id="reader" className='bg-black border-2 border-slate-200 rounded-lg w-full h-[300px] overflow-hidden'></div>
                  <Button 
                    variant="outline" 
                    className='mt-4'
                    onClick={stopScanner}
                  >
                      Cancel
                  </Button>
              </div>
          )}

          {/* Result View: Confirmation */}
          {scanResult && (
              <div className='animate-in duration-300 fade-in zoom-in'>
                  <div className='space-y-4 bg-green-50 p-6 border border-green-200 rounded-lg text-center'>
                      <div className='flex justify-center items-center bg-green-100 mx-auto rounded-full w-12 h-12'>
                          <CheckCircle className='w-6 h-6 text-green-600' />
                      </div>
                      <div>
                          <p className='font-medium text-green-800 text-sm'>Scanned Successfully</p>
                          <p className='font-mono font-bold text-xl tracking-wider select-all'>{parsedData?.orderId}</p>
                          {parsedData?.type && <p className='text-green-600 text-xs uppercase'>{parsedData.type} Mode</p>}
                      </div>
                      
                      <Button 
                        onClick={handleAction} 
                        className={`w-full ${isPickup ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        disabled={handoffMutation.isPending}
                      >
                          {handoffMutation.isPending ? (
                              <>
                                <Loader2 className='mr-2 w-4 h-4 animate-spin' />
                                Processing Blockchain Proof...
                              </>
                          ) : (isPickup ? "Confirm Delivery" : "Confirm Handoff")}
                      </Button>

                      <Button 
                        variant="ghost" 
                        onClick={() => { setScanResult(null); setParsedData(null); }}
                        className='text-sm'
                      >
                          Scan Next
                      </Button>
                  </div>
              </div>
          )}

        </CardContent>
      </Card>
      
      <div className='bg-blue-50 mt-8 p-4 border border-blue-100 rounded-lg text-blue-900 text-sm'>
          <p className='mb-1 font-bold'>How it works:</p>
          <ul className='space-y-1 list-disc list-inside'>
              <li>Scan the Vendor's package QR code.</li>
              <li>Confirming generates a <strong>Proof-of-Handoff</strong> on Cardano.</li>
              <li>This action officially transfers custody to the Post Office.</li>
              <li>For student pickups, the <strong>Student</strong> must verify using their app.</li>
          </ul>
      </div>
    </div>
  );
}
