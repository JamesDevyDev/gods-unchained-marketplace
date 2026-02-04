import { NextRequest, NextResponse } from "next/server";
import { Orderbook } from "@imtbl/orderbook";
import NodeCache from "node-cache";
import {
    MARKETPLACE_CONFIG,
} from "@/app/marketplace-config";

// ============================================================================
// SERVER-SIDE CACHE FOR RAW PREPARE RESPONSES
// ============================================================================

const prepareResponseCache = new NodeCache({ stdTTL: 600 });

// ============================================================================
// TYPES
// ============================================================================

interface ListingItem {
    tokenId: string;
    contractAddress: string;
    price: string;
    currencyAddress?: string;
}

interface CreateListingRequestBody {
    listings: ListingItem[];
    walletAddress: string;
}

interface CreateListingWithSignatureRequestBody {
    listings: ListingItem[];
    walletAddress: string;
    signature?: string;
    signatures?: string[];
    cacheKey?: string;
    cacheKeys?: string[];
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
        cacheKey?: string;
    }>;
    requiresSignature: true;
    message?: any;
    cacheKey?: string;
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
// CURRENCY HELPERS
// ============================================================================

function getCurrencyType(currencyAddress?: string): 'NATIVE' | 'ERC20' {
    if (!currencyAddress) {
        return 'NATIVE';
    }

    const NATIVE_ETH_ADDRESS = '0x52a6c53869ce09a731cd772f245b97a4401d3348';

    if (currencyAddress.toLowerCase() === NATIVE_ETH_ADDRESS.toLowerCase()) {
        return 'NATIVE';
    }

    return 'ERC20';
}

function createBuyObject(price: string, currencyAddress?: string) {
    const currencyType = getCurrencyType(currencyAddress);

    if (currencyType === 'NATIVE') {
        return {
            amount: price,
            type: 'NATIVE' as const,
        };
    } else {
        return {
            amount: price,
            type: 'ERC20' as const,
            contractAddress: currencyAddress!,
        };
    }
}

// ============================================================================
// BIGINT HELPERS
// ============================================================================

function sanitizeBigInts(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (typeof obj === 'bigint') {
        return obj.toString();
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeBigInts);
    }
    if (typeof obj === 'object') {
        const result: any = {};
        for (const key of Object.keys(obj)) {
            result[key] = sanitizeBigInts(obj[key]);
        }
        return result;
    }
    return obj;
}

// ============================================================================
// CACHE KEY GENERATION
// ============================================================================

function generateCacheKey(walletAddress: string, tokenId: string): string {
    return `prepare_${walletAddress}_${tokenId}_${Date.now()}`;
}

// ============================================================================
// EXTRACT SIGNABLE MESSAGE FROM SDK RESPONSE
// ============================================================================

function extractMessageFromPrepareResponse(prepareResponse: any): any {
    console.log('🔍 Extracting message from SDK response...');

    if (!prepareResponse?.actions || !Array.isArray(prepareResponse.actions)) {
        throw new Error('SDK response missing required actions array');
    }

    const signableAction = prepareResponse.actions.find(
        (action: any) => action.type === 'SIGNABLE'
    );

    if (!signableAction?.message) {
        throw new Error('No SIGNABLE action with message found in SDK response');
    }

    const sanitized = sanitizeBigInts(signableAction.message);

    if (!sanitized.domain) throw new Error('Message missing required "domain" field');
    if (!sanitized.types) throw new Error('Message missing required "types" field');
    if (!sanitized.value && !sanitized.message) throw new Error('Message missing required "value" or "message" field');

    // Add primaryType if missing
    if (!sanitized.primaryType) {
        if (sanitized.types.OrderComponents) {
            sanitized.primaryType = 'OrderComponents';
        } else {
            const typeKeys = Object.keys(sanitized.types).filter(k => k !== 'EIP712Domain');
            if (typeKeys.length > 0) sanitized.primaryType = typeKeys[0];
        }
    }

    // Add EIP712Domain type if missing
    if (!sanitized.types.EIP712Domain) {
        const domainFields = [];
        if (sanitized.domain.name !== undefined) domainFields.push({ name: 'name', type: 'string' });
        if (sanitized.domain.version !== undefined) domainFields.push({ name: 'version', type: 'string' });
        if (sanitized.domain.chainId !== undefined) domainFields.push({ name: 'chainId', type: 'uint256' });
        if (sanitized.domain.verifyingContract !== undefined) domainFields.push({ name: 'verifyingContract', type: 'address' });
        if (sanitized.domain.salt !== undefined) domainFields.push({ name: 'salt', type: 'bytes32' });
        sanitized.types.EIP712Domain = domainFields;
    }

    // MetaMask expects "message" not "value"
    if (sanitized.value && !sanitized.message) {
        sanitized.message = sanitized.value;
        delete sanitized.value;
    }

    return sanitized;
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateRequest(body: any): ValidationResult {
    const { listings, walletAddress } = body;

    if (!listings || !Array.isArray(listings) || listings.length === 0) {
        return { valid: false, error: "Invalid listings array" };
    }

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return { valid: false, error: "Invalid wallet address" };
    }

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
        if (listing.currencyAddress) {
            if (!/^0x[a-fA-F0-9]{40}$/.test(listing.currencyAddress)) {
                return { valid: false, error: "Invalid currency address in listing" };
            }
        }
        try {
            const priceBigInt = BigInt(listing.price);
            if (priceBigInt <= BigInt(0)) {
                return { valid: false, error: "Price must be greater than 0" };
            }
        } catch (e) {
            return { valid: false, error: "Invalid price format" };
        }
    }

    const MAX_LISTING_CHUNK = 20;
    if (listings.length > MAX_LISTING_CHUNK) {
        return { valid: false, error: `Maximum ${MAX_LISTING_CHUNK} listings per transaction` };
    }

    return { valid: true };
}

// ============================================================================
// SHARED HELPER
// ============================================================================

function buildListingParams(item: ListingItem, walletAddress: string) {
    return {
        makerAddress: walletAddress,
        sell: {
            contractAddress: item.contractAddress,
            tokenId: item.tokenId,
            type: 'ERC721' as const,
        },
        buy: createBuyObject(item.price, item.currencyAddress),
    };
}

// ============================================================================
// PREPARE LISTING (POST)
// ============================================================================

async function prepareListing(
    listings: ListingItem[],
    walletAddress: string
): Promise<PrepareListingResponse> {
    if (listings.length === 1) {
        const item = listings[0];
        const listingParams = buildListingParams(item, walletAddress);

        console.log('🔄 Calling SDK prepareListing for token:', item.tokenId);

        const prepareResponse = await orderbookSDK.prepareListing(listingParams) as any;

        console.log('✅ SDK prepareListing returned');

        const cacheKey = generateCacheKey(walletAddress, item.tokenId);
        prepareResponseCache.set(cacheKey, prepareResponse);
        console.log('💾 Cached prepare response:', cacheKey);

        const message = extractMessageFromPrepareResponse(prepareResponse);

        return {
            success: true,
            mode: "single",
            listing: item,
            requiresSignature: true,
            message,
            cacheKey,
        };
    } else {
        const preparedListings = await Promise.all(
            listings.map(async (item) => {
                const listingParams = buildListingParams(item, walletAddress);

                console.log('🔄 Calling SDK prepareListing for token:', item.tokenId);

                const prepareResponse = await orderbookSDK.prepareListing(listingParams) as any;

                const cacheKey = generateCacheKey(walletAddress, item.tokenId);
                prepareResponseCache.set(cacheKey, prepareResponse);

                const message = extractMessageFromPrepareResponse(prepareResponse);

                return {
                    listing: item,
                    message,
                    cacheKey,
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
// EXECUTE LISTING (PUT)
// ============================================================================

async function executeOneListingWithSignature(
    item: ListingItem,
    walletAddress: string,
    signature: string,
    cacheKey: string
): Promise<{ order_id: string; token_id: string }> {
    console.log('🔄 [execute] Token:', item.tokenId);
    console.log('🔑 [execute] Cache key:', cacheKey);

    const prepareResponse = prepareResponseCache.get(cacheKey);

    if (!prepareResponse) {
        console.error('❌ Cache miss! Key:', cacheKey);
        console.error('❌ Available keys:', prepareResponseCache.keys());
        throw new Error(`Prepare response not found in cache. Key: ${cacheKey}. It may have expired.`);
    }

    console.log('✅ [execute] Retrieved cached prepareResponse');

    // ⭐ KEY FIX: Use the same pattern as your working code
    // Instead of passing the whole prepareResponse object,
    // extract orderComponents and orderHash and pass them with signature
    const createResponse = await orderbookSDK.createListing({
        makerFees: [],
        orderComponents: (prepareResponse as any).orderComponents,
        orderHash: (prepareResponse as any).orderHash,
        orderSignature: signature,
    }) as any;

    console.log('✅ [execute] Listing created');

    prepareResponseCache.del(cacheKey);

    const orderId =
        createResponse?.result?.id ||
        createResponse?.order?.id ||
        createResponse?.id ||
        '';

    console.log('✅ [execute] Order ID:', orderId);

    return {
        order_id: orderId,
        token_id: item.tokenId,
    };
}

async function executeListing(
    listings: ListingItem[],
    walletAddress: string,
    signature?: string,
    signatures?: string[],
    cacheKey?: string,
    cacheKeys?: string[]
): Promise<ExecuteListingResponse> {
    if (listings.length === 1 && signature && cacheKey) {
        console.log('🔄 Executing single listing...');
        const successful = await executeOneListingWithSignature(
            listings[0],
            walletAddress,
            signature,
            cacheKey
        );

        return {
            success: true,
            mode: "single",
            listing: listings[0],
            result: {
                successful_listings: [successful],
                pending_listings: [],
                failed_listings: [],
            },
        };

    } else if (listings.length > 1 && signatures && cacheKeys && signatures.length === listings.length && cacheKeys.length === listings.length) {
        console.log(`🔄 Executing ${listings.length} bulk listings...`);

        const results: Array<{ success: boolean; order_id: string; token_id: string; reason_code?: string }> = [];

        for (let index = 0; index < listings.length; index++) {
            try {
                const result = await executeOneListingWithSignature(
                    listings[index],
                    walletAddress,
                    signatures[index],
                    cacheKeys[index]
                );
                console.log(`✅ Listing [${index + 1}/${listings.length}] created: ${result.order_id}`);
                results.push({ success: true, ...result });
            } catch (error: any) {
                console.error(`❌ Listing [${index + 1}/${listings.length}] failed:`, error.message);
                results.push({
                    success: false,
                    order_id: '',
                    token_id: listings[index].tokenId,
                    reason_code: error.message || 'Unknown error',
                });
            }
        }

        const successful_listings = results
            .filter(r => r.success)
            .map(r => ({ order_id: r.order_id, token_id: r.token_id }));

        const failed_listings = results
            .filter(r => !r.success)
            .map(r => ({ token_id: r.token_id, reason_code: r.reason_code }));

        console.log(`✅ Bulk complete: ${successful_listings.length} successful, ${failed_listings.length} failed`);

        return {
            success: true,
            mode: "bulk",
            listings,
            result: {
                successful_listings,
                pending_listings: [],
                failed_listings,
            },
        };

    } else {
        throw new Error("Invalid signature or cache key configuration for listings");
    }
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const body: CreateListingRequestBody = await request.json();
        const { listings, walletAddress } = body;

        const validation = validateRequest(body);
        if (!validation.valid) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 400 }
            );
        }

        const result = await prepareListing(listings, walletAddress);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error("❌ Prepare listing error:", error.message);
        console.error("❌ Stack:", error.stack);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to prepare listing" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body: CreateListingWithSignatureRequestBody = await request.json();
        const { listings, walletAddress, signature, signatures, cacheKey, cacheKeys } = body;

        console.log('\n🔍 ===== PUT REQUEST RECEIVED =====');
        console.log('Listings count:', listings?.length);
        console.log('Wallet:', walletAddress);
        console.log('Has signature:', !!signature);
        console.log('Has cacheKey:', !!cacheKey);
        console.log('================================\n');

        const validation = validateRequest({ listings, walletAddress });
        if (!validation.valid) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 400 }
            );
        }

        if (listings.length === 1) {
            if (!signature || typeof signature !== 'string') {
                return NextResponse.json(
                    { success: false, error: "Valid signature required for single listing" },
                    { status: 400 }
                );
            }
            if (!cacheKey || typeof cacheKey !== 'string') {
                return NextResponse.json(
                    { success: false, error: "Cache key required for single listing" },
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
            if (!cacheKeys || !Array.isArray(cacheKeys) || cacheKeys.length !== listings.length) {
                return NextResponse.json(
                    { success: false, error: "Cache keys array required for bulk listings (one per listing)" },
                    { status: 400 }
                );
            }
        }

        const result = await executeListing(listings, walletAddress, signature, signatures, cacheKey, cacheKeys);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error("❌ Execute listing error:", error.message);
        console.error("❌ Stack:", error.stack);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to execute listing" },
            { status: 500 }
        );
    }
}