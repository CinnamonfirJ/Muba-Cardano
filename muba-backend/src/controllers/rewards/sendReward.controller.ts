import { Request, Response } from "express";

// Environment variables
const BLOCKFROST_API_KEY = process.env.BLOCKFROST_API_KEY || "preprod_YOUR_BLOCKFROST_KEY_HERE"; 
const BLOCKFROST_API_URL = "https://cardano-preprod.blockfrost.io/api/v0";
const SEED_PHRASE = process.env.WALLET_SEED_PHRASE || "your twelve word mnemonic seed phrase here for the funding wallet";

export const SendReward = async (req: Request, res: Response) => {
  try {
    const { walletAddress, amount } = req.body;
    const user = (req as any).user;

    // Basic Auth Check
    if (!user || !user._id) {
      return res.status(401).json({ message: "User not authorized" });
    }

    // Validation
    if (!walletAddress) {
      return res.status(400).json({ message: "Wallet address is required" });
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    // Dynamic import to handle ESM/CJS compatibility issues
    const { Lucid, Blockfrost } = await import("lucid-cardano");

    // Initialize Lucid
    const lucid = await Lucid.new(
      new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_API_KEY),
      "Preprod"
    );

    // Select Server Wallet (Funding Source)
    await lucid.selectWalletFromSeed(SEED_PHRASE);

    // Convert amount to Lovelace (1 ADA = 1,000,000 Lovelace)
    // Using BigInt for precision
    const lovelaceAmount = BigInt(Math.floor(Number(amount) * 1_000_000));

    // Build Transaction
    const tx = await lucid
      .newTx()
      .payToAddress(walletAddress, { lovelace: lovelaceAmount })
      .validTo(Date.now() + 200000)
      .complete();

    // Sign and Submit
    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();

    return res.status(200).json({
      success: true,
      data: {
        txHash,
        amount: amount,
        recipient: walletAddress
      }
    });

  } catch (error) {
    console.error("Reward error:", error);
    return res.status(500).json({ message: "Failed to send reward: " + (error as any).message });
  }
};
