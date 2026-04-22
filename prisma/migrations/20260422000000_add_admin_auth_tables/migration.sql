-- CreateTable
CREATE TABLE "AdminNonce" (
    "nonce"     TEXT        NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNonce_pkey" PRIMARY KEY ("nonce")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "token"         TEXT        NOT NULL,
    "walletAddress" TEXT        NOT NULL,
    "expiresAt"     TIMESTAMP(3) NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("token")
);

-- CreateIndex
CREATE INDEX "AdminSession_walletAddress_idx" ON "AdminSession"("walletAddress");
