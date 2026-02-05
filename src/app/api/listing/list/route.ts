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
    decimals?: number; // ⭐ Added decimals field
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
        requiresApproval?: boolean;
        approvalAction?: any;
    }>;
    requiresSignature: true;
    message?: any;
    cacheKey?: string;
    requiresApproval?: boolean;
    approvalAction?: any;
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
// CURRENCY HELPERS - FIXED WITH DECIMAL VALIDATION
// ============================================================================

/**
 * Creates a buy object for the listing with proper currency handling
 * ⭐ KEY FIX: Validates that the price matches the expected decimals
 */
function createBuyObject(price: string, currencyAddress?: string, decimals?: number) {
    console.log('\n💰 ===== CREATE BUY OBJECT =====');
    console.log('Price (wei):', price);
    console.log('Currency address:', currencyAddress);
    console.log('Decimals:', decimals);

    // Validate price format
    try {
        const priceBigInt = BigInt(price);
        if (priceBigInt <= BigInt(0)) {
            throw new Error('Price must be greater than 0');
        }

        // ⭐ CRITICAL: Validate that the price makes sense for the decimals
        if (decimals !== undefined && currencyAddress) {
            const priceString = price.toString();
            const expectedMinLength = decimals; // e.g., USDC with 6 decimals should have at least 6 digits for $1

            console.log('Price length:', priceString.length);
            console.log('Expected min length for 1 unit:', expectedMinLength);

            // For USDC (6 decimals): 200 USDC = 200,000,000 (9 digits)
            // For ETH (18 decimals): 0.001 ETH = 1,000,000,000,000,000 (15 digits)

            // Calculate human-readable price for logging
            const humanReadable = Number(price) / Math.pow(10, decimals);
            console.log('Human-readable price:', humanReadable.toFixed(decimals));

            // Warn if price seems suspiciously small
            if (priceString.length < decimals && priceBigInt < BigInt(Math.pow(10, decimals))) {
                console.warn('⚠️ WARNING: Price seems very small! Double-check decimal conversion.');
                console.warn(`   Price: ${price} (${humanReadable} tokens)`);
            }
        }

    } catch (error: any) {
        console.error('❌ Invalid price format:', error.message);
        throw new Error(`Invalid price format: ${error.message}`);
    }

    // ⭐ KEY FIX: ALL currencies including ETH are ERC20 on zkEVM
    // Only use NATIVE if no currency address is provided
    if (!currencyAddress) {
        console.log('✅ Using NATIVE currency (no address provided)');
        console.log('================================\n');
        return {
            amount: price,
            type: 'NATIVE' as const,
        };
    }

    // All specified currencies (including ETH) are ERC20
    console.log('✅ Using ERC20 currency');
    console.log('   Address:', currencyAddress);
    console.log('   Amount:', price);
    console.log('================================\n');

    return {
        amount: price,
        type: 'ERC20' as const,
        contractAddress: currencyAddress,
    };
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
        // ⭐ Validate decimals if provided
        if (listing.decimals !== undefined) {
            if (typeof listing.decimals !== 'number' || listing.decimals < 0 || listing.decimals > 18) {
                return { valid: false, error: "Invalid decimals (must be between 0 and 18)" };
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
    console.log('\n📋 ===== BUILDING LISTING PARAMS =====');
    console.log('Token ID:', item.tokenId);
    console.log('Contract:', item.contractAddress);
    console.log('Maker:', walletAddress);

    const params = {
        makerAddress: walletAddress,
        sell: {
            contractAddress: item.contractAddress,
            tokenId: item.tokenId,
            type: 'ERC721' as const,
        },
        buy: createBuyObject(item.price, item.currencyAddress, item.decimals),
    };

    console.log('✅ Params built successfully');
    console.log('================================\n');

    return params;
}

// ============================================================================
// PREPARE LISTING (POST)
// ============================================================================

async function prepareListing(
    listings: ListingItem[],
    walletAddress: string
): Promise<PrepareListingResponse> {
    console.log('\n🚀 ===== PREPARE LISTING =====');
    console.log('Listings count:', listings.length);
    console.log('Wallet:', walletAddress);
    console.log('================================\n');

    if (listings.length === 1) {
        const item = listings[0];
        const listingParams = buildListingParams(item, walletAddress);

        console.log('🔄 Calling SDK prepareListing...');
        console.log('Token ID:', item.tokenId);
        console.log('Price (wei):', item.price);
        console.log('Currency:', item.currencyAddress || 'NATIVE');
        console.log('Decimals:', item.decimals);

        const prepareResponse = await orderbookSDK.prepareListing(listingParams) as any;

        console.log('✅ SDK prepareListing returned');
        console.log('📋 Actions:', prepareResponse.actions.map((a: any) => a.type));

        const cacheKey = generateCacheKey(walletAddress, item.tokenId);
        prepareResponseCache.set(cacheKey, prepareResponse);
        console.log('💾 Cached prepare response:', cacheKey);

        // ⭐ CRITICAL: Check for TRANSACTION actions (approvals)
        const transactionAction = prepareResponse.actions.find((a: any) => a.type === 'TRANSACTION');
        const requiresApproval = !!transactionAction;

        if (requiresApproval) {
            console.log('\n⚠️ ===== APPROVAL REQUIRED =====');
            console.log('Token:', item.tokenId);
            console.log('To:', transactionAction.buildTransaction?.to);
            console.log('Has data:', !!transactionAction.buildTransaction?.data);
            console.log('================================\n');
        }

        const message = extractMessageFromPrepareResponse(prepareResponse);

        return {
            success: true,
            mode: "single",
            listing: item,
            requiresSignature: true,
            message,
            cacheKey,
            requiresApproval,
            approvalAction: requiresApproval ? sanitizeBigInts(transactionAction.buildTransaction) : undefined,
        };
    } else {
        console.log('🔄 Preparing bulk listings...');

        const preparedListings = await Promise.all(
            listings.map(async (item, index) => {
                console.log(`\n--- Listing ${index + 1}/${listings.length} ---`);
                const listingParams = buildListingParams(item, walletAddress);

                console.log('🔄 Calling SDK prepareListing...');
                console.log('Token ID:', item.tokenId);
                console.log('Price (wei):', item.price);
                console.log('Currency:', item.currencyAddress || 'NATIVE');
                console.log('Decimals:', item.decimals);

                const prepareResponse = await orderbookSDK.prepareListing(listingParams) as any;

                const cacheKey = generateCacheKey(walletAddress, item.tokenId);
                prepareResponseCache.set(cacheKey, prepareResponse);

                // Check for approval
                const transactionAction = prepareResponse.actions.find((a: any) => a.type === 'TRANSACTION');
                const requiresApproval = !!transactionAction;

                if (requiresApproval) {
                    console.log('⚠️ APPROVAL REQUIRED for this token');
                }

                const message = extractMessageFromPrepareResponse(prepareResponse);

                return {
                    listing: item,
                    message,
                    cacheKey,
                    requiresApproval,
                    approvalAction: requiresApproval ? sanitizeBigInts(transactionAction.buildTransaction) : undefined,
                };
            })
        );

        console.log('\n✅ All bulk listings prepared');
        console.log('================================\n');

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
    console.log('\n🔄 ===== EXECUTE LISTING =====');
    console.log('Token:', item.tokenId);
    console.log('Cache key:', cacheKey);

    const prepareResponse = prepareResponseCache.get(cacheKey);

    if (!prepareResponse) {
        console.error('❌ Cache miss!');
        console.error('Requested key:', cacheKey);
        console.error('Available keys:', prepareResponseCache.keys());
        throw new Error(`Prepare response not found in cache. Key: ${cacheKey}. It may have expired.`);
    }

    console.log('✅ Retrieved cached prepareResponse');

    // ⭐ Use the same pattern as your working code
    console.log('🔄 Calling SDK createListing...');
    const createResponse = await orderbookSDK.createListing({
        makerFees: [],
        orderComponents: (prepareResponse as any).orderComponents,
        orderHash: (prepareResponse as any).orderHash,
        orderSignature: signature,
    }) as any;

    console.log('✅ Listing created successfully');

    // Clean up cache
    prepareResponseCache.del(cacheKey);
    console.log('🗑️ Cache key deleted:', cacheKey);

    const orderId =
        createResponse?.result?.id ||
        createResponse?.order?.id ||
        createResponse?.id ||
        '';

    console.log('📝 Order ID:', orderId);
    console.log('================================\n');

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
    console.log('\n🎯 ===== EXECUTE LISTING =====');
    console.log('Mode:', listings.length === 1 ? 'single' : 'bulk');
    console.log('Listings:', listings.length);
    console.log('================================\n');

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
                console.log(`\n--- Processing listing ${index + 1}/${listings.length} ---`);
                const result = await executeOneListingWithSignature(
                    listings[index],
                    walletAddress,
                    signatures[index],
                    cacheKeys[index]
                );
                console.log(`✅ Listing ${index + 1} created: ${result.order_id}`);
                results.push({ success: true, ...result });
            } catch (error: any) {
                console.error(`❌ Listing ${index + 1} failed:`, error.message);
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

        console.log(`\n✅ Bulk complete: ${successful_listings.length} successful, ${failed_listings.length} failed`);
        console.log('================================\n');

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

        console.log('\n📥 ===== POST REQUEST RECEIVED =====');
        console.log('Listings:', listings.length);
        console.log('Wallet:', walletAddress);
        console.log('Listing details:', JSON.stringify(listings, null, 2));
        console.log('================================\n');

        const validation = validateRequest(body);
        if (!validation.valid) {
            console.error('❌ Validation failed:', validation.error);
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 400 }
            );
        }

        const result = await prepareListing(listings, walletAddress);

        console.log('\n📤 ===== RESPONSE =====');
        console.log('Success:', result.success);
        console.log('Mode:', result.mode);
        console.log('Requires approval:', result.requiresApproval || result.listings?.some(l => l.requiresApproval));
        console.log('================================\n');

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("\n❌ ===== PREPARE LISTING ERROR =====");
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
        console.error("================================\n");
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

        console.log('\n📥 ===== PUT REQUEST RECEIVED =====');
        console.log('Listings count:', listings?.length);
        console.log('Wallet:', walletAddress);
        console.log('Has signature:', !!signature);
        console.log('Has cacheKey:', !!cacheKey);
        console.log('Has signatures:', !!signatures);
        console.log('Has cacheKeys:', !!cacheKeys);
        console.log('================================\n');

        const validation = validateRequest({ listings, walletAddress });
        if (!validation.valid) {
            console.error('❌ Validation failed:', validation.error);
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

        console.log('\n📤 ===== RESPONSE =====');
        console.log('Success:', result.success);
        console.log('Successful listings:', result.result.successful_listings.length);
        console.log('Failed listings:', result.result.failed_listings.length);
        console.log('================================\n');

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("\n❌ ===== EXECUTE LISTING ERROR =====");
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
        console.error("================================\n");
        return NextResponse.json(
            { success: false, error: error.message || "Failed to execute listing" },
            { status: 500 }
        );
    }
}