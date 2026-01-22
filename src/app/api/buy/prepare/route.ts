import { NextRequest, NextResponse } from "next/server";
import { Orderbook } from "@imtbl/orderbook";
import {
    MARKETPLACE_CONFIG,
    buildTakerFees,
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
        const { orderIds, walletAddress } = await request.json();
        console.log('Im here')

        // Validation
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json(
                { success: false, error: "Invalid order IDs" },
                { status: 400 }
            );
        }

        if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            return NextResponse.json(
                { success: false, error: "Invalid wallet address" },
                { status: 400 }
            );
        }

        // Check bulk order limit
        if (orderIds.length > MARKETPLACE_CONFIG.limits.maxBulkOrders) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Maximum ${MARKETPLACE_CONFIG.limits.maxBulkOrders} orders per transaction`,
                },
                { status: 400 }
            );
        }

        // ========================================================================
        // SINGLE ORDER PURCHASE
        // ========================================================================
        if (orderIds.length === 1) {
            const orderId = cleanOrderId(orderIds[0]);

            console.log(`📋 Preparing single order: ${orderId}`);

            // Fetch order details to get price
            const orderResponse = await orderbookSDK.getListing(orderId);

            if (!orderResponse?.result) {
                return NextResponse.json(
                    { success: false, error: "Order not found" },
                    { status: 404 }
                );
            }

            const order = orderResponse.result;
            const price = order.buy?.[0]?.amount || "0";

            console.log(`💰 Order price: ${price} wei`);

            // Calculate marketplace fees
            const takerFees = buildTakerFees(price);

            if (takerFees.length > 0) {
                console.log(`💵 Marketplace fee: ${takerFees[0].amount} wei (${MARKETPLACE_CONFIG.fee.percentage}%)`);
            }

            // Prepare the order fulfillment
            const prepareResponse = await orderbookSDK.fulfillOrder(
                orderId,
                walletAddress,
                takerFees
            );

            console.log(`✅ Order prepared with ${prepareResponse.actions.length} actions`);

            return NextResponse.json({
                success: true,
                mode: "single",
                orderId,
                actions: prepareResponse.actions,
                price,
                fee: takerFees.length > 0 ? takerFees[0].amount : "0",
                feePercentage: MARKETPLACE_CONFIG.fee.percentage,
                totalWithFee: (BigInt(price) + BigInt(takerFees.length > 0 ? takerFees[0].amount : "0")).toString(),
            });
        }

        // ========================================================================
        // BULK ORDER PURCHASE
        // ========================================================================

        console.log(`📋 Preparing bulk purchase: ${orderIds.length} orders`);

        // Fetch all order details in parallel
        const orderDetailsPromises = orderIds.map(async (id: string) => {
            const cleanId = cleanOrderId(id);
            const response = await orderbookSDK.getListing(cleanId);

            if (!response?.result) {
                throw new Error(`Order ${cleanId} not found`);
            }

            const order = response.result;
            const price = order.buy?.[0]?.amount || "0";

            return {
                orderId: cleanId,
                price,
            };
        });

        const orderDetails = await Promise.all(orderDetailsPromises);

        // Calculate total prices and fees
        let totalPrice = BigInt(0);
        let totalFees = BigInt(0);

        const listings = orderDetails.map((details) => {
            const takerFees = buildTakerFees(details.price);

            totalPrice += BigInt(details.price);
            if (takerFees.length > 0) {
                totalFees += BigInt(takerFees[0].amount);
            }

            return {
                listingId: details.orderId,
                takerFees,
            };
        });

        console.log(`💰 Total price: ${totalPrice.toString()} wei`);
        console.log(`💵 Total fees: ${totalFees.toString()} wei`);
        console.log(`📊 Grand total: ${(totalPrice + totalFees).toString()} wei`);

        // Prepare bulk fulfillment
        const fulfillResponse = await orderbookSDK.fulfillBulkOrders(
            listings,
            walletAddress
        );

        console.log(`✅ Bulk order prepared:`);
        console.log(`   - Fulfillable: ${fulfillResponse.fulfillableOrders.length}`);
        console.log(`   - Unfulfillable: ${fulfillResponse.unfulfillableOrders.length}`);
        console.log(`   - Sufficient balance: ${fulfillResponse.sufficientBalance}`);

        // Check if balance is sufficient
        if (!fulfillResponse.sufficientBalance) {
            return NextResponse.json({
                success: false,
                error: "Insufficient balance to complete bulk purchase",
                sufficientBalance: false,
                fulfillableOrders: fulfillResponse.fulfillableOrders,
                unfulfillableOrders: fulfillResponse.unfulfillableOrders,
                totalPrice: totalPrice.toString(),
                totalFees: totalFees.toString(),
                grandTotal: (totalPrice + totalFees).toString(),
            }, { status: 400 });
        }

        // Type assertion for when balance is sufficient
        const response = fulfillResponse as any;

        return NextResponse.json({
            success: true,
            mode: "bulk",
            actions: response.actions || [],
            fulfillableOrders: fulfillResponse.fulfillableOrders,
            unfulfillableOrders: fulfillResponse.unfulfillableOrders,
            sufficientBalance: fulfillResponse.sufficientBalance,
            expiration: response.expiration || null,
            totalPrice: totalPrice.toString(),
            totalFees: totalFees.toString(),
            grandTotal: (totalPrice + totalFees).toString(),
            feePercentage: MARKETPLACE_CONFIG.fee.percentage,
        });

    } catch (error: any) {
        console.error("❌ Error preparing purchase:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to prepare purchase"
            },
            { status: 500 }
        );
    }
}