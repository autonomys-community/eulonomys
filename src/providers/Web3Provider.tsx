"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { type ReactNode, useState } from "react";
import { type Chain } from "viem";

// Autonomys Auto-EVM chain definition
// Chain ID and RPC are configurable via env vars for mainnet/testnet switching
const autonomysChainId = parseInt(
  process.env.NEXT_PUBLIC_CHAIN_ID || "870",
  10
);
const autonomysRpcUrl =
  process.env.NEXT_PUBLIC_AUTONOMYS_RPC_URL ||
  "https://auto-evm.mainnet.autonomys.xyz/ws";

const autonomys: Chain = {
  id: autonomysChainId,
  name: "Autonomys",
  nativeCurrency: { name: "AI3", symbol: "AI3", decimals: 18 },
  rpcUrls: {
    default: {
      http: [autonomysRpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: "Autonomys Explorer",
      url:
        process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL ||
        "https://explorer.auto-evm.mainnet.autonomys.xyz",
    },
  },
};

const wagmiConfig = createConfig({
  chains: [autonomys],
  transports: {
    [autonomys.id]: http(),
  },
  ssr: true,
});

export { wagmiConfig };

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
