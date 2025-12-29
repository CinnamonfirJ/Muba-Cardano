"use client";

import { useState, useEffect } from "react";
import CardanoWallet from "@/components/CardanoWallet";
import MintBadge from "@/components/badges/MintBadge";
import { useCardano } from "@/context/CardanoContext";
import api from "@/services/api";
import { toast } from "react-hot-toast";
import { Trophy } from "lucide-react";

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
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#3bb85e]"></div>
              <div className="absolute inset-0 bg-[#3bb85e]/10 blur-xl rounded-full animate-pulse" />
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Premium Header Section */}
      <div className="relative bg-white border-b border-gray-100 mb-8 sm:mb-12 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold tracking-tight">
                <Trophy className="w-4 h-4" />
                VENDORS MILESTONES
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 leading-tight">
                Vendor <span className="text-[#3bb85e]">Achievements</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium">
                Track your progress, unlock exclusive milestones, and mint your achievements as unique assets on the Cardano blockchain.
              </p>
            </div>
            <div className="w-full lg:w-auto">
              <div className="bg-white p-2 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
                <CardanoWallet />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Connection Notice */}
        {!isConnected && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-10 text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl transition-transform group-hover:scale-110 duration-700" />
                <div className="relative flex flex-col sm:flex-row items-center gap-6">
                    <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-center sm:text-left">
                        <h3 className="text-xl font-bold mb-1">Wallet Connection Required</h3>
                        <p className="text-blue-50 font-medium opacity-90">Please connect your Cardano wallet to see your eligibility, view minted badges, and claim new achievements on-chain.</p>
                    </div>
                </div>
            </div>
        )}

        {/* Badges Grid System */}
        <div className={`space-y-16 transition-all duration-700 ${!isConnected ? "opacity-40 grayscale pointer-events-none select-none scale-[0.98]" : "opacity-100"}`}>
          {badgeData.map((badgeGroup) => (
            <div key={badgeGroup.type} className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-gray-100 pb-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    {badgeGroup.name}
                    <div className="h-2 w-2 rounded-full bg-[#3bb85e] animate-pulse" />
                  </h2>
                  <p className="text-gray-500 font-medium mt-1">Unlock tiers as you complete more deliveries.</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                    <span className="text-sm font-black text-[#3bb85e]">{badgeGroup.current}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Units Sold</span>
                </div>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {badgeGroup.levels.map((levelData) => (
                    <div key={levelData.level} className="flex">
                        <MintBadge 
                            badgeType={badgeGroup.type}
                            level={levelData.level}
                            badgeName={`${badgeGroup.name} - Tier ${levelData.level}`}
                            deliveriesCompleted={badgeGroup.current}
                            requiredDeliveries={levelData.required}
                            onMint={handleMint}
                        />
                    </div>
                ))}
              </div>
            </div>
          ))}

          {badgeData.length === 0 && !loading && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
               <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-10 h-10 text-gray-300" />
               </div>
               <h3 className="text-xl font-bold text-gray-900">No achievements found</h3>
               <p className="text-gray-500 font-medium max-w-xs mx-auto mt-2">Check back later or start selling products to unlock your first badges!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
