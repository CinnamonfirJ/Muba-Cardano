"use client";

import { useState, useEffect } from "react";
import CardanoWallet from "@/components/CardanoWallet";
import MintBadge from "@/components/badges/MintBadge";
import { useCardano } from "@/context/CardanoContext";
import api from "@/services/api";
import { toast } from "react-hot-toast";

interface BadgeLevel {
    level: number;
    required: number;
    isEligible: boolean;
    minted?: boolean;
}

interface BadgeGroup {
    type: string;
    name: string;
    current: number;
    levels: BadgeLevel[];
}

export default function BadgesPage() {
  const { isConnected, walletAddress } = useCardano();
  const [badgeData, setBadgeData] = useState<BadgeGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real eligibility data
  useEffect(() => {
    const fetchEligibility = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/v1/badge/eligible");
        if (response.data.success) {
            // Transform object to array
            const transformed = Object.entries(response.data.data).map(([type, data]: [string, any]) => ({
                type,
                name: data.name,
                current: data.current,
                levels: data.levels
            }));
            setBadgeData(transformed);
        }
      } catch (error) {
        console.error("Failed to fetch badge data", error);
        toast.error("Failed to load achievement data");
      } finally {
        setLoading(false);
      }
    };

    fetchEligibility();
  }, []);

  const handleMint = async (badgeType: string, level: number): Promise<string> => {
    if (!isConnected || !walletAddress) {
        toast.error("Please connect your Cardano wallet first");
        throw new Error("Wallet not connected");
    }

    try {
        const response = await api.post("/api/v1/badge/mint", {
            badgeType,
            level,
            walletAddress
        });
        
        if (!response.data.success) {
            throw new Error(response.data.message || "Failed to mint");
        }

        // Optimistically update local state to show 'owned' if we had that state
        // For now, we'll just refresh or let the user see the success
        toast.success(`Broadcasting transaction for ${badgeType} Level ${level}!`);
        
        return response.data.data.txHash;
    } catch (error: any) {
        const msg = error.response?.data?.message || error.message || "Minting failed";
        toast.error(msg);
        throw error;
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header & Wallet */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Vendor Achievements</h1>
            <p className="text-gray-500">Track your progress and mint on-chain badges.</p>
          </div>
          <CardanoWallet />
        </div>

        {/* Connection Overlay/Notice if not connected */}
        {!isConnected && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 text-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium">Connect your wallet above to enable minting and view your on-chain credentials.</p>
            </div>
        )}

        {/* Badges Grid */}
        <div className={`grid gap-12 transition-all duration-500 ${!isConnected ? "opacity-60 grayscale scale-[0.99] pointer-events-none select-none" : ""}`}>
          {badgeData.map((badgeGroup) => (
            <div key={badgeGroup.type} className="space-y-6">
              <div className="flex justify-between items-end border-b pb-2">
                <h2 className="text-2xl font-bold text-gray-800">{badgeGroup.name}</h2>
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {badgeGroup.current} total units achieved
                </span>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {badgeGroup.levels.map((levelData) => (
                    <div key={levelData.level} className="relative group">
                        <MintBadge 
                            badgeType={badgeGroup.type}
                            level={levelData.level}
                            badgeName={`${badgeGroup.name} - Level ${levelData.level}`}
                            deliveriesCompleted={badgeGroup.current}
                            requiredDeliveries={levelData.required}
                            onMint={handleMint}
                        />
                    </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
