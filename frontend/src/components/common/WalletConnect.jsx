import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { ChevronDown, Wallet, LogOut } from "lucide-react";
import { truncateAddress } from "../../utils/constants";
import { useState } from "react";

export default function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isLoading } = useConnect();
  const { disconnect } = useDisconnect();
  const [showDropdown, setShowDropdown] = useState(false);

  const injectedConnector = connectors.find((c) => c.id === "injected");

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-orange-500 text-white hover:from-primary-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
        >
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <Wallet size={14} />
          </div>
          <span className="hidden sm:inline font-semibold">
            {truncateAddress(address)}
          </span>
          <span className="sm:hidden font-semibold">
            {truncateAddress(address, 3)}
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform ${
              showDropdown ? "rotate-180" : ""
            }`}
          />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-primary-50 to-orange-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Wallet size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium">
                    Connected Wallet
                  </p>
                  <p className="font-mono text-sm font-semibold text-gray-800 truncate">
                    {truncateAddress(address)}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Full Address</p>
                <p className="font-mono text-xs font-medium text-gray-700 break-all">
                  {address}
                </p>
              </div>
              {chain && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-xs text-gray-500">Network</p>
                    <p className="font-semibold text-sm text-gray-800">
                      {chain.name}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      chain.id === 31337
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    ID: {chain.id}
                  </span>
                </div>
              )}
              {chain && chain.id !== 31337 && (
                <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-xs text-yellow-700 flex items-center gap-1">
                    <span>⚠️</span> Switch to Localhost Hardhat (31337)
                  </p>
                </div>
              )}
              <button
                onClick={() => {
                  disconnect();
                  setShowDropdown(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-semibold border-2 border-red-200 hover:border-red-300"
              >
                <LogOut size={18} />
                Disconnect Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {injectedConnector && (
        <button
          onClick={() => connect({ connector: injectedConnector })}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          <Wallet size={18} />
          <span className="hidden sm:inline">
            {isLoading ? "Connecting..." : "Connect Wallet"}
          </span>
          <span className="sm:hidden">{isLoading ? "..." : "Connect"}</span>
        </button>
      )}
    </div>
  );
}
