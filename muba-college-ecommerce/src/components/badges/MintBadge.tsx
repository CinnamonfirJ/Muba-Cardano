"use client";

import { useState } from "react";
import { Loader2, ExternalLink, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MintBadgeProps {
  badgeType: string;
  level: number;
  badgeName: string;
  deliveriesCompleted: number;
  requiredDeliveries: number;
  onMint: (badgeType: string, level: number) => Promise<string>; // Returns txHash
}

export default function MintBadge({
  badgeType,
  level,
  badgeName,
  deliveriesCompleted,
  requiredDeliveries,
  onMint,
}: MintBadgeProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const progress = Math.min((deliveriesCompleted / requiredDeliveries) * 100, 100);
  const isEligible = deliveriesCompleted >= requiredDeliveries;

  const handleMint = async () => {
    try {
      setIsMinting(true);
      setError(null);
      const hash = await onMint(badgeType, level);
      setTxHash(hash);
    } catch (err: any) {
      console.error("Minting failed", err);
      setError(err.message || "Minting failed");
    } finally {
      setIsMinting(false);
    }
  };

  // Color mapping based on level
  const getLevelColors = (lvl: number) => {
    if (lvl === 1) return "from-blue-400 to-indigo-600";
    if (lvl === 2) return "from-purple-400 to-pink-600";
    if (lvl === 3) return "from-amber-400 to-orange-600";
    return "from-emerald-400 to-teal-600";
  };

  const levelColors = getLevelColors(level);

  return (
    <Card className={`w-full overflow-hidden transition-all duration-300 hover:shadow-xl border-2 ${isEligible ? "border-[#3bb85e]/20" : "border-gray-100"}`}>
      <div className={`h-1.5 w-full bg-gradient-to-r ${isEligible ? levelColors : "from-gray-200 to-gray-300"}`} />
      
      <CardHeader className="text-center pb-2 pt-6">
        <div className="relative mx-auto mb-4 group cursor-default">
            {/* Background Glow */}
            {isEligible && (
              <div className={`absolute inset-0 bg-gradient-to-br ${levelColors} opacity-20 blur-2xl rounded-full animate-pulse`} />
            )}
            
            <div className={`relative z-10 mx-auto w-24 h-24 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 shadow-lg ${
              isEligible 
              ? `bg-gradient-to-br ${levelColors} text-white` 
              : "bg-gray-50 text-gray-300 border border-gray-100"
            }`}>
                 {isEligible ? (
                   <ShieldCheck className="w-12 h-12 drop-shadow-md" />
                 ) : (
                   <Lock className="w-12 h-12 opacity-50" />
                 )}
                 <div className="absolute -bottom-2 -right-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded-lg border border-white/20 shadow-lg">
                    LVL {level}
                 </div>
            </div>
        </div>

        <CardTitle className="text-lg font-bold text-gray-800 line-clamp-1 group-hover:text-[#3bb85e] transition-colors">
          {badgeName}
        </CardTitle>
        
        <div className="flex justify-center mt-2">
          {isEligible ? (
            <Badge className={`bg-gradient-to-r ${levelColors} border-none shadow-sm`}>
              Eligible to Mint
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-none">
              Locked
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-2">
        <div className="space-y-2">
          <div className="flex justify-between items-end text-xs">
            <span className="text-gray-400 font-medium uppercase tracking-wider">Progress</span>
            <span className="font-bold text-gray-700">{deliveriesCompleted} <span className="text-gray-300 font-normal">/</span> {requiredDeliveries}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out bg-gradient-to-r ${isEligible ? levelColors : "from-gray-300 to-gray-400"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {txHash && (
          <div className="bg-emerald-50/50 backdrop-blur-sm p-3 rounded-xl border border-emerald-100 text-sm animate-in fade-in slide-in-from-top-2 duration-500">
            <p className="text-emerald-700 font-bold mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Successfully Minted!
            </p>
            <a 
                href={`https://preprod.cardanoscan.io/transaction/${txHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors text-xs font-medium w-full"
            >
                <ExternalLink className="w-3.5 h-3.5" />
                View on CardanoScan
            </a>
          </div>
        )}

        {error && (
            <div className="text-red-500 text-xs bg-red-50 p-2.5 rounded-xl border border-red-100 flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0" />
                {error}
            </div>
        )}
      </CardContent>

      <CardFooter className="pb-6">
        <Button 
            className={`w-full h-11 rounded-xl font-bold transition-all duration-300 active:scale-[0.98] ${
              isEligible && !txHash 
              ? `bg-gradient-to-r ${levelColors} hover:opacity-90 shadow-lg hover:shadow-xl text-white border-none` 
              : txHash 
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-default"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            onClick={handleMint} 
            disabled={!isEligible || isMinting || !!txHash}
        >
          {isMinting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
              Minting on Cardano...
            </>
          ) : txHash ? (
            "Claimed Achievement"
          ) : !isEligible ? (
            <>
              <Lock className="mr-2 h-3.5 w-3.5" /> Locked Achievement
            </>
          ) : (
            "Mint Your Badge"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
