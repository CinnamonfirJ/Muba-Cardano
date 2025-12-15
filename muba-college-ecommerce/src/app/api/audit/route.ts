import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, action, seller_id, timestamp, metadata } = body;

    // ------------------------------------------------------------------
    // CARDANO MOCK IMPLEMENTATION
    // In a real implementation, this would:
    // 1. Load the backend wallet (e.g. using Lucid or a private key)
    // 2. Metadata: Construct a transaction with metadata (CIP-20 or similar)
    // 3. Submit the transaction to the Cardano network
    // ------------------------------------------------------------------

    console.log("--------------------------------------------------");
    console.log("🔗 CARDANO AUDIT EVENT RECEIVED");
    console.log(`Order: ${order_id}`);
    console.log(`Action: ${action}`);
    console.log(`Seller: ${seller_id}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Metadata:`, metadata);
    console.log("--------------------------------------------------");

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate specific mock hash based on action
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

    return NextResponse.json({
      success: true,
      data: {
        tx_hash: mockTxHash,
        status: "submitted", // In real Cardano, might be "submitted" or "confirmed" if we wait
        block_height: 12345678, // Mock block
      },
      message: "Audit event recorded on Cardano ledger (Mock)",
    });
  } catch (error: any) {
    console.error("Audit Service Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
