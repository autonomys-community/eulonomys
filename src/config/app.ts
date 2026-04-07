export const config = {
  autoDrive: {
    gatewayUrl:
      process.env.NEXT_PUBLIC_AUTO_DRIVE_GATEWAY_URL ||
      "https://gateway.autonomys.xyz/file",
  },
  ai: {
    maxExchangesPerSession: parseInt(
      process.env.AI_MAX_EXCHANGES_PER_SESSION || "30",
      10
    ),
    maxSessionsPerDay: parseInt(
      process.env.AI_MAX_SESSIONS_PER_DAY || "3",
      10
    ),
    monthlyBudgetCents: parseInt(
      process.env.AI_MONTHLY_BUDGET_CENTS || "5000",
      10
    ),
  },
  upload: {
    maxImageSizeBytes: 5 * 1024 * 1024, // 5MB
    chunkSizeBytes: 4 * 1024 * 1024, // 4MB for Vercel compatibility
    allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  moderation: {
    adminEmailDomains: (process.env.ADMIN_EMAIL_DOMAINS || "").split(",").filter(Boolean),
    adminWallets: (process.env.ADMIN_WALLETS || "").split(",").filter(Boolean),
  },
} as const;
