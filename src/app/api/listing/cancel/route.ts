import { NextRequest, NextResponse } from "next/server";
import { Orderbook } from "@imtbl/orderbook";
import {
    MARKETPLACE_CONFIG,
} from "@/app/marketplace-config";

// ============================================================================
// TYPES
// ============================================================================

interface CancelOrdersRequestBody {
    orderIds: string[];
    walletAddress: string;
}

interface CancelOrdersWithSignatureRequestBody extends CancelOrdersRequestBody {
    signature: string;
}

interface ValidationResult {
    valid: boolean;
    error?: string;
}

interface PrepareCancelResponse {
    success: boolean;
    mode: "single" | "bulk";
    orderId?: string;
    orderIds?: string[];
    requiresSignature: true;
    message: any; // SDK's signableAction.message structure
}

interface ExecuteCancelResponse {
    success: boolean;
    mode: "single" | "bulk";
    orderId?: string;
    orderIds?: string[];
    result: {
        successful_cancellations: string[];
        pending_cancellations: string[];
        failed_cancellations: Array<{
            order_id?: string;
            reason_code?: string;
        }>;
    };
}

// ============================================================================
// SDK INITIALIZATION
// ============================================================================

const orderbookSDK = new Orderbook({
    baseConfig: {
        environment: MARKETPLACE_CONFIG.immutable.environment,
        publishableKey: MARKETPLACE_CONFIG.immutable.publishableKey,
    },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Clean order ID by removing zkevm- prefix
 * This is critical for the Immutable SDK to work properly
 */
function cleanOrderId(orderId: string): string {
    if (typeof orderId === "string") {
        return orderId.replace(/^zkevm-/, "");
    }
    return orderId;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates the request body for order cancellation
 */
function validateRequest(body: any): ValidationResult {
    const { orderIds, walletAddress } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return { valid: false, error: "Invalid order IDs" };
    }

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return { valid: false, error: "Invalid wallet address" };
    }

    // Check limit for bulk cancellations (Immutable API limit is 20)
    const MAX_CANCEL_CHUNK = 20;
    if (orderIds.length > MAX_CANCEL_CHUNK) {
        return {
            valid: false,
            error: `Maximum ${MAX_CANCEL_CHUNK} orders per transaction`,
        };
    }

    return { valid: true };
}

// ============================================================================
// PREPARE CANCELLATION (Returns message to sign)
// ============================================================================

/**
 * Prepares order cancellation (returns message to sign)
 * Works for both single and bulk cancellations
 */
async function prepareCancellation(
    orderIds: string[],
    walletAddress: string
): Promise<PrepareCancelResponse> {
    // Clean all order IDs (remove zkevm- prefix)
    const cleanIds = orderIds.map(id => cleanOrderId(id));

    // Prepare cancellation message for signing
    const prepareResponse = await orderbookSDK.prepareOrderCancellations(cleanIds) as any;

    return {
        success: true,
        mode: cleanIds.length === 1 ? "single" : "bulk",
        ...(cleanIds.length === 1
            ? { orderId: cleanIds[0] }
            : { orderIds: cleanIds }
        ),
        requiresSignature: true,
        message: prepareResponse.signableAction.message,
    };
}

// ============================================================================
// EXECUTE CANCELLATION (With signature)
// ============================================================================

/**
 * Executes order cancellation with signature
 * Works for both single and bulk cancellations
 */
async function executeCancellation(
    orderIds: string[],
    walletAddress: string,
    signature: string
): Promise<ExecuteCancelResponse> {
    // Clean all order IDs (remove zkevm- prefix)
    const cleanIds = orderIds.map(id => cleanOrderId(id));

    // Execute cancellation with signature
    const cancelResponse = await orderbookSDK.cancelOrders(
        cleanIds,
        walletAddress,
        signature
    ) as any;

    return {
        success: true,
        mode: cleanIds.length === 1 ? "single" : "bulk",
        ...(cleanIds.length === 1
            ? { orderId: cleanIds[0] }
            : { orderIds: cleanIds }
        ),
        result: cancelResponse.result,
    };
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * POST handler - Prepares order cancellation (returns message to sign)
 * Step 1: Client calls this to get the message to sign
 */
export async function POST(request: NextRequest) {
    try {
        const body: CancelOrdersRequestBody = await request.json();
        const { orderIds, walletAddress } = body;

        // Validate request
        const validation = validateRequest(body);
        if (!validation.valid) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 400 }
            );
        }

        // Prepare cancellation (returns message to sign)
        const result = await prepareCancellation(orderIds, walletAddress);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Prepare cancellation error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to prepare order cancellation"
            },
            { status: 500 }
        );
    }
}

/**
 * PUT handler - Executes order cancellation with signature
 * Step 2: Client calls this with the signature to complete the cancellation
 */
export async function PUT(request: NextRequest) {
    try {
        const body: CancelOrdersWithSignatureRequestBody = await request.json();
        const { orderIds, walletAddress, signature } = body;

        // Validate request
        const validation = validateRequest({ orderIds, walletAddress });
        if (!validation.valid) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 400 }
            );
        }

        // Validate signature
        if (!signature || typeof signature !== 'string') {
            return NextResponse.json(
                { success: false, error: "Valid signature required" },
                { status: 400 }
            );
        }

        // Execute cancellation with signature
        const result = await executeCancellation(orderIds, walletAddress, signature);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Execute cancellation error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to execute order cancellation"
            },
            { status: 500 }
        );
    }
}