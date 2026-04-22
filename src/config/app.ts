export const config = {
  autoDrive: {
    gatewayUrl:
      process.env.NEXT_PUBLIC_AUTO_DRIVE_GATEWAY_URL ||
      "https://gateway.autonomys.xyz/file",
    apiUrl:
      process.env.AUTO_DRIVE_API_URL ||
      "https://mainnet.auto-drive.autonomys.xyz/api",
    apiKey: process.env.AUTO_DRIVE_API_KEY || "",
  },
  payment: {
    // Polling interval when waiting for intent completion (ms)
    pollIntervalMs: 3000,
    // Max time to wait for intent completion (ms)
    pollTimeoutMs: 300000, // 5 minutes
  },
  ai: {
    maxExchangesPerSession: parseInt(
      process.env.AI_MAX_EXCHANGES_PER_SESSION || "30",
      10
    ),
  },
  upload: {
    maxImageSizeBytes: 5 * 1024 * 1024, // 5MB
    chunkSizeBytes: 4 * 1024 * 1024, // 4MB for Vercel compatibility
    allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  moderation: {
    adminWallets: (process.env.ADMIN_WALLETS || "")
      .split(",")
      .filter(Boolean),
  },
} as const;
