"use client";

import { useCardano } from "@/context/CardanoContext";

export default function CardanoWallet() {
  const { 
    isConnected, 
    walletAddress, 
    balance, 
    connectWallet, 
    disconnectWallet, 
    isConnecting 
  } = useCardano();

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white max-w-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-green-700">Cardano Wallet</h2>
        {isConnected && (
            <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
        )}
      </div>
      
      {!isConnected ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500 mb-1">Connect a wallet to mint badges</p>
          <div className="flex gap-2">
            <button
              onClick={() => connectWallet("nami")}
              disabled={isConnecting}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isConnecting ? "..." : "Nami"}
            </button>
            <button
              onClick={() => connectWallet("eternl")}
              disabled={isConnecting}
              className="flex-1 px-3 py-2 bg-yellow-500 text-black rounded text-sm font-medium hover:bg-yellow-600 disabled:opacity-50 transition-colors"
            >
               {isConnecting ? "..." : "Eternl"}
            </button>
             <button
              onClick={() => connectWallet("lace")}
              disabled={isConnecting}
              className="flex-1 px-3 py-2 bg-pink-600 text-white rounded text-sm font-medium hover:bg-pink-700 disabled:opacity-50 transition-colors"
            >
               {isConnecting ? "..." : "Lace"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Address</span>
            <p className="text-sm truncate bg-gray-50 p-2 rounded border font-mono text-gray-600" title={walletAddress || ""}>
              {walletAddress}
            </p>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Testnet Balance</span>
              <p className="text-xl font-mono text-green-600 leading-none">₳ {balance}</p>
            </div>
            <button
              onClick={disconnectWallet}
              className="text-[10px] font-bold text-red-500 uppercase hover:underline"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
