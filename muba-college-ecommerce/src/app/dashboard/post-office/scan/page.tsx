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
    <div className='mx-auto py-10 px-4 max-w-lg container min-h-screen pb-20'>
      <div className="mb-8 text-center space-y-2">
          <div className="bg-blue-600/10 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-100">
              <Box className='w-8 h-8 text-blue-600' />
          </div>
          <h1 className="text-3xl font-black tracking-tight font-mona text-gray-900">Logistics Portal</h1>
          <p className="text-muted-foreground font-medium">Campus Post Office Verification System</p>
      </div>

      <Card className="rounded-[2.5rem] border-none bg-white/70 backdrop-blur-xl shadow-2xl overflow-hidden border border-white/40">
        <CardHeader className="text-center pb-2">
          <CardTitle className='text-xl font-bold font-mona'>Scanner Interface</CardTitle>
          <CardDescription className="font-medium">
            Verify vendor handoffs and student pickups instantly.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6 pt-2'>
          
          {/* Default View: Buttons and Manual Entry */}
          {!isScanning && !scanResult && (
             <div className='space-y-6 animate-in fade-in zoom-in duration-500'>
                 <Button 
                    onClick={() => setIsScanning(true)} 
                    className='bg-blue-600 hover:bg-blue-700 py-10 w-full text-xl font-black rounded-3xl shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95 group'
                 >
                    <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-3">
                            <Search className="group-hover:rotate-12 transition-transform" />
                            Launch Camera
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">High-Speed Scanner</span>
                    </div>
                 </Button>
                 
                 <div className='relative'>
                    <div className='absolute inset-0 flex items-center'>
                        <span className='border-t border-gray-100 w-full' />
                    </div>
                    <div className='relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]'>
                        <span className='bg-white/80 px-4 text-gray-400'>Manual Override</span>
                    </div>
                </div>

                <form onSubmit={handleManualSubmit} className='flex gap-3'>
                    <div className='relative flex-1 group'>
                        <Search className='top-1/2 -translate-y-1/2 left-4 absolute w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors' />
                        <input
                            type='text'
                            placeholder='Order Reference ID...'
                            className='flex bg-gray-50/50 file:bg-transparent disabled:opacity-50 px-5 py-4 pl-11 border border-transparent file:border-0 rounded-2xl focus-visible:outline-none focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all w-full h-14 font-bold placeholder:text-gray-300 text-sm select-all'
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                        />
                    </div>
                    <Button type='submit' className="h-14 px-6 rounded-2xl bg-gray-900 font-bold hover:bg-black transition-all">
                        Fetch
                    </Button>
                </form>
             </div>
          )}

          {/* Scanning View: Camera Frame */}
          {isScanning && (
              <div className='flex flex-col items-center animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500'>
                  <div className="relative w-full aspect-square max-w-[320px] rounded-[2rem] overflow-hidden border-4 border-blue-600/20 shadow-2xl bg-black group">
                      <div id="reader" className='w-full h-full'></div>
                      {/* Scanner Overlay UI */}
                      <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-blue-500 rounded-2xl animate-pulse ring-[100vw] ring-black/20" />
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_15px_blue] animate-[scan-line_2s_ease-in-out_infinite]" />
                  </div>
                  
                  <div className="mt-8 text-center space-y-2">
                       <p className="text-xs font-black uppercase tracking-widest text-[#3bb85e] animate-pulse">Scanning Active</p>
                       <p className="text-muted-foreground text-[10px] font-bold">Align the QR code within the frame</p>
                  </div>

                  <Button 
                    variant="ghost" 
                    className='mt-6 rounded-full px-8 text-gray-500 font-bold hover:bg-gray-100'
                    onClick={stopScanner}
                  >
                      Cancel Scanning
                  </Button>
              </div>
          )}

          {/* Result View: Confirmation */}
          {scanResult && (
              <div className='animate-in duration-500 slide-in-from-bottom-12 fade-in'>
                  <div className='space-y-6 bg-gray-50/50 backdrop-blur-md p-8 border border-white rounded-[2rem] text-center shadow-inner'>
                      <div className='flex justify-center items-center bg-[#3bb85e]/10 border border-[#3bb85e]/20 mx-auto rounded-3xl w-20 h-20 shadow-sm animate-bounce'>
                          <CheckCircle className='w-10 h-10 text-[#3bb85e]' />
                      </div>
                      <div className="space-y-1">
                          <p className='text-[10px] font-black text-gray-400 uppercase tracking-widest'>Data Decoded</p>
                          <p className='font-black text-2xl tracking-tighter text-gray-900 break-all select-all'>#{parsedData?.orderId}</p>
                          <div className="inline-flex items-center gap-2 mt-2 bg-[#3bb85e]/10 px-3 py-1 rounded-full">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#3bb85e] animate-pulse" />
                              <p className='text-[#3bb85e] text-[10px] font-black uppercase tracking-widest'>{isPickup ? 'PICKUP' : 'HANDOFF'} AUTHORIZED</p>
                          </div>
                      </div>
                      
                      <div className="pt-4 space-y-3">
                        <Button 
                            onClick={handleAction} 
                            className={`w-full py-8 text-lg font-black rounded-2xl shadow-lg transition-all active:scale-95 ${isPickup ? 'bg-[#3bb85e] hover:bg-[#2d8f4a] shadow-green-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}
                            disabled={handoffMutation.isPending}
                        >
                            {handoffMutation.isPending ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 className='w-6 h-6 animate-spin' />
                                    <span>Verifying Chain...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Box className="w-5 h-5" />
                                    {isPickup ? "Process Delivery" : "Accept Handoff"}
                                </div>
                            )}
                        </Button>

                        <Button 
                            variant="ghost" 
                            onClick={() => { setScanResult(null); setParsedData(null); }}
                            className='w-full font-bold text-gray-400 hover:text-gray-600 transition-colors'
                        >
                            Reset Scanner
                        </Button>
                      </div>
                  </div>
              </div>
          )}

        </CardContent>
      </Card>
      
      <div className='mt-12 space-y-4'>
           <div className="flex items-center gap-2 px-4">
                <div className="h-px bg-gray-100 flex-1" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Instructions</p>
                <div className="h-px bg-gray-100 flex-1" />
           </div>
           
           <div className='gap-4 grid grid-cols-1 sm:grid-cols-2'>
              {[
                { title: 'Scan', text: 'Capture the secure QR code from the vendor package.' },
                { title: 'Verify', text: 'System cross-references the order against Cardano records.' },
                { title: 'Confirm', text: 'Confirmation triggers an immutable Proof-of-Custody.' },
                { title: 'Release', text: 'Custody successfully transfers to the Post Office.' }
              ].map((step, i) => (
                <div key={i} className="bg-white/50 border border-white/80 p-4 rounded-2xl shadow-sm space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-[10px] font-black text-white flex items-center justify-center">
                            {i + 1}
                        </div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700">{step.title}</h4>
                    </div>
                    <p className="text-[10px] font-medium text-gray-500 leading-relaxed italic">
                        {step.text}
                    </p>
                </div>
              ))}
           </div>
      </div>

      <style jsx global>{`
        @keyframes scan-line {
            0%, 100% { top: 0%; }
            50% { top: 100%; }
        }
        #reader__status_span { display: none !important; }
        #reader__header_message { display: none !important; }
        #reader video { border-radius: 1.5rem !important; }
      `}</style>
    </div>
  );
}
