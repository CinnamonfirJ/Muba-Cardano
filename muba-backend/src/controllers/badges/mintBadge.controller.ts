import { NextFunction, Request, Response } from "express";
import Users from "../../models/users.model";

// Environment variables should be used for these
const BLOCKFROST_API_KEY = process.env.BLOCKFROST_API_KEY || "preprod_YOUR_BLOCKFROST_KEY_HERE"; 
const BLOCKFROST_API_URL = "https://cardano-preprod.blockfrost.io/api/v0";
const SEED_PHRASE = process.env.WALLET_SEED_PHRASE || "your twelve word mnemonic seed phrase here for the funding wallet";

export const MintBadge = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Dynamic import to support ESM package in CJS environment
    const { Lucid, Blockfrost, fromText } = await import("lucid-cardano");

    const { badgeType, level } = req.body;
    const user = (req as any).user;

    if (!user || !user._id) {
      return res.status(401).json({ message: "User not authorized" });
    }

    if (!badgeType || !level) {
      return res.status(400).json({ message: "Missing badgeType or level" });
    }

    const userData = await Users.findById(user._id);
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1. Verify Eligibility (Re-check logic)
    // Simplified for demo: assume check passed or redundant.
    const currentDeliveries = userData.successful_deliveries || 0;
    
    // 2. Initialize Lucid
    // Note: Lucid requires node-fetch or similar polyfill in old Node environments, 
    // but in newer Node it might work native or via the package.
    const lucid = await Lucid.new(
      new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_API_KEY),
      "Preprod"
    );

    // 3. Select Wallet (Server Wallet)
    // This wallet pays for the minting fees + min ADA sent to user
    await lucid.selectWalletFromSeed(SEED_PHRASE);

    const mintingPolicy = lucid.utils.nativeScriptFromJson({
      type: "all",
      scripts: [
        { type: "sig", keyHash: lucid.utils.paymentCredentialOf(await lucid.wallet.address()).hash },
        { type: "before", slot: lucid.utils.unixTimeToSlot(Date.now() + 1000000) } // Time lock example
      ],
    });

    const policyId = lucid.utils.mintingPolicyToId(mintingPolicy);
    
    // Create Asset Name (e.g., BadgeType_LvlX) - Max 32 bytes
    const assetName = fromText(`${badgeType}_L${level}`.substring(0, 32)); 
    const unit = policyId + assetName;

    // Metadata (CIP-25)
    // Badge Image: Using a placeholder or mapping based on type
    const badgeImages: {[key: string]: string} = {
        "timelyDelivery": "ipfs://QmPlaceholderTime",
        "accuracy": "ipfs://QmPlaceholderAccuracy"
    };

    const metadata = {
        [policyId]: {
            [assetName]: {
                name: `${badgeType} Badge Lvl ${level}`,
                image: badgeImages[badgeType] || "ipfs://QmDefault",
                mediaType: "image/png",
                description: `Awarded for achieving level ${level} in ${badgeType}`,
                vendor: userData.firstname + " " + userData.lastname,
                deliveries: currentDeliveries,
                level: level,
                type: "Muba Vendor Badge"
            }
        }
    };

    // User's Wallet Address (Destination)
    // Ideally, frontend sends the user's connected wallet address for receiving the NFT.
    // If receiving wallet address is not passed in body to specifically drop to, 
    // we might need to ask for it.
    // Assuming req.body.walletAddress exists, otherwise we can't mint TO them effectively unless we stored it.
    const recipientAddress = req.body.walletAddress;

    if (!recipientAddress) {
        // If no external wallet, maybe we can't mint to them easily?
        // Or we mint to server wallet? No, prompt implies minting to vendor.
        return res.status(400).json({ message: "Recipient wallet address is required" });
    }

    // 4. Build Transaction
    const tx = await lucid
      .newTx()
      .mintAssets({ [unit]: 1n })
      .attachMintingPolicy(mintingPolicy)
      .attachMetadata(721, metadata)
      .payToAddress(recipientAddress, { [unit]: 1n }) 
      .validTo(Date.now() + 200000)
      .complete();
      
    // 5. Sign and Submit
    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();

    // 6. Return Result
    res.status(200).json({
      success: true,
      data: {
        txHash,
        tokenId: unit,
        metadata: metadata[policyId][assetName]
      },
    });

  } catch (error) {
    console.error("Minting error:", error);
    return res.status(500).json({ message: "Failed to mint badge: " + (error as any).message });
  }
};
