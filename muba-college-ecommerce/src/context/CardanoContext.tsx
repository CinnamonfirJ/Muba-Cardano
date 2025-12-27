"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
// Dynamic import for Lucid is tricky in client components if it's large, 
// but lucid-cardano is often used in client.
// However, standard import is fine for client usually if bundler handles it.
// If not, we might need dynamic import or check if previous components worked.
// The previous component `CardanoWallet.tsx` used `import { Lucid } from "lucid-cardano"`.
// If that built fine (which it seemed to), we can use it here.
import { Lucid } from "lucid-cardano";

interface CardanoContextType {
  isConnected: boolean;
  walletAddress: string | null;
  balance: string | null;
  lucid: Lucid | null;
  connectWallet: (walletName: "nami" | "eternl" | "lace") => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
}

const CardanoContext = createContext<CardanoContextType | undefined>(undefined);

export const CardanoProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [lucid, setLucid] = useState<Lucid | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Load state from local storage on mount
  useEffect(() => {
    // Optional: Persist connection
    const savedWallet = localStorage.getItem("connectedWallet");
    if (savedWallet) {
        // We could auto-reconnect here if we want persistent sessions
        // connectWallet(savedWallet as any);
    }
  }, []);

  const connectWallet = async (walletName: "nami" | "eternl" | "lace") => {
    try {
      setIsConnecting(true);

      if (!window.cardano || !window.cardano[walletName]) {
        alert(`Wallet ${walletName} not found. Please install the extension.`);
        return;
      }

      const walletApi = await window.cardano[walletName].enable();
      if (!walletApi) throw new Error("Connection failed or rejected");

      const lucidInstance = await Lucid.new(undefined, "Preprod");
      lucidInstance.selectWallet(walletApi);
      setLucid(lucidInstance);

      const address = await lucidInstance.wallet.address();
      setWalletAddress(address);

      const utxos = await lucidInstance.wallet.getUtxos();
      const totalLovelace = utxos.reduce((acc, utxo) => acc + BigInt(utxo.assets.lovelace), 0n);
      setBalance((Number(totalLovelace) / 1_000_000).toFixed(2));

      setIsConnected(true);
      localStorage.setItem("connectedWallet", walletName);
    } catch (error) {
      console.error("Connection error:", error);
      alert("Failed to connect wallet.");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress(null);
    setBalance(null);
    setLucid(null);
    localStorage.removeItem("connectedWallet");
  };

  return (
    <CardanoContext.Provider
      value={{
        isConnected,
        walletAddress,
        balance,
        lucid,
        connectWallet,
        disconnectWallet,
        isConnecting
      }}
    >
      {children}
    </CardanoContext.Provider>
  );
};

export const useCardano = () => {
  const context = useContext(CardanoContext);
  if (!context) {
    throw new Error("useCardano must be used within a CardanoProvider");
  }
  return context;
};
