import { NextRequest, NextResponse } from "next/server";
import { Orderbook } from "@imtbl/orderbook";
import {
    MARKETPLACE_CONFIG,
    cleanOrderId,
} from "@/app/marketplace-config";

// ============================================================================
// TYPES
// ============================================================================

interface ListingItem {
    tokenId: string;
    contractAddress: string;
    price: string; // Price in wei as string
}

interface CreateListingRequestBody {
    listings: ListingItem[];
    walletAddress: string;
}

interface CreateListingWithSignatureRequestBody {
    listings: ListingItem[];
    walletAddress: string;
    signature?: string; // For single listing
    signatures?: string[]; // For bulk listings
}

interface ValidationResult {
    valid: boolean;
    error?: string;
}

interface PrepareListingResponse {
    success: boolean;
    mode: "single" | "bulk";
    listing?: ListingItem;
    listings?: Array<{
        listing: ListingItem;
        message: any;
    }>;
    requiresSignature: true;
    message?: any; // SDK's signableAction.message structure (for single listing)
}

interface ExecuteListingResponse {
    success: boolean;
    mode: "single" | "bulk";
    listing?: ListingItem;
    listings?: ListingItem[];
    result: {
        successful_listings: Array<{
            order_id: string;
            token_id: string;
        }>;
        pending_listings: string[];
        failed_listings: Array<{
            token_id?: string;
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
// VALIDATION
// ============================================================================

/**
 * Validates the request body for listing creation
 */
function validateRequest(body: any): ValidationResult {
    const { listings, walletAddress } = body;

    if (!listings || !Array.isArray(listings) || listings.length === 0) {
        return { valid: false, error: "Invalid listings array" };
    }

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return { valid: false, error: "Invalid wallet address" };
    }

    // Validate each listing
    for (const listing of listings) {
        if (!listing.tokenId || typeof listing.tokenId !== 'string') {
            return { valid: false, error: "Invalid token ID in listing" };
        }

        if (!listing.contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(listing.contractAddress)) {
            return { valid: false, error: "Invalid contract address in listing" };
        }

        if (!listing.price || typeof listing.price !== 'string') {
            return { valid: false, error: "Invalid price in listing" };
        }

        // Validate price is a valid number
        try {
            const priceBigInt = BigInt(listing.price);
            if (priceBigInt <= BigInt(0)) {
                return { valid: false, error: "Price must be greater than 0" };
            }
        } catch (e) {
            return { valid: false, error: "Invalid price format" };
        }
    }

    // Check limit for bulk listings (Immutable API limit)
    const MAX_LISTING_CHUNK = 20;
    if (listings.length > MAX_LISTING_CHUNK) {
        return {
            valid: false,
            error: `Maximum ${MAX_LISTING_CHUNK} listings per transaction`,
        };
    }

    return { valid: true };
}

// ============================================================================
// PREPARE LISTING (Returns message to sign)
// ============================================================================

/**
 * Prepares NFT listing (returns message to sign)
 * For bulk listings, prepares each listing separately
 */
async function prepareListing(
    listings: ListingItem[],
    walletAddress: string
): Promise<PrepareListingResponse> {
    if (listings.length === 1) {
        // Single listing
        const item = listings[0];
        const listingParams = {
            makerAddress: walletAddress,
            sell: {
                contractAddress: item.contractAddress,
                tokenId: item.tokenId,
                type: 'ERC721' as const,
            },
            buy: {
                amount: item.price,
                type: 'NATIVE' as const,
            },
        };

        const prepareResponse = await orderbookSDK.prepareListing(listingParams) as any;

        return {
            success: true,
            mode: "single",
            listing: item,
            requiresSignature: true,
            message: prepareResponse.signableAction.message,
        };
    } else {
        // Bulk listings - prepare each one separately
        const preparedListings = await Promise.all(
            listings.map(async (item) => {
                const listingParams = {
                    makerAddress: walletAddress,
                    sell: {
                        contractAddress: item.contractAddress,
                        tokenId: item.tokenId,
                        type: 'ERC721' as const,
                    },
                    buy: {
                        amount: item.price,
                        type: 'NATIVE' as const,
                    },
                };

                const prepareResponse = await orderbookSDK.prepareListing(listingParams) as any;

                return {
                    listing: item,
                    message: prepareResponse.signableAction.message,
                };
            })
        );

        return {
            success: true,
            mode: "bulk",
            listings: preparedListings,
            requiresSignature: true,
        };
    }
}

// ============================================================================
// EXECUTE LISTING (With signature)
// ============================================================================

/**
 * Executes NFT listing with signature(s)
 * Handles single listing with one signature or bulk listings with multiple signatures
 */
async function executeListing(
    listings: ListingItem[],
    walletAddress: string,
    signature?: string,
    signatures?: string[]
): Promise<ExecuteListingResponse> {
    if (listings.length === 1 && signature) {
        // Single listing
        const item = listings[0];
        const listingParams = {
            makerAddress: walletAddress,
            sell: {
                contractAddress: item.contractAddress,
                tokenId: item.tokenId,
                type: 'ERC721' as const,
            },
            buy: {
                amount: item.price,
                type: 'NATIVE' as const,
            },
        };

        // Prepare and create listing with signature
        const prepareResponse = await orderbookSDK.prepareListing(listingParams) as any;

        const createResponse = await orderbookSDK.createListing({
            ...prepareResponse,
            signature,
        }) as any;

        const result = {
            successful_listings: createResponse.result ? [{
                order_id: createResponse.result.id || '',
                token_id: item.tokenId,
            }] : [],
            pending_listings: [],
            failed_listings: [],
        };

        return {
            success: true,
            mode: "single",
            listing: item,
            result,
        };
    } else if (listings.length > 1 && signatures && signatures.length === listings.length) {
        // Bulk listings - create each one separately
        const results = await Promise.all(
            listings.map(async (item, index) => {
                try {
                    const listingParams = {
                        makerAddress: walletAddress,
                        sell: {
                            contractAddress: item.contractAddress,
                            tokenId: item.tokenId,
                            type: 'ERC721' as const,
                        },
                        buy: {
                            amount: item.price,
                            type: 'NATIVE' as const,
                        },
                    };

                    const prepareResponse = await orderbookSDK.prepareListing(listingParams) as any;

                    const createResponse = await orderbookSDK.createListing({
                        ...prepareResponse,
                        signature: signatures[index],
                    }) as any;

                    return {
                        success: true,
                        order_id: createResponse.result?.id || '',
                        token_id: item.tokenId,
                    };
                } catch (error: any) {
                    return {
                        success: false,
                        token_id: item.tokenId,
                        reason_code: error.message || 'Unknown error',
                    };
                }
            })
        );

        const successful = results.filter(r => r.success).map(r => ({
            order_id: r.order_id!,
            token_id: r.token_id,
        }));

        const failed = results.filter(r => !r.success).map(r => ({
            token_id: r.token_id,
            reason_code: r.reason_code,
        }));

        const result = {
            successful_listings: successful,
            pending_listings: [],
            failed_listings: failed,
        };

        return {
            success: true,
            mode: "bulk",
            listings,
            result,
        };
    } else {
        throw new Error("Invalid signature configuration for listings");
    }
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * POST handler - Prepares NFT listing (returns message to sign)
 * Step 1: Client calls this to get the message to sign
 */
export async function POST(request: NextRequest) {
    try {
        const body: CreateListingRequestBody = await request.json();
        const { listings, walletAddress } = body;

        // Validate request
        const validation = validateRequest(body);
        if (!validation.valid) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 400 }
            );
        }

        // Prepare listing (returns message to sign)
        const result = await prepareListing(listings, walletAddress);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Prepare listing error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to prepare listing"
            },
            { status: 500 }
        );
    }
}

/**
 * PUT handler - Executes NFT listing with signature(s)
 * Step 2: Client calls this with the signature(s) to complete the listing
 */
export async function PUT(request: NextRequest) {
    try {
        const body: CreateListingWithSignatureRequestBody = await request.json();
        const { listings, walletAddress, signature, signatures } = body;

        // Validate request
        const validation = validateRequest({ listings, walletAddress });
        if (!validation.valid) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 400 }
            );
        }

        // Validate signature(s)
        if (listings.length === 1) {
            if (!signature || typeof signature !== 'string') {
                return NextResponse.json(
                    { success: false, error: "Valid signature required for single listing" },
                    { status: 400 }
                );
            }
        } else {
            if (!signatures || !Array.isArray(signatures) || signatures.length !== listings.length) {
                return NextResponse.json(
                    { success: false, error: "Valid signatures array required for bulk listings (one per listing)" },
                    { status: 400 }
                );
            }
        }

        // Execute listing with signature(s)
        const result = await executeListing(listings, walletAddress, signature, signatures);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Execute listing error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to execute listing"
            },
            { status: 500 }
        );
    }
}