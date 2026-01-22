import { NextRequest, NextResponse } from "next/server";
import { Orderbook } from "@imtbl/orderbook";
import {
    MARKETPLACE_CONFIG,
    calculateMarketplaceFee,
    cleanOrderId,
} from "@/app/marketplace-config";

// Initialize Orderbook SDK
const orderbookSDK = new Orderbook({
    baseConfig: {
        environment: MARKETPLACE_CONFIG.immutable.environment,
        publishableKey: MARKETPLACE_CONFIG.immutable.publishableKey,
    },
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get("orderId");

        if (!orderId) {
            return NextResponse.json(
                { success: false, error: "Order ID is required" },
                { status: 400 }
            );
        }

        const cleanId = cleanOrderId(orderId);

        console.log(`📋 Fetching order details: ${cleanId}`);

        const response = await orderbookSDK.getListing(cleanId);

        if (!response?.result) {
            console.log(`❌ Order not found: ${cleanId}`);
            return NextResponse.json(
                { success: false, error: "Order not found" },
                { status: 404 }
            );
        }

        const order = response.result;
        const price = order.buy?.[0]?.amount || "0";

        // Handle both NativeItem (no contractAddress) and ERC20Item (has contractAddress)
        const buyItem = order.buy?.[0];
        const currency = buyItem && 'contractAddress' in buyItem
            ? buyItem.contractAddress
            : 'native'; // Native token (IMX)

        const tokenId = order.sell?.[0]?.tokenId || null;

        // Handle sell item contract address
        const sellItem = order.sell?.[0];
        const contractAddress = sellItem && 'contractAddress' in sellItem
            ? sellItem.contractAddress
            : null;

        const marketplaceFee = calculateMarketplaceFee(price);
        const totalWithFee = (BigInt(price) + BigInt(marketplaceFee)).toString();

        console.log(`✅ Order found:`);
        console.log(`   - Price: ${price} wei`);
        console.log(`   - Fee: ${marketplaceFee} wei`);
        console.log(`   - Total: ${totalWithFee} wei`);

        return NextResponse.json({
            success: true,
            order: {
                orderId: cleanId,
                price,
                currency,
                tokenId,
                contractAddress,
                marketplaceFee,
                feePercentage: MARKETPLACE_CONFIG.fee.percentage,
                totalWithFee,
                seller: order.accountAddress,
                status: order.status,
                startAt: order.startAt,
                endAt: order.endAt,
                createdAt: order.createdAt,
            },
        });

    } catch (error: any) {
        console.error("❌ Error fetching order details:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to fetch order details"
            },
            { status: 500 }
        );
    }
}