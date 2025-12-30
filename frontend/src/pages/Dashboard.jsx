import { useAccount } from "wagmi";
import { Link, Navigate } from "react-router-dom";
import {
  FileText,
  Send,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useOwnerProperties, useTotalProperties } from "../hooks/useContract";
import { useUserTransfers } from "../hooks/useTransfer";

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { propertyIds, isLoading: propertiesLoading } =
    useOwnerProperties(address);
  const { transferIds, isLoading: transfersLoading } =
    useUserTransfers(address);
  const { total: totalProperties } = useTotalProperties();

  if (!isConnected) {
    return <Navigate to="/" replace />;
  }

  const stats = [
    {
      label: "My Properties",
      value: propertyIds?.length || 0,
      icon: FileText,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "My Transfers",
      value: transferIds?.length || 0,
      icon: Send,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Total on Platform",
      value: totalProperties || 0,
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's an overview of your properties and transfers.
          </p>
        </div>
        <Link to="/register" className="btn btn-primary">
          <Plus size={20} />
          Register Property
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}
            >
              <stat.icon size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* My Properties */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              My Properties
            </h2>
            <Link
              to="/properties"
              className="text-primary-500 text-sm hover:underline"
            >
              View All
            </Link>
          </div>

          {propertiesLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : propertyIds?.length > 0 ? (
            <div className="space-y-3">
              {propertyIds.slice(0, 5).map((id) => (
                <Link
                  key={id}
                  to={`/properties/${id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-gray-400" />
                    <span className="font-medium">Property #{id}</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">No properties registered yet</p>
              <Link to="/register" className="btn btn-outline text-sm">
                Register Your First Property
              </Link>
            </div>
          )}
        </div>

        {/* My Transfers */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              My Transfers
            </h2>
            <Link
              to="/transfers"
              className="text-primary-500 text-sm hover:underline"
            >
              View All
            </Link>
          </div>

          {transfersLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : transferIds?.length > 0 ? (
            <div className="space-y-3">
              {transferIds.slice(0, 5).map((id) => (
                <Link
                  key={id}
                  to={`/transfers/${id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Send size={20} className="text-gray-400" />
                    <span className="font-medium">Transfer #{id}</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Send size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">No transfers yet</p>
              <Link to="/properties" className="btn btn-outline text-sm">
                Browse Properties to Buy
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Connected Wallet
        </h2>
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <CheckCircle className="text-primary-500" size={24} />
          </div>
          <div>
            <p className="font-mono text-sm text-gray-600 break-all">
              {address}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Connected to Localhost
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
