import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { injected } from "wagmi/connectors";

// Define Bharat Private Network for zero-gas experience
const bharatNetwork = {
  id: 31337,
  name: "Bharat Private Network",
  nativeCurrency: {
    decimals: 18,
    name: "Rupee",
    symbol: "₹",
  },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
    public: { http: ["http://127.0.0.1:8545"] },
  },
  blockExplorers: {
    default: { name: "Bharat Explorer", url: "http://localhost:8545" },
  },
  // Ensure wallet auto-adds this chain
  testnet: false,
};

const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
  "84e9fcc3c00d41738572ee128f3ce144";

export const config = getDefaultConfig({
  appName: "Bharat Registry — Blockchain Land Registry",
  projectId: projectId,
  // Bharat Network is the ONLY chain for this environment
  chains: [bharatNetwork],
  connectors: [injected()],
  transports: {
    [bharatNetwork.id]: http("http://127.0.0.1:8545"),
  },
  ssr: false,
});

export { bharatNetwork, sepolia, mainnet };
