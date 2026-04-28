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
  Lock
} from "lucide-react";
import { formatUnits, decodeFunctionData, decodeEventLog } from "viem";
import toast from "react-hot-toast";
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

// Combine all ABIs for event decoding
const ALL_ABIS = [
  ...LAND_REGISTRY_ABI,
  ...DOCUMENT_REGISTRY_ABI,
  ...IDENTITY_REGISTRY_ABI,
  ...MORTGAGE_REGISTRY_ABI,
  ...DISPUTE_RESOLUTION_ABI,
  ...TITLE_INSURANCE_ABI,
  ...PROPERTY_TOKEN_ABI
];

function TransactionRow({ txHash }) {
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

        // Decode Events/Logs
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
          {tx.value > 0n && (
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              {formatUnits(tx.value, 18)} ETH
            </span>
          )}
          {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-500" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-50 space-y-4 animate-fade-in">
          {/* Signer/Target Info */}
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

          {/* Events/Logs Section */}
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
                       <span className="text-[9px] font-bold text-emerald-500 uppercase">State Change Confirmed</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {Object.entries(ev.args || {}).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center text-[10px] border-b border-emerald-100/50 py-1 last:border-0">
                          <span className="text-slate-500 font-medium">{key}</span>
                          <span className="text-slate-700 font-bold truncate max-w-[200px]">
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

          {/* Raw Params Section */}
          {decoded && decoded.args && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Input Logic (Raw Params)</p>
              <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto shadow-inner border border-slate-800">
                <pre className="text-[10px] text-emerald-400 font-mono">
                  {JSON.stringify(decoded.args, (key, value) => 
                    typeof value === 'bigint' ? value.toString() : value, 
                  2)}
                </pre>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4 pt-2">
            <div className="flex-1 flex gap-4">
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Gas Consumed</p>
                  <p className="text-[10px] font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                    <Zap size={10} className="text-amber-500" /> {receipt?.gasUsed.toString()}
                  </p>
               </div>
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Finality</p>
                  <p className={`text-[10px] font-bold mt-0.5 ${receipt?.status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {receipt?.status?.toUpperCase()}
                  </p>
               </div>
            </div>
            <button 
                className="btn btn-secondary py-1.5 px-3 text-[10px] h-auto rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(tx.hash);
                  toast.success("Hash copied!");
                }}
              >
                Copy Transaction ID
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
      {/* Hero Header */}
      <section className="glass-panel p-8 md:p-12 relative overflow-hidden bg-gradient-to-br from-white/80 to-slate-50/80">
        <div className="absolute -top-24 -right-16 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/30 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-200">
              <Database size={28} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Chain <span className="text-indigo-600">Explorer</span>
            </h1>
          </div>
          <p className="text-slate-600 max-w-2xl text-lg font-medium leading-relaxed">
            Public transparency is the core of blockchain. This portal allows auditors to verify every state change across the Bharat Consortium.
          </p>
          
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <Box size={14} className="text-indigo-500" /> Block Height
              </p>
              <p className="text-2xl font-black text-slate-900 tabular-nums">
                #{blockNumber?.toString() ?? "..."}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <Cpu size={14} className="text-indigo-500" /> Consensus
              </p>
              <p className="text-2xl font-black text-slate-900">
                IBFT 2.0
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <Zap size={14} className="text-amber-500" /> Gas Cost
              </p>
              <p className="text-2xl font-black text-amber-600">
                ZERO
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <RefreshCw size={14} className="text-emerald-500 animate-spin-slow" /> Node
              </p>
              <p className="text-2xl font-black text-emerald-600">
                SYNCED
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Activity size={20} className="text-indigo-600" /> Real-time Activity
            </h2>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <RefreshCw className="animate-spin text-indigo-400 mb-4" size={40} />
                <p className="text-slate-500 font-black tracking-widest uppercase text-xs">Awaiting Network Packets...</p>
              </div>
            ) : (
              blocks.map((block) => (
                <div key={block.hash} className="card p-0 overflow-hidden group hover:border-indigo-200 transition-all shadow-sm border-slate-100">
                  <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-start justify-between">
                    <div className="flex gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                        <Box size={28} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-slate-900 tracking-tight">Block #{block.number.toString()}</span>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${block.transactions.length > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                            {block.transactions.length} Events
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5">
                          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                            <Clock size={14} className="text-slate-300" /> {new Date(Number(block.timestamp) * 1000).toLocaleTimeString()}
                          </span>
                          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                            <Hash size={14} className="text-slate-300" /> {block.hash.slice(0, 24)}...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4 bg-white">
                    {block.transactions.length === 0 ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-bold italic py-2">
                        <Eye className="opacity-50" size={14} /> Quiet block. No state transitions recorded.
                      </div>
                    ) : (
                      block.transactions.map((txHash) => (
                        <TransactionRow key={txHash} txHash={txHash} />
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <section className="card p-8 bg-indigo-900 border-0 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 text-indigo-400 opacity-20 group-hover:opacity-40 transition-opacity">
              <Lock size={120} strokeWidth={1} />
            </div>
            <div className="relative">
              <h3 className="font-black text-white text-lg mb-6 flex items-center gap-2">
                <ShieldCheck size={20} className="text-indigo-400" /> Auditor F.A.Q
              </h3>
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">Why is this public?</p>
                  <p className="text-xs leading-relaxed text-indigo-100 font-medium">
                    Blockchain is a transparent ledger. While personal details are encrypted, the <span className="text-white font-bold">validity</span> of every property deed must be publicly verifiable to prevent fraud.
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1.5">What are "Events"?</p>
                  <p className="text-xs leading-relaxed text-indigo-100 font-medium">
                    Events are permanent logs emitted by Smart Contracts. They represent specific legal milestones like <span className="text-white font-bold">PropertyVerified</span> or <span className="text-white font-bold">LienAdded</span>.
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest mb-1.5">Is it secure?</p>
                  <p className="text-xs leading-relaxed text-indigo-100 font-medium">
                    Yes. This is a <span className="text-white font-bold">Permissioned Network</span>. Only verified government nodes can update the ledger, though anyone can audit the history.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="card p-6 border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-900 mb-5 flex items-center gap-2 uppercase tracking-widest text-[10px]">
               Consortium Modules
            </h3>
            <div className="space-y-3">
              {Object.values(ADDRESS_MAP).map((m) => (
                <div key={m.name} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${m.bg} ${m.color}`}>
                       <m.icon size={12} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">{m.name}</span>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
