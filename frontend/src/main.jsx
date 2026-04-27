import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { Toaster } from "react-hot-toast";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { config } from "./config/wagmi";
import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: "#2359f4",
          })}
        >
          <AuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>
          <Toaster position="top-right" />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
