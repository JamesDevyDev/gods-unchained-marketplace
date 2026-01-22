// ============================================================================
// ORDERBOOK BUY - WITH PERCENTAGE-BASED MARKETPLACE FEES
// Calculates fee per order based on order price
// ============================================================================

import { Orderbook } from "@imtbl/orderbook";
import { Wallet, JsonRpcProvider } from "ethers";

// ============================================================================
// 🔥 HARDCODE YOUR VALUES HERE
// ============================================================================

const HARDCODED_PRIVATE_KEY = "YOUR_PRIVATE_KEY_HERE";
const HARDCODED_PUBLISHABLE_KEY = "pk_imapik-kwXynmKTy@wSdJRUOWov";
const BUYER_WALLET_ADDRESS = "0x11493ba58a5a3bb88332b3dcc5cc11e80e6711d2";

// Order(s) to buy
const ORDER_IDS_TO_BUY = [
  "019b4a3a-a138-5599-3ce4-8659a9d1bf13",
  "019b4a3a-a116-f56f-ced8-8a9c927cf81e",
];

// ============================================================================
// 💰 MARKETPLACE FEE CONFIGURATION
// ============================================================================

// Enable/disable marketplace fee
const ENABLE_MARKETPLACE_FEE = true;

// Marketplace fee wallet (where fees go)
const MARKETPLACE_FEE_WALLET = "0xYourMarketplaceWalletAddress";

// Fee percentage (e.g., 0.5 for 0.5%, 2.5 for 2.5%)
const MARKETPLACE_FEE_PERCENTAGE = 0.5; // 0.5%

// Optional: Minimum fee amount in wei (to avoid very small fees)
const MINIMUM_FEE_AMOUNT = "0"; // Set to "0" for no minimum

// ============================================================================

const ZKEVM_MAINNET = {
  chainId: 13371,
  rpcUrl: "https://rpc.immutable.com",
};

let provider = null;
let signer = null;
let orderbookSDK = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initialize() {
  try {
    console.log("🔥 Initializing...");

    provider = new JsonRpcProvider(ZKEVM_MAINNET.rpcUrl);
    signer = new Wallet(HARDCODED_PRIVATE_KEY, provider);

    orderbookSDK = new Orderbook({
      baseConfig: {
        environment: "production",
        publishableKey: HARDCODED_PUBLISHABLE_KEY,
      },
    });

    console.log(`✅ Wallet: ${BUYER_WALLET_ADDRESS}`);
    console.log("✅ SDK initialized");

    if (ENABLE_MARKETPLACE_FEE) {
      console.log(`\n💰 Marketplace Fee: ${MARKETPLACE_FEE_PERCENTAGE}%`);
      console.log(`   Fee Recipient: ${MARKETPLACE_FEE_WALLET}`);
    } else {
      console.log("\n💰 No marketplace fees");
    }

    return true;
  } catch (error) {
    console.error("❌ Initialization error:", error);
    throw error;
  }
}

// ============================================================================
// UTILITY
// ============================================================================

function cleanOrderId(orderId) {
  if (typeof orderId === "string") {
    return orderId.replace(/^zkevm-/, "");
  }
  return orderId;
}

function formatExpiration(expiration) {
  try {
    if (!expiration) return "N/A";

    if (typeof expiration === "string") {
      return new Date(expiration).toISOString();
    }

    if (typeof expiration === "number") {
      const date =
        expiration > 4102444800
          ? new Date(expiration)
          : new Date(expiration * 1000);
      return date.toISOString();
    }

    return String(expiration);
  } catch (e) {
    return String(expiration);
  }
}

/**
 * Calculate fee amount based on percentage
 */
function calculateFee(priceWei, percentage) {
  const price = BigInt(priceWei);
  const feePercentage = BigInt(Math.floor(percentage * 100)); // Convert to basis points
  const fee = (price * feePercentage) / BigInt(10000); // Divide by 10000 for percentage

  const minimumFee = BigInt(MINIMUM_FEE_AMOUNT);
  return fee > minimumFee ? fee.toString() : minimumFee.toString();
}

// ============================================================================
// FETCH ORDER DETAILS
// ============================================================================

/**
 * Fetch order details to get prices
 */
async function getOrderDetails(orderId) {
  try {
    const cleanId = cleanOrderId(orderId);
    const response = await orderbookSDK.getListing(cleanId);

    if (response && response.result) {
      const order = response.result;
      const price = order.buy && order.buy[0] ? order.buy[0].amount : "0";

      return {
        orderId: cleanId,
        price: price,
        currency:
          order.buy && order.buy[0] ? order.buy[0].contractAddress : null,
        tokenId: order.sell && order.sell[0] ? order.sell[0].tokenId : null,
      };
    }

    throw new Error(`Order ${cleanId} not found`);
  } catch (error) {
    console.error(`Error fetching order ${orderId}:`, error.message);
    throw error;
  }
}

/**
 * Fetch multiple order details in parallel
 */
async function getMultipleOrderDetails(orderIds) {
  console.log(`\n📋 Fetching details for ${orderIds.length} order(s)...`);

  const promises = orderIds.map((orderId) => getOrderDetails(orderId));
  const results = await Promise.all(promises);

  console.log("✅ Order details fetched");

  return results;
}

// ============================================================================
// BUILD TAKER FEES PER ORDER
// ============================================================================

/**
 * Build taker fees array for a single order
 */
function buildTakerFeesForOrder(orderPrice) {
  if (!ENABLE_MARKETPLACE_FEE) {
    return [];
  }

  const feeAmount = calculateFee(orderPrice, MARKETPLACE_FEE_PERCENTAGE);

  return [
    {
      amount: feeAmount,
      recipientAddress: MARKETPLACE_FEE_WALLET,
    },
  ];
}

// ============================================================================
// SINGLE CARD PURCHASE
// ============================================================================

async function buySingleCard(orderId) {
  const cleanId = cleanOrderId(orderId);

  console.log(`\n🛒 Buying single order: ${cleanId}`);

  try {
    // Fetch order details to get price
    const orderDetails = await getOrderDetails(orderId);
    console.log(`   Order price: ${orderDetails.price} wei`);

    // Calculate taker fees based on price
    const takerFees = buildTakerFeesForOrder(orderDetails.price);

    if (takerFees.length > 0) {
      console.log(
        `   Marketplace fee: ${takerFees[0].amount} wei (${MARKETPLACE_FEE_PERCENTAGE}%)`,
      );
    }

    console.log("\n1. Preparing purchase...");
    const prepareResponse = await orderbookSDK.fulfillOrder(
      cleanId,
      BUYER_WALLET_ADDRESS,
      takerFees,
    );

    console.log(`   Actions required: ${prepareResponse.actions.length}`);

    // Handle approvals
    for (const action of prepareResponse.actions) {
      if (action.type === "TRANSACTION" && action.purpose !== "FULFILL_ORDER") {
        console.log("2. Approving payment token...");

        const tx = await signer.sendTransaction({
          to: action.buildTransaction.to,
          data: action.buildTransaction.data,
          value: action.buildTransaction.value || "0",
        });

        console.log(`   Approval TX: ${tx.hash}`);
        await tx.wait();
        console.log("   ✅ Approval confirmed");
      }
    }

    // Execute purchase
    console.log("3. Executing purchase...");
    const fulfillmentAction = prepareResponse.actions.find(
      (a) => a.type === "TRANSACTION" && a.purpose === "FULFILL_ORDER",
    );

    if (!fulfillmentAction) {
      throw new Error("No fulfillment transaction found");
    }

    const purchaseTx = await signer.sendTransaction({
      to: fulfillmentAction.buildTransaction.to,
      data: fulfillmentAction.buildTransaction.data,
      value: fulfillmentAction.buildTransaction.value || "0",
    });

    console.log(`   Purchase TX: ${purchaseTx.hash}`);
    const receipt = await purchaseTx.wait();

    console.log(`\n✅ Purchase successful!`);
    console.log(`   Transaction: ${receipt.hash}`);
    console.log(`   Block: ${receipt.blockNumber}`);

    return {
      success: true,
      mode: "single",
      order_id: cleanId,
      transaction_hash: receipt.hash,
      block_number: receipt.blockNumber,
      price: orderDetails.price,
      fee: takerFees.length > 0 ? takerFees[0].amount : "0",
    };
  } catch (error) {
    console.error(`❌ Purchase failed:`, error.message);
    throw error;
  }
}

// ============================================================================
// BULK PURCHASE
// ============================================================================

async function bulkBuyCardsInOneTransaction(orderIds) {
  if (orderIds.length > 50) {
    throw new Error("Maximum 50 orders per transaction. Split into batches.");
  }

  console.log(
    `\n🛒 Bulk buying ${orderIds.length} cards in ONE transaction...`,
  );

  try {
    // Step 1: Fetch all order details to get prices
    const orderDetailsArray = await getMultipleOrderDetails(orderIds);

    // Step 2: Display order prices and calculate fees
    console.log("\n💰 Order Prices & Fees:");
    let totalPrice = BigInt(0);
    let totalFees = BigInt(0);

    orderDetailsArray.forEach((details, idx) => {
      const fee = ENABLE_MARKETPLACE_FEE
        ? calculateFee(details.price, MARKETPLACE_FEE_PERCENTAGE)
        : "0";

      console.log(`   ${idx + 1}. Order ${details.orderId}`);
      console.log(`      Price: ${details.price} wei`);
      console.log(`      Fee (${MARKETPLACE_FEE_PERCENTAGE}%): ${fee} wei`);

      totalPrice += BigInt(details.price);
      totalFees += BigInt(fee);
    });

    console.log(`\n   📊 TOTAL Price: ${totalPrice.toString()} wei`);
    console.log(`   📊 TOTAL Fees: ${totalFees.toString()} wei`);
    console.log(
      `   📊 Grand Total: ${(totalPrice + totalFees).toString()} wei`,
    );

    // Step 3: Build listings with individual taker fees
    const listings = orderDetailsArray.map((details) => ({
      listingId: details.orderId,
      takerFees: buildTakerFeesForOrder(details.price),
    }));

    console.log("\n1. Preparing bulk fulfillment...");

    const fulfillResponse = await orderbookSDK.fulfillBulkOrders(
      listings,
      BUYER_WALLET_ADDRESS,
    );

    console.log(`   Sufficient balance: ${fulfillResponse.sufficientBalance}`);
    console.log(
      `   Fulfillable orders: ${fulfillResponse.fulfillableOrders.length}`,
    );
    console.log(
      `   Unfulfillable orders: ${fulfillResponse.unfulfillableOrders.length}`,
    );

    if (!fulfillResponse.sufficientBalance) {
      throw new Error("Insufficient balance to complete bulk purchase");
    }

    if (fulfillResponse.unfulfillableOrders.length > 0) {
      console.warn("\n⚠️ WARNING: Some orders are not fulfillable:");
      fulfillResponse.unfulfillableOrders.forEach((order) => {
        console.warn(
          `   - Order ${order.listingId}: ${order.reason || "Unknown reason"}`,
        );
      });
      console.log("\n   Continuing with fulfillable orders only...");
    }

    const { actions, expiration, fulfillableOrders } = fulfillResponse;

    console.log(`\n2. Processing ${actions.length} action(s)...`);
    if (expiration) {
      console.log(`   Transaction expires at: ${formatExpiration(expiration)}`);
    }

    const txHashes = [];

    for (const action of actions) {
      if (action.type === "TRANSACTION") {
        console.log(`\n   Submitting ${action.purpose} transaction...`);

        const builtTx = await action.buildTransaction();
        const tx = await signer.sendTransaction(builtTx);

        console.log(`   TX Hash: ${tx.hash}`);
        console.log(`   Waiting for confirmation...`);

        const receipt = await tx.wait();

        console.log(`   ✅ Confirmed! Block: ${receipt.blockNumber}`);

        txHashes.push({
          purpose: action.purpose,
          hash: receipt.hash,
          blockNumber: receipt.blockNumber,
        });
      }
    }

    console.log("\n✅ BULK PURCHASE SUCCESSFUL!");
    console.log(`   Fulfilled orders: ${fulfillableOrders.length}`);
    console.log(`   Total transactions: ${txHashes.length}`);

    console.log("\n📦 Fulfilled Orders:");
    fulfillableOrders.forEach((order, idx) => {
      console.log(`   ${idx + 1}. Order ID: ${order.id}`);
      if (order.sell && order.sell[0]) {
        console.log(`      Token ID: ${order.sell[0].tokenId}`);
      }
      if (order.buy && order.buy[0]) {
        console.log(`      Price: ${order.buy[0].amount} wei`);
      }
      if (order.fees) {
        const takerFee = order.fees.find((f) => f.type === "TAKER_ECOSYSTEM");
        if (takerFee) {
          console.log(`      Marketplace Fee: ${takerFee.amount} wei`);
        }
      }
    });

    return {
      success: true,
      mode: "bulk",
      totalOrders: orderIds.length,
      fulfilledOrders: fulfillableOrders.length,
      unfulfillableOrders: fulfillResponse.unfulfillableOrders.length,
      transactions: txHashes,
      totalPrice: totalPrice.toString(),
      totalFees: totalFees.toString(),
      expiration: expiration ? formatExpiration(expiration) : null,
    };
  } catch (error) {
    console.error("\n❌ Bulk purchase failed:", error.message);
    throw error;
  }
}

// ============================================================================
// SMART ROUTER
// ============================================================================

async function smartBuy(orderIds) {
  if (!orderIds || orderIds.length === 0) {
    throw new Error("No order IDs provided");
  }

  console.log(`\n📊 Order count: ${orderIds.length}`);

  if (orderIds.length === 1) {
    console.log("🎯 Using SINGLE card purchase mode");
    return await buySingleCard(orderIds[0]);
  } else {
    console.log("🎯 Using BULK purchase mode");
    return await bulkBuyCardsInOneTransaction(orderIds);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    await initialize();

    const result = await smartBuy(ORDER_IDS_TO_BUY);

    console.log("\n🎉 All done!");
    console.log("\nResult:", JSON.stringify(result, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

main();
