"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { type ReactNode, useState } from "react";

// Autonomys EVM chain definition
const autonomys = {
  id: 490000,
  name: "Autonomys",
  nativeCurrency: { name: "AI3", symbol: "AI3", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_AUTONOMYS_RPC_URL ||
          "https://auto-evm.taurus.subspace.network/ws",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Autonomys Explorer",
      url: "https://explorer.autonomys.xyz",
    },
  },
} as const;

const wagmiConfig = createConfig({
  chains: [autonomys],
  transports: {
    [autonomys.id]: http(),
  },
  ssr: true,
});

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
