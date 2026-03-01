import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useAuth } from "../hooks/useAuth";
import {
  Shield,
  FileText,
  Send,
  CheckCircle,
  ArrowRight,
  Building2,
  Clock,
  Zap,
  Users,
  Lock,
  Globe,
  Landmark,
  Fingerprint,
  QrCode,
  Layers,
  TrendingUp,
  Award,
  Search,
} from "lucide-react";

export default function Home() {
  const { isConnected } = useAccount();
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="space-y-24 -mt-8">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24">
        {/* Animated background blobs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -top-10 right-10 w-64 h-64 bg-purple-400/15 rounded-full blur-3xl animate-blob delay-1000"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-300/15 rounded-full blur-3xl animate-blob delay-500"></div>

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/70 backdrop-blur-xl rounded-full shadow-sm border border-white/80 mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-bold text-slate-700">
              India's First Blockchain Land Registry
            </span>
            <span className="text-xs font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
              Zero Gas Fees
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-800 leading-tight mb-6 animate-slide-up tracking-tight">
            Secure Your{" "}
            <span className="gradient-text">
              Land Rights
            </span>
            <br />
            On The Blockchain
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-10 animate-slide-up leading-relaxed font-medium" style={{ animationDelay: "100ms" }}>
            A decentralized, tamper-proof land registry system built for 1.4 billion Indians. 
            Register properties, verify documents, and transfer ownership — all transparently on a permissioned blockchain.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
            {!isConnected ? (
              <div className="flex justify-center">
                <ConnectButton label="Connect Wallet to Get Started" showBalance={false} />
              </div>
            ) : !isAuthenticated ? (
              <Link to="/register" className="btn btn-primary text-lg px-8 py-5">
                <Fingerprint size={22} />
                Register Your Identity
                <ArrowRight size={18} />
              </Link>
            ) : (
              <Link to="/dashboard" className="btn btn-primary text-lg px-8 py-5">
                <Layers size={22} />
                Go to Dashboard
                <ArrowRight size={18} />
              </Link>
            )}
            <Link to="/verify" className="btn btn-secondary text-lg px-8 py-5">
              <Search size={22} />
              Verify a Document
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 animate-slide-up" style={{ animationDelay: "300ms" }}>
            {[
              { icon: Shield, label: "Immutable Records", color: "primary" },
              { icon: Fingerprint, label: "Aadhaar Verified", color: "indigo" },
              { icon: Zap, label: "Instant Transfers", color: "amber" },
              { icon: Lock, label: "Tamper Proof", color: "emerald" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-sm font-bold text-slate-600"
              >
                <item.icon size={18} className={`text-${item.color}-500`} />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From registration to ownership transfer — everything secured on the blockchain
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              icon: Fingerprint,
              title: "Register & Verify",
              desc: "Create an account with your PAN & Aadhaar. A government official verifies your identity.",
              color: "from-primary-500 to-indigo-500",
            },
            {
              step: "02",
              icon: Building2,
              title: "Register Property",
              desc: "Submit your property details with survey number, documents, and location on the blockchain.",
              color: "from-purple-500 to-pink-500",
            },
            {
              step: "03",
              icon: FileText,
              title: "Upload Documents",
              desc: "Upload sale deeds and legal documents. Admin verifies and assigns a permanent IPFS hash.",
              color: "from-amber-500 to-orange-500",
            },
            {
              step: "04",
              icon: Send,
              title: "Transfer Ownership",
              desc: "Both parties agree, payment is made, and the smart contract transfers ownership instantly.",
              color: "from-emerald-500 to-teal-500",
            },
          ].map((item, i) => (
            <div key={item.step} className="card card-hover p-6 text-center relative group animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-xs font-extrabold text-slate-500 border">
                {item.step}
              </div>
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                <item.icon className="text-white w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Key Features */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3">
            Why <span className="gradient-text">BharatRegistry</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Inspired by international successes in Georgia and Sweden, tailored for India
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: "Zero Cost Transactions",
              desc: "Our permissioned blockchain eliminates gas fees. All property transactions are completely free for citizens.",
              accent: "bg-emerald-100 text-emerald-700",
            },
            {
              icon: Fingerprint,
              title: "Aadhaar & PAN Integration",
              desc: "Crypto-grade identity verification tied to India's national ID system. No imposters can transact.",
              accent: "bg-indigo-100 text-indigo-700",
            },
            {
              icon: Lock,
              title: "Immutable Records",
              desc: "Once registered, property records cannot be altered. Full ownership history lives forever on-chain.",
              accent: "bg-purple-100 text-purple-700",
            },
            {
              icon: QrCode,
              title: "QR Verification",
              desc: "Every property gets a unique digital token (UPT). Scan to instantly verify ownership status anywhere.",
              accent: "bg-amber-100 text-amber-700",
            },
            {
              icon: Globe,
              title: "Universal & Unified",
              desc: "One platform for all of India — no more state-wise fragmentation. Works across all states and territories.",
              accent: "bg-teal-100 text-teal-700",
            },
            {
              icon: Users,
              title: "Multi-Party Trust",
              desc: "Government verifiers, banks, and citizens all interact on one transparent ledger. No backroom deals.",
              accent: "bg-rose-100 text-rose-700",
            },
          ].map((feature, i) => (
            <div key={feature.title} className="card card-hover p-6 animate-slide-up" style={{ animationDelay: `${i * 75}ms` }}>
              <div className={`w-12 h-12 rounded-xl ${feature.accent} flex items-center justify-center mb-4`}>
                <feature.icon size={24} />
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">{feature.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3">
            Smart Contract <span className="gradient-text">Use Cases</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Automated, transparent processes powered by blockchain smart contracts
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="card p-8 border-l-4 border-l-primary-500 card-hover">
            <h3 className="font-bold text-xl text-slate-800 mb-3 flex items-center gap-2">
              <Send size={20} className="text-primary-500" />
              Property Sale
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Buyer and seller agree on terms and submit a joint transfer request. 
              The Sub-Registrar verifies identities and triggers the smart contract — ownership is transferred instantly.
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="badge badge-verified">Automated</span>
              <span className="badge badge-transferred">Irreversible</span>
            </div>
          </div>

          <div className="card p-8 border-l-4 border-l-amber-500 card-hover">
            <h3 className="font-bold text-xl text-slate-800 mb-3 flex items-center gap-2">
              <Landmark size={20} className="text-amber-500" />
              Bank Mortgage
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Banks can verify property documents and ownership via IPFS hashes. 
              A digital lien is placed on the property token — preventing double-pledging fraud.
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="badge badge-pending">Lien Check</span>
              <span className="badge badge-verified">Fraud-proof</span>
            </div>
          </div>

          <div className="card p-8 border-l-4 border-l-emerald-500 card-hover">
            <h3 className="font-bold text-xl text-slate-800 mb-3 flex items-center gap-2">
              <Award size={20} className="text-emerald-500" />
              Automated Inheritance
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              The "Executable Will" smart contract automatically notifies heirs and initiates transfer 
              upon submission of a verified death certificate. No more "lost heirs."
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="badge badge-verified">Proactive</span>
              <span className="badge badge-transferred">Automated</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <div className="card p-12 bg-gradient-to-br from-primary-50 to-indigo-50 border-primary-100">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-4">
            Ready to Secure Your Property?
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto">
            Join BharatRegistry today. Connect your wallet, verify your identity, and start using 
            India's most transparent land registry.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {!isConnected ? (
              <ConnectButton label="Get Started — Connect Wallet" showBalance={false} />
            ) : !isAuthenticated ? (
              <Link to="/register" className="btn btn-primary text-lg px-8">
                <Fingerprint size={20} /> Register Now <ArrowRight size={18} />
              </Link>
            ) : (
              <Link to="/dashboard" className="btn btn-primary text-lg px-8">
                <Layers size={20} /> Open Dashboard <ArrowRight size={18} />
              </Link>
            )}
            <Link to="/properties" className="btn btn-outline text-lg px-8">
              <Building2 size={20} /> Browse Properties
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
