// import { NextRequest, NextResponse } from "next/server";
// import { Orderbook } from "@imtbl/orderbook";
// import {
//     MARKETPLACE_CONFIG,
//     cleanOrderId,
// } from "@/app/marketplace-config";

// // ============================================================================
// // TYPES
// // ============================================================================

// interface ListingItem {
//     tokenId: string;
//     contractAddress: string;
//     price: string; // Price in wei as string
// }

// interface CreateListingRequestBody {
//     listings: ListingItem[];
//     walletAddress: string;
// }

// interface CreateListingWithSignatureRequestBody {
//     listings: ListingItem[];
//     walletAddress: string;
//     signature?: string; // For single listing
//     signatures?: string[]; // For bulk listings
// }

// interface ValidationResult {
//     valid: boolean;
//     error?: string;
// }

// interface PrepareListingResponse {
//     success: boolean;
//     mode: "single" | "bulk";
//     listing?: ListingItem;
//     listings?: Array<{
//         listing: ListingItem;
//         message: any;
//     }>;
//     requiresSignature: true;
//     message?: any; // SDK's signableAction.message structure (for single listing)
// }

// interface ExecuteListingResponse {
//     success: boolean;
//     mode: "single" | "bulk";
//     listing?: ListingItem;
//     listings?: ListingItem[];
//     result: {
//         successful_listings: Array<{
//             order_id: string;
//             token_id: string;
//         }>;
//         pending_listings: string[];
//         failed_listings: Array<{
//             token_id?: string;
//             reason_code?: string;
//         }>;
//     };
// }

// // ============================================================================
// // SDK INITIALIZATION
// // ============================================================================

// const orderbookSDK = new Orderbook({
//     baseConfig: {
//         environment: MARKETPLACE_CONFIG.immutable.environment,
//         publishableKey: MARKETPLACE_CONFIG.immutable.publishableKey,
//     },
// });

// // ============================================================================
// // VALIDATION
// // ============================================================================

// /**
//  * Validates the request body for listing creation
//  */
// function validateRequest(body: any): ValidationResult {
//     const { listings, walletAddress } = body;

//     if (!listings || !Array.isArray(listings) || listings.length === 0) {
//         return { valid: false, error: "Invalid listings array" };
//     }

//     if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
//         return { valid: false, error: "Invalid wallet address" };
//     }

//     // Validate each listing
//     for (const listing of listings) {
//         if (!listing.tokenId || typeof listing.tokenId !== 'string') {
//             return { valid: false, error: "Invalid token ID in listing" };
//         }

//         if (!listing.contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(listing.contractAddress)) {
//             return { valid: false, error: "Invalid contract address in listing" };
//         }

//         if (!listing.price || typeof listing.price !== 'string') {
//             return { valid: false, error: "Invalid price in listing" };
//         }

//         // Validate price is a valid number
//         try {
//             const priceBigInt = BigInt(listing.price);
//             if (priceBigInt <= BigInt(0)) {
//                 return { valid: false, error: "Price must be greater than 0" };
//             }
//         } catch (e) {
//             return { valid: false, error: "Invalid price format" };
//         }
//     }

//     // Check limit for bulk listings (Immutable API limit)
//     const MAX_LISTING_CHUNK = 20;
//     if (listings.length > MAX_LISTING_CHUNK) {
//         return {
//             valid: false,
//             error: `Maximum ${MAX_LISTING_CHUNK} listings per transaction`,
//         };
//     }

//     return { valid: true };
// }

// // ============================================================================
// // PREPARE LISTING (Returns message to sign)
// // ============================================================================

// /**
//  * Prepares NFT listing (returns message to sign)
//  * For bulk listings, prepares each listing separately
//  */
// async function prepareListing(
//     listings: ListingItem[],
//     walletAddress: string
// ): Promise<PrepareListingResponse> {
//     if (listings.length === 1) {
//         // Single listing
//         const item = listings[0];
//         const listingParams = {
//             makerAddress: walletAddress,
//             sell: {
//                 contractAddress: item.contractAddress,
//                 tokenId: item.tokenId,
//                 type: 'ERC721' as const,
//             },
//             buy: {
//                 amount: item.price,
//                 type: 'NATIVE' as const,
//             },
//         };

//         const prepareResponse = await orderbookSDK.prepareListing(listingParams) as any;

//         return {
//             success: true,
//             mode: "single",
//             listing: item,
//             requiresSignature: true,
//             message: prepareResponse.signableAction.message,
//         };
//     } else {
//         // Bulk listings - prepare each one separately
//         const preparedListings = await Promise.all(
//             listings.map(async (item) => {
//                 const listingParams = {
//                     makerAddress: walletAddress,
//                     sell: {
//                         contractAddress: item.contractAddress,
//                         tokenId: item.tokenId,
//                         type: 'ERC721' as const,
//                     },
//                     buy: {
//                         amount: item.price,
//                         type: 'NATIVE' as const,
//                     },
//                 };

//                 const prepareResponse = await orderbookSDK.prepareListing(listingParams) as any;

//                 return {
//                     listing: item,
//                     message: prepareResponse.signableAction.message,
//                 };
//             })
//         );

//         return {
//             success: true,
//             mode: "bulk",
//             listings: preparedListings,
//             requiresSignature: true,
//         };
//     }
// }

// // ============================================================================
// // EXECUTE LISTING (With signature)
// // ============================================================================

// /**
//  * Executes NFT listing with signature(s)
//  * Handles single listing with one signature or bulk listings with multiple signatures
//  */
// async function executeListing(
//     listings: ListingItem[],
//     walletAddress: string,
//     signature?: string,
//     signatures?: string[]
// ): Promise<ExecuteListingResponse> {
//     if (listings.length === 1 && signature) {
//         // Single listing
//         const item = listings[0];
//         const listingParams = {
//             makerAddress: walletAddress,
//             sell: {
//                 contractAddress: item.contractAddress,
//                 tokenId: item.tokenId,
//                 type: 'ERC721' as const,
//             },
//             buy: {
//                 amount: item.price,
//                 type: 'NATIVE' as const,
//             },
//         };

//         // Prepare and create listing with signature
//         const prepareResponse = await orderbookSDK.prepareListing(listingParams) as any;

//         const createResponse = await orderbookSDK.createListing({
//             ...prepareResponse,
//             signature,
//         }) as any;

//         const result = {
//             successful_listings: createResponse.result ? [{
//                 order_id: createResponse.result.id || '',
//                 token_id: item.tokenId,
//             }] : [],
//             pending_listings: [],
//             failed_listings: [],
//         };

//         return {
//             success: true,
//             mode: "single",
//             listing: item,
//             result,
//         };
//     } else if (listings.length > 1 && signatures && signatures.length === listings.length) {
//         // Bulk listings - create each one separately
//         const results = await Promise.all(
//             listings.map(async (item, index) => {
//                 try {
//                     const listingParams = {
//                         makerAddress: walletAddress,
//                         sell: {
//                             contractAddress: item.contractAddress,
//                             tokenId: item.tokenId,
//                             type: 'ERC721' as const,
//                         },
//                         buy: {
//                             amount: item.price,
//                             type: 'NATIVE' as const,
//                         },
//                     };

//                     const prepareResponse = await orderbookSDK.prepareListing(listingParams) as any;

//                     const createResponse = await orderbookSDK.createListing({
//                         ...prepareResponse,
//                         signature: signatures[index],
//                     }) as any;

//                     return {
//                         success: true,
//                         order_id: createResponse.result?.id || '',
//                         token_id: item.tokenId,
//                     };
//                 } catch (error: any) {
//                     return {
//                         success: false,
//                         token_id: item.tokenId,
//                         reason_code: error.message || 'Unknown error',
//                     };
//                 }
//             })
//         );

//         const successful = results.filter(r => r.success).map(r => ({
//             order_id: r.order_id!,
//             token_id: r.token_id,
//         }));

//         const failed = results.filter(r => !r.success).map(r => ({
//             token_id: r.token_id,
//             reason_code: r.reason_code,
//         }));

//         const result = {
//             successful_listings: successful,
//             pending_listings: [],
//             failed_listings: failed,
//         };

//         return {
//             success: true,
//             mode: "bulk",
//             listings,
//             result,
//         };
//     } else {
//         throw new Error("Invalid signature configuration for listings");
//     }
// }

// // ============================================================================
// // API ROUTE HANDLERS
// // ============================================================================

// /**
//  * POST handler - Prepares NFT listing (returns message to sign)
//  * Step 1: Client calls this to get the message to sign
//  */
// export async function POST(request: NextRequest) {
//     try {
//         const body: CreateListingRequestBody = await request.json();
//         const { listings, walletAddress } = body;

//         // Validate request
//         const validation = validateRequest(body);
//         if (!validation.valid) {
//             return NextResponse.json(
//                 { success: false, error: validation.error },
//                 { status: 400 }
//             );
//         }

//         // Prepare listing (returns message to sign)
//         const result = await prepareListing(listings, walletAddress);

//         return NextResponse.json(result);

//     } catch (error: any) {
//         console.error("Prepare listing error:", error);
//         return NextResponse.json(
//             {
//                 success: false,
//                 error: error.message || "Failed to prepare listing"
//             },
//             { status: 500 }
//         );
//     }
// }

// /**
//  * PUT handler - Executes NFT listing with signature(s)
//  * Step 2: Client calls this with the signature(s) to complete the listing
//  */
// export async function PUT(request: NextRequest) {
//     try {
//         const body: CreateListingWithSignatureRequestBody = await request.json();
//         const { listings, walletAddress, signature, signatures } = body;

//         // Validate request
//         const validation = validateRequest({ listings, walletAddress });
//         if (!validation.valid) {
//             return NextResponse.json(
//                 { success: false, error: validation.error },
//                 { status: 400 }
//             );
//         }

//         // Validate signature(s)
//         if (listings.length === 1) {
//             if (!signature || typeof signature !== 'string') {
//                 return NextResponse.json(
//                     { success: false, error: "Valid signature required for single listing" },
//                     { status: 400 }
//                 );
//             }
//         } else {
//             if (!signatures || !Array.isArray(signatures) || signatures.length !== listings.length) {
//                 return NextResponse.json(
//                     { success: false, error: "Valid signatures array required for bulk listings (one per listing)" },
//                     { status: 400 }
//                 );
//             }
//         }

//         // Execute listing with signature(s)
//         const result = await executeListing(listings, walletAddress, signature, signatures);

//         return NextResponse.json(result);

//     } catch (error: any) {
//         console.error("Execute listing error:", error);
//         return NextResponse.json(
//             {
//                 success: false,
//                 error: error.message || "Failed to execute listing"
//             },
//             { status: 500 }
//         );
//     }
// }


import { NextRequest, NextResponse } from "next/server";
import { Orderbook } from "@imtbl/orderbook";
import {
    MARKETPLACE_CONFIG,
} from "@/app/marketplace-config";

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
    message?: any;
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
// EXTRACT MESSAGE FROM SDK RESPONSE
// ============================================================================

function bigIntReplacer(_key: string, value: any): any {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
}

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

/**
 * Safely extracts and fixes the signable message from the SDK prepareListing response.
 * 
 * The EIP-712 standard requires:
 * 1. domain: Domain separator
 * 2. types: Type definitions (MUST include EIP712Domain)
 * 3. primaryType: The main type being signed
 * 4. message (or value): The actual data
 */
function extractMessageFromPrepareResponse(prepareResponse: any): any {
    console.log('🔍 Extracting message from SDK response...');

    const signableAction = prepareResponse?.actions?.find(
        (action: any) => action.type === 'SIGNABLE'
    );

    if (signableAction?.message) {
        const rawMessage = signableAction.message;
        const sanitized = sanitizeBigInts(rawMessage);

        // Validate basic structure
        if (!sanitized.domain) {
            throw new Error('Message missing required "domain" field');
        }

        if (!sanitized.types) {
            throw new Error('Message missing required "types" field');
        }

        if (!sanitized.value && !sanitized.message) {
            throw new Error('Message missing required "value" or "message" field');
        }

        // ✅ FIX 1: Add primaryType if missing
        if (!sanitized.primaryType) {
            if (sanitized.types.OrderComponents) {
                sanitized.primaryType = 'OrderComponents';
                console.log('✅ Added primaryType: OrderComponents');
            } else {
                const typeKeys = Object.keys(sanitized.types);
                if (typeKeys.length > 0) {
                    sanitized.primaryType = typeKeys[0];
                    console.log(`✅ Inferred primaryType: ${sanitized.primaryType}`);
                }
            }
        }

        // ✅ FIX 2: Add EIP712Domain type definition if missing
        // This is REQUIRED by the EIP-712 standard but sometimes missing from SDK responses
        if (!sanitized.types.EIP712Domain) {
            console.log('⚠️ EIP712Domain type missing, adding it...');

            // Build EIP712Domain type based on what fields are in the domain
            const domainFields = [];

            if (sanitized.domain.name) {
                domainFields.push({ name: 'name', type: 'string' });
            }
            if (sanitized.domain.version) {
                domainFields.push({ name: 'version', type: 'string' });
            }
            if (sanitized.domain.chainId) {
                domainFields.push({ name: 'chainId', type: 'uint256' });
            }
            if (sanitized.domain.verifyingContract) {
                domainFields.push({ name: 'verifyingContract', type: 'address' });
            }
            if (sanitized.domain.salt) {
                domainFields.push({ name: 'salt', type: 'bytes32' });
            }

            sanitized.types.EIP712Domain = domainFields;
            console.log('✅ Added EIP712Domain type with fields:', domainFields.map(f => f.name).join(', '));
        }

        // ✅ FIX 3: Rename 'value' to 'message' if needed
        // MetaMask's eth_signTypedData_v4 expects the field to be called 'message', not 'value'
        if (sanitized.value && !sanitized.message) {
            console.log('⚠️ Renaming "value" field to "message" for MetaMask compatibility');
            sanitized.message = sanitized.value;
            delete sanitized.value;
        }

        console.log('✅ Message ready for signing');
        console.log('Domain:', sanitized.domain.name);
        console.log('Primary Type:', sanitized.primaryType);
        console.log('Types:', Object.keys(sanitized.types).join(', '));
        console.log('Has message field:', !!sanitized.message);

        return sanitized;
    }

    // Fallback locations
    if (prepareResponse?.signableAction?.message) {
        const message = sanitizeBigInts(prepareResponse.signableAction.message);

        if (!message.primaryType && message.types?.OrderComponents) {
            message.primaryType = 'OrderComponents';
        }

        if (!message.types?.EIP712Domain) {
            message.types.EIP712Domain = [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' },
            ];
        }

        return message;
    }

    if (prepareResponse?.domain && prepareResponse?.types) {
        const message = sanitizeBigInts(prepareResponse);

        if (!message.primaryType && message.types?.OrderComponents) {
            message.primaryType = 'OrderComponents';
        }

        if (!message.types?.EIP712Domain) {
            message.types.EIP712Domain = [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' },
            ];
        }

        return message;
    }

    throw new Error(
        `Could not extract signable message from SDK response. Available keys: ${Object.keys(prepareResponse).join(', ')}`
    );
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
        return {
            valid: false,
            error: `Maximum ${MAX_LISTING_CHUNK} listings per transaction`,
        };
    }

    return { valid: true };
}

// ============================================================================
// PREPARE LISTING
// ============================================================================

async function prepareListing(
    listings: ListingItem[],
    walletAddress: string
): Promise<PrepareListingResponse> {
    if (listings.length === 1) {
        const item = listings[0];
        const listingParams = {
            makerAddress: walletAddress,
            sell: {
                contractAddress: item.contractAddress,
                tokenId: item.tokenId,
                type: 'ERC721' as const,
            },
            buy: createBuyObject(item.price, item.currencyAddress),
        };

        const prepareResponse = await orderbookSDK.prepareListing(listingParams) as any;
        const message = extractMessageFromPrepareResponse(prepareResponse);

        return {
            success: true,
            mode: "single",
            listing: item,
            requiresSignature: true,
            message,
        };
    } else {
        const preparedListings = await Promise.all(
            listings.map(async (item) => {
                const listingParams = {
                    makerAddress: walletAddress,
                    sell: {
                        contractAddress: item.contractAddress,
                        tokenId: item.tokenId,
                        type: 'ERC721' as const,
                    },
                    buy: createBuyObject(item.price, item.currencyAddress),
                };

                const prepareResponse = await orderbookSDK.prepareListing(listingParams) as any;
                const message = extractMessageFromPrepareResponse(prepareResponse);

                return {
                    listing: item,
                    message,
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
// EXECUTE LISTING
// ============================================================================

async function executeListing(
    listings: ListingItem[],
    walletAddress: string,
    signature?: string,
    signatures?: string[]
): Promise<ExecuteListingResponse> {
    if (listings.length === 1 && signature) {
        const item = listings[0];
        const listingParams = {
            makerAddress: walletAddress,
            sell: {
                contractAddress: item.contractAddress,
                tokenId: item.tokenId,
                type: 'ERC721' as const,
            },
            buy: createBuyObject(item.price, item.currencyAddress),
        };

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
                        buy: createBuyObject(item.price, item.currencyAddress),
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
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to prepare listing"
            },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body: CreateListingWithSignatureRequestBody = await request.json();
        const { listings, walletAddress, signature, signatures } = body;

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
        } else {
            if (!signatures || !Array.isArray(signatures) || signatures.length !== listings.length) {
                return NextResponse.json(
                    { success: false, error: "Valid signatures array required for bulk listings (one per listing)" },
                    { status: 400 }
                );
            }
        }

        const result = await executeListing(listings, walletAddress, signature, signatures);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("❌ Execute listing error:", error.message);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to execute listing"
            },
            { status: 500 }
        );
    }
}