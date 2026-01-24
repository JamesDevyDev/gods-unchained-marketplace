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

/**
 * Validates the request body for order purchase
 */
function validateRequest(body: any): { valid: boolean; error?: string } {
    const { orderIds, walletAddress } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return { valid: false, error: "Invalid order IDs" };
    }

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return { valid: false, error: "Invalid wallet address" };
    }

    if (orderIds.length > MARKETPLACE_CONFIG.limits.maxBulkOrders) {
        return {
            valid: false,
            error: `Maximum ${MARKETPLACE_CONFIG.limits.maxBulkOrders} orders per transaction`,
        };
    }

    return { valid: true };
}

/**
 * Builds transaction data from SDK actions
 */
async function buildTransactionActions(actions: any[]): Promise<any[]> {
    return Promise.all(
        actions.map(async (action) => {
            if (action.type === 'TRANSACTION' && typeof action.buildTransaction === 'function') {
                const txData = await action.buildTransaction();

                const builtAction: any = {
                    type: action.type,
                    purpose: action.purpose,
                    to: txData.to,
                    data: txData.data,
                };

                // Handle value field - convert BigInt or set to '0x0' if undefined
                if (txData.value !== undefined && txData.value !== null) {
                    builtAction.value = typeof txData.value === 'bigint'
                        ? '0x' + txData.value.toString(16)
                        : txData.value;
                } else {
                    builtAction.value = '0x0';
                }

                // Handle gasLimit
                if (txData.gasLimit) {
                    builtAction.gasLimit = typeof txData.gasLimit === 'bigint'
                        ? '0x' + txData.gasLimit.toString(16)
                        : txData.gasLimit;
                }

                return builtAction;
            }
            return action;
        })
    );
}

/**
 * Processes a single order purchase
 */
async function processSingleOrder(
    orderId: string,
    walletAddress: string
): Promise<any> {
    const cleanId = cleanOrderId(orderId);

    // Fetch order details
    const orderResponse = await orderbookSDK.getListing(cleanId);

    if (!orderResponse?.result) {
        throw new Error("Order not found");
    }

    const order = orderResponse.result;
    const price = order.buy?.[0]?.amount || "0";

    // Calculate marketplace fees
    const takerFees = buildTakerFees(price);

    // Prepare order fulfillment
    const prepareResponse = await orderbookSDK.fulfillOrder(
        cleanId,
        walletAddress,
        takerFees
    );

    // Build transaction data from actions
    const builtActions = await buildTransactionActions(prepareResponse.actions);

    const feeAmount = takerFees.length > 0 ? takerFees[0].amount : "0";
    const totalWithFee = (BigInt(price) + BigInt(feeAmount)).toString();

    return {
        success: true,
        mode: "single",
        orderId: cleanId,
        actions: builtActions,
        price,
        fee: feeAmount,
        feePercentage: MARKETPLACE_CONFIG.fee.percentage,
        totalWithFee,
    };
}

/**
 * Processes bulk order purchase
 */
async function processBulkOrders(
    orderIds: string[],
    walletAddress: string
): Promise<any> {
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

    // Calculate totals and build listings
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

    const grandTotal = (totalPrice + totalFees).toString();

    // Prepare bulk fulfillment
    const fulfillResponse = await orderbookSDK.fulfillBulkOrders(
        listings,
        walletAddress
    );

    // Check if balance is sufficient
    if (!fulfillResponse.sufficientBalance) {
        return {
            success: false,
            error: "Insufficient balance to complete bulk purchase",
            sufficientBalance: false,
            fulfillableOrders: fulfillResponse.fulfillableOrders,
            unfulfillableOrders: fulfillResponse.unfulfillableOrders,
            totalPrice: totalPrice.toString(),
            totalFees: totalFees.toString(),
            grandTotal,
        };
    }

    // Build bulk actions
    const response = fulfillResponse as any;
    const builtBulkActions = await buildTransactionActions(response.actions || []);

    return {
        success: true,
        mode: "bulk",
        actions: builtBulkActions,
        fulfillableOrders: fulfillResponse.fulfillableOrders,
        unfulfillableOrders: fulfillResponse.unfulfillableOrders,
        sufficientBalance: fulfillResponse.sufficientBalance,
        expiration: response.expiration || null,
        totalPrice: totalPrice.toString(),
        totalFees: totalFees.toString(),
        grandTotal,
        feePercentage: MARKETPLACE_CONFIG.fee.percentage,
    };
}

/**
 * POST handler for order purchase preparation
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log("pumapasok")
        const { orderIds, walletAddress } = body;

        // Validate request
        const validation = validateRequest(body);
        if (!validation.valid) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 400 }
            );
        }

        // Process single or bulk order
        let result;
        if (orderIds.length === 1) {
            result = await processSingleOrder(orderIds[0], walletAddress);
        } else {
            result = await processBulkOrders(orderIds, walletAddress);
        }

        // Handle insufficient balance case
        if (!result.success && result.error === "Insufficient balance to complete bulk purchase") {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to prepare purchase"
            },
            { status: 500 }
        );
    }
}