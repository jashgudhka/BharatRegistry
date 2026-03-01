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
} from "lucide-react";
import { useTotalProperties } from "../hooks/useContract";

export default function Home() {
  const { isConnected } = useAccount();
  const { total: totalProperties } = useTotalProperties();

  const features = [
    {
      icon: Shield,
      title: "Immutable Records",
      description:
        "All property records are stored on the blockchain, making them tamper-proof and permanent.",
    },
    {
      icon: FileText,
      title: "Transparent History",
      description:
        "Complete ownership history is publicly verifiable, eliminating title disputes.",
    },
    {
      icon: Send,
      title: "Fast Transfers",
      description:
        "Property transfers complete in minutes instead of weeks with smart contract automation.",
    },
    {
      icon: Lock,
      title: "Secure Escrow",
      description:
        "Funds are held securely in smart contracts until all conditions are met.",
    },
  ];

  const stats = [
    { label: "Properties Registered", value: totalProperties || "0" },
    { label: "Transactions Processed", value: "0" },
    { label: "Active Users", value: "0" },
    { label: "Platform Fee", value: "1%" },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-12">
        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Shield size={16} />
          Powered by Blockchain Technology
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
          Revolutionizing{" "}
          <span className="text-primary-500">Land Registry</span>
          <br />
          in India
        </h1>

        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          A decentralized land registry system that eliminates fraud, ensures
          transparency, and enables fast property transfers through blockchain
          and smart contracts.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isConnected ? (
            <>
              <Link to="/register" className="btn btn-primary">
                <FileText size={20} />
                Register Property
              </Link>
              <Link to="/properties" className="btn btn-outline">
                Browse Properties
                <ArrowRight size={20} />
              </Link>
            </>
          ) : (
            <>
              <ConnectButton />
              <Link to="/properties" className="btn btn-outline">
                Browse Properties
                <ArrowRight size={20} />
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card text-center">
            <div className="text-3xl font-bold text-primary-500 mb-1">
              {stat.value}
            </div>
            <div className="text-gray-500 text-sm">{stat.label}</div>
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
          {features.map((feature) => (
            <div
              key={feature.title}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="text-primary-500" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-white rounded-2xl p-8 lg:p-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-gray-600">
            Simple steps to register and transfer property
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Connect Wallet</h3>
            <p className="text-gray-600 text-sm">
              Connect your MetaMask or any Web3 wallet to authenticate securely.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Register Property
            </h3>
            <p className="text-gray-600 text-sm">
              Submit property details and documents for verification by
              government officials.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Transfer Securely
            </h3>
            <p className="text-gray-600 text-sm">
              Execute transfers with escrow protection and automatic ownership
              updates.
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
