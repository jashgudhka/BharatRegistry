import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import {
  Shield,
  FileText,
  Send,
  CheckCircle,
  ArrowRight,
  Building2,
  Users,
  Lock,
  Clock,
  Sparkles,
  Zap,
  Globe,
} from "lucide-react";
import { useTotalProperties } from "../hooks/useContract";

export default function Home() {
  const { isConnected } = useAccount();
  const { total: totalProperties } = useTotalProperties();

  const features = [
    {
      icon: "🔒",
      title: "Safe & Secure",
      titleHindi: "सुरक्षित",
      description:
        "Your property records are completely safe. Nobody can change or delete them.",
      descriptionHindi: "आपके रिकॉर्ड पूरी तरह सुरक्षित हैं",
    },
    {
      icon: "📄",
      title: "Complete History",
      titleHindi: "पूरा इतिहास",
      description:
        "See who owned the property before. Everything is clear and transparent.",
      descriptionHindi: "संपत्ति का पूरा इतिहास देखें",
    },
    {
      icon: "⚡",
      title: "Very Fast",
      titleHindi: "बहुत तेज़",
      description:
        "Register your property in just 2 minutes. No long waiting times!",
      descriptionHindi: "केवल 2 मिनट में पंजीकरण",
    },
    {
      icon: "💰",
      title: "100% FREE",
      titleHindi: "बिल्कुल मुफ़्त",
      description: "No charges, no fees. Completely free service for everyone.",
      descriptionHindi: "कोई शुल्क नहीं, पूरी तरह मुफ्त",
    },
  ];

  const stats = [
    {
      label: "Properties Registered",
      value: totalProperties || "0",
      icon: Building2,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      label: "Secure Transfers",
      value: "100%",
      icon: Shield,
      gradient: "from-green-500 to-emerald-500",
    },
    {
      label: "Processing Time",
      value: "~2min",
      icon: Clock,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      label: "Government Verified",
      value: "✓",
      icon: CheckCircle,
      gradient: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
        </div>

        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-50 to-orange-50 text-primary-600 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 shadow-sm border border-primary-100 animate-bounce">
          <Sparkles size={16} className="text-primary-500" />
          Zero Gas Fees • Permissioned Blockchain
          <Zap size={16} className="text-yellow-500" />
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
          Revolutionizing{" "}
          <span className="bg-gradient-to-r from-primary-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Land Registry
          </span>
          <br />
          <span className="text-gray-700">in India</span>
        </h1>

        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
          A <span className="font-semibold text-gray-800">decentralized</span>{" "}
          land registry system with{" "}
          <span className="font-semibold text-green-600">
            FREE transactions
          </span>
          , eliminating fraud and ensuring transparency through blockchain and
          smart contracts.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isConnected ? (
            <>
              <Link
                to="/register"
                className="btn btn-primary text-lg px-8 py-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <FileText size={22} />
                Register Property
              </Link>
              <Link
                to="/properties"
                className="btn btn-outline text-lg px-8 py-3 hover:-translate-y-0.5 transition-all duration-200"
              >
                Browse Properties
                <ArrowRight size={22} />
              </Link>
            </>
          ) : (
            <>
              <ConnectButton />
              <Link
                to="/properties"
                className="btn btn-outline text-lg px-8 py-3 hover:-translate-y-0.5 transition-all duration-200"
              >
                Browse Properties
                <ArrowRight size={22} />
              </Link>
            </>
          )}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-green-500" />
            <span>Tamper-proof Records</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-blue-500" />
            <span>24/7 Available</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-purple-500" />
            <span>Secure Escrow</span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="card text-center group hover:scale-105 transition-all duration-300 hover:shadow-xl cursor-default overflow-hidden relative"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
            ></div>
            <div
              className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
            >
              <stat.icon className="text-white" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stat.value}
            </div>
            <div className="text-gray-500 text-sm font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      {/* Features Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Bharat Registry?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Traditional land registries are plagued with fraud, delays, and lack
            of transparency. We're changing that with blockchain technology.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="card hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group border-2 border-transparent hover:border-primary-100"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <feature.icon
                  className="text-primary-500 group-hover:text-primary-600"
                  size={28}
                />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 lg:p-12 border-4 border-blue-200">
        <div className="text-center mb-12">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            How to Register Property?
          </h2>
          <p className="text-2xl text-gray-700 font-semibold">
            संपत्ति कैसे पंजीकृत करें?
          </p>
          <p className="text-xl text-gray-600 mt-2">
            Just 3 Easy Steps - केवल 3 आसान चरण
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl p-8 text-center shadow-xl border-4 border-green-200 hover:scale-105 transition-transform">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-3xl flex items-center justify-center text-5xl font-bold mx-auto mb-6 shadow-lg">
              1
            </div>
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="font-bold text-gray-900 mb-2 text-2xl">
              Connect Wallet
            </h3>
            <p className="text-gray-600 text-lg mb-2">
              Click the orange button above
            </p>
            <p className="text-primary-600 font-semibold text-lg">
              वॉलेट कनेक्ट करें
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 text-center shadow-xl border-4 border-blue-200 hover:scale-105 transition-transform">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-cyan-500 text-white rounded-3xl flex items-center justify-center text-5xl font-bold mx-auto mb-6 shadow-lg">
              2
            </div>
            <div className="text-4xl mb-4">📝</div>
            <h3 className="font-bold text-gray-900 mb-2 text-2xl">
              Fill Property Details
            </h3>
            <p className="text-gray-600 text-lg mb-2">
              Enter your property information
            </p>
            <p className="text-primary-600 font-semibold text-lg">
              संपत्ति की जानकारी भरें
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 text-center shadow-xl border-4 border-purple-200 hover:scale-105 transition-transform">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 text-white rounded-3xl flex items-center justify-center text-5xl font-bold mx-auto mb-6 shadow-lg">
              3
            </div>
            <div className="text-4xl mb-4">✅</div>
            <h3 className="font-bold text-gray-900 mb-2 text-2xl">Done!</h3>
            <p className="text-gray-600 text-lg mb-2">
              Your property is registered
            </p>
            <p className="text-primary-600 font-semibold text-lg">
              हो गया! आपकी संपत्ति पंजीकृत है
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 lg:p-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
          Join the future of land ownership. Register your property on the
          blockchain today.
        </p>
        {isConnected ? (
          <Link
            to="/register"
            className="btn bg-white text-primary-600 hover:bg-gray-100"
          >
            Register Your Property
            <ArrowRight size={20} />
          </Link>
        ) : (
          <ConnectButton />
        )}
      </section>
    </div>
  );
}
