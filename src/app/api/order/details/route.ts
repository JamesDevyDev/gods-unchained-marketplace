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

export async function POST(request: NextRequest) {
    try {
        const { orderIds } = await request.json();

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json(
                { success: false, error: "Invalid order IDs array" },
                { status: 400 }
            );
        }

        console.log(`📋 Fetching batch of ${orderIds.length} orders`);

        const orderPromises = orderIds.map(async (id: string) => {
            const cleanId = cleanOrderId(id);

            try {
                const response = await orderbookSDK.getListing(cleanId);

                if (!response?.result) {
                    console.log(`⚠️ Order not found: ${cleanId}`);
                    return {
                        orderId: cleanId,
                        error: "Order not found",
                        success: false,
                    };
                }

                const order = response.result;
                const price = order.buy?.[0]?.amount || "0";

                // Handle both NativeItem and ERC20Item
                const buyItem = order.buy?.[0];
                const currency = buyItem && 'contractAddress' in buyItem
                    ? buyItem.contractAddress
                    : 'native';

                const tokenId = order.sell?.[0]?.tokenId || null;

                // Handle sell item contract address
                const sellItem = order.sell?.[0];
                const contractAddress = sellItem && 'contractAddress' in sellItem
                    ? sellItem.contractAddress
                    : null;

                const marketplaceFee = calculateMarketplaceFee(price);
                const totalWithFee = (BigInt(price) + BigInt(marketplaceFee)).toString();

                console.log(`✅ Order ${cleanId}: ${price} wei + ${marketplaceFee} fee`);

                return {
                    orderId: cleanId,
                    price,
                    currency,
                    tokenId,
                    contractAddress,
                    marketplaceFee,
                    totalWithFee,
                    seller: order.accountAddress,
                    status: order.status,
                    success: true,
                };
            } catch (error: any) {
                console.error(`❌ Error fetching order ${cleanId}:`, error.message);
                return {
                    orderId: cleanId,
                    error: error.message,
                    success: false,
                };
            }
        });

        const orders = await Promise.all(orderPromises);

        const successfulOrders = orders.filter(o => o.success);
        let totalPrice = BigInt(0);
        let totalFees = BigInt(0);

        successfulOrders.forEach(order => {
            if (order.price) {
                totalPrice += BigInt(order.price);
                totalFees += BigInt(order.marketplaceFee || "0");
            }
        });

        console.log(`📊 Batch summary:`);
        console.log(`   - Total orders: ${orders.length}`);
        console.log(`   - Successful: ${successfulOrders.length}`);
        console.log(`   - Failed: ${orders.filter(o => !o.success).length}`);
        console.log(`   - Total price: ${totalPrice.toString()} wei`);
        console.log(`   - Total fees: ${totalFees.toString()} wei`);

        return NextResponse.json({
            success: true,
            orders,
            summary: {
                total: orders.length,
                successful: successfulOrders.length,
                failed: orders.filter(o => !o.success).length,
                totalPrice: totalPrice.toString(),
                totalFees: totalFees.toString(),
                grandTotal: (totalPrice + totalFees).toString(),
                feePercentage: MARKETPLACE_CONFIG.fee.percentage,
            },
        });

    } catch (error: any) {
        console.error("❌ Error fetching order batch:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to fetch orders"
            },
            { status: 500 }
        );
    }
}