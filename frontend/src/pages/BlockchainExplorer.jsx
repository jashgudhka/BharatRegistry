import { useState, useEffect } from "react";
import { usePublicClient, useBlockNumber } from "wagmi";
import { 
  Database, 
  Activity, 
  Hash, 
  Clock, 
  ArrowRightLeft, 
  Cpu,
  RefreshCw,
  Box
} from "lucide-react";
import toast from "react-hot-toast";

export default function BlockchainExplorer() {
  const publicClient = usePublicClient();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [networkInfo, setNetworkInfo] = useState(null);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const chainId = await publicClient.getChainId();
        setNetworkInfo({ chainId });

        // Fetch last 10 blocks
        if (blockNumber) {
          const blockPromises = [];
          for (let i = 0; i < 10; i++) {
            const bNum = blockNumber - BigInt(i);
            if (bNum < 0n) break;
            blockPromises.push(publicClient.getBlock({ blockNumber: bNum }));
          }
          const results = await Promise.all(blockPromises);
          setBlocks(results);
        }
      } catch (err) {
        console.error("Explorer error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, [publicClient, blockNumber]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <section className="glass-panel p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-200/50 to-purple-200/40 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Database size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Chain Explorer
            </h1>
          </div>
          <p className="text-slate-600 max-w-2xl leading-relaxed">
            Real-time monitoring of the Bharat Private Network. Visualize blocks, transactions, and cryptographic proofs.
          </p>
          
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/60 p-4 rounded-2xl border border-white/40 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Box size={12} /> Current Block
              </p>
              <p className="text-xl font-black text-indigo-600 mt-1">
                #{blockNumber?.toString() || "..."}
              </p>
            </div>
            <div className="bg-white/60 p-4 rounded-2xl border border-white/40 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Cpu size={12} /> Network ID
              </p>
              <p className="text-xl font-black text-slate-900 mt-1">
                {networkInfo?.chainId?.toString() || "1337"} (Besu/Hardhat)
              </p>
            </div>
            <div className="bg-white/60 p-4 rounded-2xl border border-white/40 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <RefreshCw size={12} className="animate-spin-slow" /> Node Status
              </p>
              <p className="text-xl font-black text-emerald-600 mt-1">
                Operational
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Blocks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Activity size={20} className="text-indigo-600" /> Recent Activity
            </h2>
            <span className="text-xs font-bold text-slate-400 uppercase">Live Feed</span>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <RefreshCw className="animate-spin text-slate-400 mb-2" size={32} />
                <p className="text-slate-500 font-medium">Syncing with chain...</p>
              </div>
            ) : (
              blocks.map((block) => (
                <div key={block.hash} className="card p-5 group hover:border-indigo-200 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <Box size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">Block #{block.number.toString()}</span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                            {block.transactions.length} Transactions
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock size={12} /> {new Date(Number(block.timestamp) * 1000).toLocaleTimeString()}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                            <Hash size={12} /> {block.hash.slice(0, 18)}...
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
                      onClick={() => {
                        navigator.clipboard.writeText(block.hash);
                        toast.success("Hash copied!");
                      }}
                    >
                      <Hash size={16} />
                    </button>
                  </div>

                  {/* Transactions inside block */}
                  {block.transactions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Transactions</p>
                      {block.transactions.slice(0, 3).map((txHash) => (
                        <div key={txHash} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100 font-mono">
                          <div className="flex items-center gap-2 truncate">
                            <ArrowRightLeft size={12} className="text-indigo-400 flex-shrink-0" />
                            <span className="text-slate-600 truncate">{txHash}</span>
                          </div>
                        </div>
                      ))}
                      {block.transactions.length > 3 && (
                        <p className="text-[10px] text-slate-400 italic pl-1">
                          + {block.transactions.length - 3} more transactions
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <section className="card p-6 bg-gradient-to-br from-slate-900 to-indigo-900 text-white border-0 shadow-xl shadow-indigo-200/50">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Database size={18} className="text-indigo-300" /> Network Insights
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <p className="text-[10px] font-bold text-indigo-300 uppercase">Protocol</p>
                <p className="text-sm font-medium mt-1">IBFT 2.0 (Istanbul Byzantine Fault Tolerance)</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <p className="text-[10px] font-bold text-indigo-300 uppercase">Node Type</p>
                <p className="text-sm font-medium mt-1">Permissioned Private Network</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <p className="text-[10px] font-bold text-indigo-300 uppercase">Verification</p>
                <p className="text-sm font-medium mt-1">Multi-stage cryptographic state transitions</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-xl bg-indigo-500/20 border border-indigo-400/30">
              <p className="text-xs leading-relaxed text-indigo-100">
                All land registry events are batched into blocks and secured by the validator set. Every change is traceable and forever auditable.
              </p>
            </div>
          </section>

          <section className="card p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Hash size={18} className="text-indigo-600" /> Genesis Info
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Chain ID</span>
                <span className="font-mono text-slate-900">1337</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Currency</span>
                <span className="font-mono text-slate-900">ETH (Native)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Block Time</span>
                <span className="font-mono text-slate-900">Instant/On-demand</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
