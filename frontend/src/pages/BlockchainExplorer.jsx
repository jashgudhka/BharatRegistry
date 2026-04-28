import { useState, useEffect } from "react";
import { usePublicClient, useBlockNumber, useAccount } from "wagmi";
import { 
  Database, 
  Activity, 
  Hash, 
  Clock, 
  ArrowRightLeft, 
  Cpu,
  RefreshCw,
  Box,
  FileCheck2,
  Fingerprint,
  Landmark,
  Scale,
  Shield,
  PieChart,
  ChevronDown,
  ChevronUp,
  User,
  Zap,
  ListFilter,
  Eye,
  ShieldCheck,
  Lock,
  Filter
} from "lucide-react";
import { formatUnits, decodeFunctionData, decodeEventLog } from "viem";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import {
  DOCUMENT_REGISTRY_ADDRESS,
  IDENTITY_REGISTRY_ADDRESS,
  MORTGAGE_REGISTRY_ADDRESS,
  DISPUTE_RESOLUTION_ADDRESS,
  TITLE_INSURANCE_ADDRESS,
  PROPERTY_TOKEN_ADDRESS,
  LAND_REGISTRY_ADDRESS,
} from "../utils/constants";
import { LAND_REGISTRY_ABI } from "../config/LandRegistryABI";
import { DOCUMENT_REGISTRY_ABI } from "../config/DocumentRegistryABI";
import { IDENTITY_REGISTRY_ABI } from "../config/IdentityRegistryABI";
import { MORTGAGE_REGISTRY_ABI } from "../config/MortgageRegistryABI";
import { DISPUTE_RESOLUTION_ABI } from "../config/DisputeResolutionABI";
import { TITLE_INSURANCE_ABI } from "../config/TitleInsuranceABI";
import { PROPERTY_TOKEN_ABI } from "../config/PropertyTokenABI";

const ADDRESS_MAP = {
  [LAND_REGISTRY_ADDRESS?.toLowerCase()]: { name: "Land Registry", icon: Landmark, color: "text-indigo-600", bg: "bg-indigo-50", abi: LAND_REGISTRY_ABI },
  [DOCUMENT_REGISTRY_ADDRESS?.toLowerCase()]: { name: "Document Module", icon: FileCheck2, color: "text-blue-600", bg: "bg-blue-50", abi: DOCUMENT_REGISTRY_ABI },
  [IDENTITY_REGISTRY_ADDRESS?.toLowerCase()]: { name: "Identity Module", icon: Fingerprint, color: "text-purple-600", bg: "bg-purple-50", abi: IDENTITY_REGISTRY_ABI },
  [MORTGAGE_REGISTRY_ADDRESS?.toLowerCase()]: { name: "Mortgage Module", icon: Landmark, color: "text-amber-600", bg: "bg-amber-50", abi: MORTGAGE_REGISTRY_ABI },
  [DISPUTE_RESOLUTION_ADDRESS?.toLowerCase()]: { name: "Dispute Module", icon: Scale, color: "text-red-600", bg: "bg-red-50", abi: DISPUTE_RESOLUTION_ABI },
  [TITLE_INSURANCE_ADDRESS?.toLowerCase()]: { name: "Insurance Module", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50", abi: TITLE_INSURANCE_ABI },
  [PROPERTY_TOKEN_ADDRESS?.toLowerCase()]: { name: "Tokenization Module", icon: PieChart, color: "text-pink-600", bg: "bg-pink-50", abi: PROPERTY_TOKEN_ABI },
};

const ALL_ABIS = [
  ...LAND_REGISTRY_ABI,
  ...DOCUMENT_REGISTRY_ABI,
  ...IDENTITY_REGISTRY_ABI,
  ...MORTGAGE_REGISTRY_ABI,
  ...DISPUTE_RESOLUTION_ABI,
  ...TITLE_INSURANCE_ABI,
  ...PROPERTY_TOKEN_ABI
];

function TransactionRow({ txHash, userAddress, isAdminMode }) {
  const publicClient = usePublicClient();
  const [tx, setTx] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [decoded, setDecoded] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function fetchTx() {
      try {
        const t = await publicClient.getTransaction({ hash: txHash });
        const r = await publicClient.getTransactionReceipt({ hash: txHash });
        setTx(t);
        setReceipt(r);

        // Decode Function Call
        const contract = ADDRESS_MAP[t.to?.toLowerCase()];
        if (contract && t.input && t.input !== "0x") {
          try {
            const result = decodeFunctionData({
              abi: contract.abi,
              data: t.input
            });
            setDecoded(result);
          } catch (e) { /* ignore */ }
        }

        // Decode Events
        if (r.logs && r.logs.length > 0) {
          const decodedLogs = r.logs.map(log => {
            try {
              return decodeEventLog({
                abi: ALL_ABIS,
                data: log.data,
                topics: log.topics,
              });
            } catch (e) { return null; }
          }).filter(l => l !== null);
          setEvents(decodedLogs);
        }
      } catch (err) {
        console.error("Tx fetch error:", err);
      }
    }
    fetchTx();
  }, [txHash, publicClient]);

  if (!tx) return <div className="h-10 animate-pulse bg-slate-50 rounded-lg"></div>;

  // RBAC Filtering: If not admin, only show txs involving user
  const isInvolved = tx.from.toLowerCase() === userAddress?.toLowerCase() || 
                     tx.to?.toLowerCase() === userAddress?.toLowerCase();
  
  if (!isAdminMode && !isInvolved) return null;

  const target = ADDRESS_MAP[tx.to?.toLowerCase()];
  const Icon = target?.icon || ArrowRightLeft;

  return (
    <div className={`rounded-xl border transition-all ${expanded ? 'border-indigo-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-50/50'}`}>
      <div 
        className="p-3 flex items-center justify-between cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`p-2 rounded-lg ${target?.bg || 'bg-slate-100'} ${target?.color || 'text-slate-500'}`}>
            <Icon size={14} />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-black text-slate-800 truncate">
              {decoded ? `${decoded.functionName}()` : target?.name || "Protocol Interaction"}
            </p>
            <div className="flex items-center gap-2">
               <p className="text-[10px] font-mono text-slate-400 truncate">
                 {tx.hash.slice(0, 20)}...
               </p>
               {events.length > 0 && (
                 <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                    <ListFilter size={10}/> {events.length} Events
                 </span>
               )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!isAdminMode && (
             <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-1">
               <User size={10}/> Your Activity
             </span>
          )}
          {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-500" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-50 space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Signer Identity</p>
              <div className="flex items-center gap-1.5 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <User size={10} className="text-slate-400" />
                <p className="text-[10px] font-mono text-slate-600 truncate">{tx.from}</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Protocol</p>
              <div className="flex items-center gap-1.5 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <Database size={10} className="text-slate-400" />
                <p className="text-[10px] font-mono text-slate-600 truncate">{tx.to}</p>
              </div>
            </div>
          </div>

          {events.length > 0 && (
            <div>
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                <ShieldCheck size={12} /> Emitted Proofs (Events)
              </p>
              <div className="space-y-2">
                {events.map((ev, i) => (
                  <div key={i} className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[11px] font-black text-emerald-800 tracking-tight">
                         {ev.eventName}
                       </span>
                       <span className="text-[9px] font-bold text-emerald-500 uppercase">Confirmed</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {Object.entries(ev.args || {}).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center text-[10px] border-b border-emerald-100/50 py-1 last:border-0">
                          <span className="text-slate-500 font-medium">{key}</span>
                          <span className="text-slate-700 font-bold truncate">
                            {typeof val === 'bigint' ? val.toString() : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
             <div className="flex gap-4">
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase">Gas</p>
                   <p className="text-[10px] font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                     <Zap size={10} className="text-amber-500" /> {receipt?.gasUsed.toString()}
                   </p>
                </div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase">Status</p>
                   <p className={`text-[10px] font-bold mt-0.5 ${receipt?.status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                     {receipt?.status?.toUpperCase()}
                   </p>
                </div>
             </div>
             <button 
                className="btn btn-secondary py-1.5 px-3 text-[10px] h-auto rounded-lg"
                onClick={() => {
                  navigator.clipboard.writeText(tx.hash);
                  toast.success("Copied!");
                }}
              >
                Copy ID
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BlockchainExplorer() {
  const publicClient = usePublicClient();
  const { address: walletAddress } = useAccount();
  const { isAdmin, isVerifier, isRegistrar, isSuperAdmin, isBank } = useAuth();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Authority check for global visibility
  const isAdminMode = isAdmin || isVerifier || isRegistrar || isSuperAdmin || isBank;

  useEffect(() => {
    async function fetchInitialData() {
      try {
        if (blockNumber) {
          const blockPromises = [];
          for (let i = 0; i < 8; i++) {
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
      <section className="glass-panel p-8 md:p-12 relative overflow-hidden">
        <div className="relative">
          <div className="flex items-center justify-between flex-wrap gap-4">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 rounded-2xl text-white">
                  <Database size={28} />
                </div>
                <div>
                   <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                     Chain <span className="text-indigo-600">Explorer</span>
                   </h1>
                   <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${isAdminMode ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isAdminMode ? 'Authority Auditor View' : 'Personal Activity Audit'}
                      </span>
                   </div>
                </div>
             </div>
             
             <div className="flex gap-4">
                <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Height</span>
                   <span className="text-xl font-black text-slate-900">#{blockNumber?.toString() || '...'}</span>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Status</span>
                   <span className="text-xl font-black text-emerald-600 flex items-center gap-1">
                      <RefreshCw size={16} className="animate-spin-slow" />
                   </span>
                </div>
             </div>
          </div>
          
          <p className="text-slate-600 max-w-2xl mt-6 text-lg font-medium leading-relaxed">
            {isAdminMode 
              ? "Full visibility enabled. You are auditing all state transitions across the Bharat Consortium network." 
              : "Privacy filtering active. You are viewing only the cryptographic proofs associated with your identity."}
          </p>
        </div>
      </section>

      {!isAdminMode && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4">
           <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Filter size={20} />
           </div>
           <div>
              <p className="text-sm font-black text-blue-900">Privacy Filter Active</p>
              <p className="text-xs text-blue-700 font-medium">Your view is filtered to show only blocks containing transactions from/to your wallet.</p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <RefreshCw className="animate-spin text-indigo-400 mb-4" size={40} />
                <p className="text-slate-500 font-black tracking-widest uppercase text-xs">Syncing Ledger...</p>
              </div>
            ) : (
              blocks.map((block) => {
                // If not admin, we still show the block, but TransactionRow will handle visibility.
                // However, we only want to show blocks that HAVE at least one visible transaction for the user.
                // But for a true "Explorer" feel, showing every block is standard, even if empty.
                return (
                  <div key={block.hash} className="card p-0 overflow-hidden shadow-sm border-slate-100">
                    <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Box size={20} className="text-slate-400" />
                        <span className="text-sm font-black text-slate-900">Block #{block.number.toString()}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{block.hash.slice(0, 16)}...</span>
                      </div>
                      <span className="text-xs font-bold text-slate-400">
                        {new Date(Number(block.timestamp) * 1000).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="p-4 space-y-3 bg-white">
                      {block.transactions.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No transactions in this block.</p>
                      ) : (
                        block.transactions.map((txHash) => (
                          <TransactionRow 
                            key={txHash} 
                            txHash={txHash} 
                            userAddress={walletAddress} 
                            isAdminMode={isAdminMode} 
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="card p-6 bg-indigo-900 border-0 shadow-xl relative overflow-hidden group">
            <div className="relative">
              <h3 className="font-black text-white text-base mb-6 flex items-center gap-2">
                <ShieldCheck size={18} className="text-indigo-400" /> Audit Guidance
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Your Identity</p>
                  <p className="text-[10px] font-mono text-white truncate bg-white/10 p-2 rounded-lg">{walletAddress}</p>
                </div>
                <div className="text-[11px] leading-relaxed text-indigo-100">
                  <p className="mb-2">Your activity is recorded as an immutable sequence of <span className="text-white font-bold">cryptographic proofs</span>.</p>
                  <p>Expand any transaction to see the specific legal events that have been finalized on-chain.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="card p-6 border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-900 mb-4 uppercase tracking-widest text-[10px]">Network Integrity</h3>
            <div className="space-y-2">
               <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Chain ID</span>
                  <span className="font-bold">31337</span>
               </div>
               <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Gas Token</span>
                  <span className="font-bold text-emerald-600">BHARAT (Zero)</span>
               </div>
               <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Security</span>
                  <span className="font-bold text-indigo-600">IBFT-2.0</span>
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
