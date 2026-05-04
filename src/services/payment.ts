/**
 * Payment service — migrated to @autonomys/auto-drive
 *
 * The AutoDrivePaymentService that previously lived here has been moved into
 * the official Autonomys Auto Drive SDK. All payment intent creation, on-chain
 * transaction watching, status polling, and completion waiting are now provided
 * as first-class SDK methods.
 *
 * See: https://github.com/autonomys/auto-sdk/tree/main/packages/auto-drive#pay-with-ai3--purchasing-storage-credits
 *
 * Usage in this app:
 *   import { createAutoDriveApi } from "@autonomys/auto-drive";
 *
 *   const api = createAutoDriveApi({ apiKey: "..." });
 *
 *   const intent  = await api.createPaymentIntent(sizeBytes);
 *   // ... send intent.ai3AmountWei on-chain ...
 *   await api.watchPaymentTransaction(intent.intentId, txHash);
 *   await api.waitForPaymentCompletion(intent.intentId);
 *
 * The server-side route at src/app/api/payment/route.ts calls these methods
 * directly and exposes them to the client over HTTP.
 */
