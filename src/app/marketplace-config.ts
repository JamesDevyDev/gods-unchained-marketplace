// ============================================================================
// MARKETPLACE CONFIGURATION
// ============================================================================

export const MARKETPLACE_CONFIG = {
    // Marketplace Fee Settings
    fee: {
        enabled: true,
        percentage: 0.5, // 0.5%
        walletAddress: "0xed26c1467008b0c5f6f659ea828e055dc44ddcaf", // ⚠️ REPLACE WITH YOUR WALLET
        minimumAmount: "0",
    },

    // Immutable Settings
    immutable: {
        publishableKey: process.env.NEXT_PUBLIC_IMMUTABLE_PUBLISHABLE_KEY || "",
        environment: "production" as any, // ✅ Type assertion workaround
        chainId: 13371,
        rpcUrl: "https://rpc.immutable.com",
    },

    // Purchase Limits
    limits: {
        maxBulkOrders: 20,
    },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function calculateMarketplaceFee(priceWei: string): string {
    if (!MARKETPLACE_CONFIG.fee.enabled) {
        return "0";
    }

    const price = BigInt(priceWei);
    const feePercentage = BigInt(Math.floor(MARKETPLACE_CONFIG.fee.percentage * 100));
    const fee = (price * feePercentage) / BigInt(10000);

    const minimumFee = BigInt(MARKETPLACE_CONFIG.fee.minimumAmount);
    return fee > minimumFee ? fee.toString() : minimumFee.toString();
}

export function buildTakerFees(orderPrice: string) {
    if (!MARKETPLACE_CONFIG.fee.enabled) {
        return [];
    }

    const feeAmount = calculateMarketplaceFee(orderPrice);

    return [
        {
            amount: feeAmount,
            recipientAddress: MARKETPLACE_CONFIG.fee.walletAddress,
        },
    ];
}

export function cleanOrderId(orderId: string): string {
    return orderId.replace(/^zkevm-/, "");
}