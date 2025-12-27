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

  return (
    <Card className="w-full max-w-sm border-2">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto bg-gray-100 p-4 rounded-full w-24 h-24 flex items-center justify-center mb-2 relative">
             {/* Placeholder Badge Image - could be replaced with real image prop */}
             <ShieldCheck className={`w-12 h-12 ${isEligible ? "text-green-600" : "text-gray-400"}`} />
             <div className="absolute -bottom-2 bg-black text-white text-xs font-bold px-2 py-0.5 rounded-full">
                LVL {level}
             </div>
        </div>
        <CardTitle className="text-xl font-bold">{badgeName}</CardTitle>
        <Badge variant={isEligible ? "default" : "secondary"} className="mx-auto w-fit mt-1">
          {isEligible ? "Eligible to Mint" : "Locked"}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Progress</span>
            <span className="font-mono font-medium">{deliveriesCompleted} / {requiredDeliveries}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {txHash && (
          <div className="bg-green-50 p-3 rounded-md border border-green-200 text-sm">
            <p className="text-green-700 font-medium mb-1 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Minted Successfully!
            </p>
            <a 
                href={`https://preprod.cardanoscan.io/transaction/${txHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-800 hover:underline flex items-center gap-1 text-xs break-all"
            >
                {txHash.slice(0, 20)}... <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {error && (
            <div className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100">
                {error}
            </div>
        )}
      </CardContent>

      <CardFooter>
        <Button 
            className="w-full" 
            onClick={handleMint} 
            disabled={!isEligible || isMinting || !!txHash}
            variant={isEligible ? "default" : "secondary"}
        >
          {isMinting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Minting...
            </>
          ) : txHash ? (
            "Minted"
          ) : !isEligible ? (
            <>
              <Lock className="mr-2 h-4 w-4" /> Locked
            </>
          ) : (
            "Mint Badge"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
