"use client";

import { useState, useEffect } from "react";
import { Lucid } from "lucid-cardano";

export default function CardanoWallet() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lucid, setLucid] = useState<Lucid | null>(null);

  useEffect(() => {
    // Check if window.cardano exists
    if (typeof window !== "undefined" && window.cardano) {
       // Auto-connect logic could go here if persisted
    }
  }, []);

  const connectWallet = async (walletName: "nami" | "eternl") => {
    try {
      setLoading(true);

      if (!window.cardano || !window.cardano[walletName]) {
        alert(`Wallet ${walletName} not found. Please install the extension.`);
        setLoading(false);
        return;
      }

      const walletApi = await window.cardano[walletName].enable();
      
      if (!walletApi) {
        throw new Error(`${walletName} user rejected connection`);
      }

      // Initialize Lucid for Testnet (Preprod) as requested
      const lucidInstance = await Lucid.new(undefined, "Preprod"); 
      lucidInstance.selectWallet(walletApi);
      setLucid(lucidInstance);

      const address = await lucidInstance.wallet.address();
      setWalletAddress(address);
      
      // Get Balance (Lovelace)
      const utxos = await lucidInstance.wallet.getUtxos();
      const totalLovelace = utxos.reduce((acc, utxo) => acc + BigInt(utxo.assets.lovelace), 0n);
      setBalance((Number(totalLovelace) / 1_000_000).toFixed(2)); // Convert to ADA

      setIsConnected(true);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect wallet. See console.");
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setBalance(null);
    setIsConnected(false);
    setLucid(null);
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white max-w-sm">
      <h2 className="text-lg font-semibold mb-4 text-green-700">Cardano Badge Wallet</h2>
      
      {!isConnected ? (
        <div className="flex gap-2">
          <button
            onClick={() => connectWallet("nami")}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Nami"}
          </button>
          <button
            onClick={() => connectWallet("eternl")}
            disabled={loading}
            className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600 disabled:opacity-50"
          >
             {loading ? "Connecting..." : "Eternl"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">Address</span>
            <p className="text-sm truncate bg-gray-50 p-2 rounded border font-mono" title={walletAddress || ""}>
              {walletAddress}
            </p>
          </div>
          <div>
             <span className="text-xs font-bold text-gray-500 uppercase">Testnet Balance</span>
             <p className="text-xl font-mono text-green-600">₳ {balance}</p>
          </div>
          <button
            onClick={disconnectWallet}
            className="w-full px-4 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50 text-sm"
          >
            Disconnect Payload
          </button>
        </div>
      )}
    </div>
  );
}
