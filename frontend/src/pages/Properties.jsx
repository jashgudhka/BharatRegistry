import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, MapPin, Maximize, Tag, FileText, ArrowRight, Home } from "lucide-react";
import { useTotalProperties, useProperty } from "../hooks/useContract";
import { PROPERTY_STATUS_LABELS } from "../utils/constants";

function PropertyCard({ propertyId }) {
  const { property, isLoading } = useProperty(propertyId);

  if (isLoading) {
    return (
      <div className="card skeleton h-64 p-6 flex flex-col justify-between">
        <div>
          <div className="h-6 bg-slate-200 rounded-lg w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded-md w-1/2 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded-md w-1/4"></div>
        </div>
        <div className="h-10 bg-slate-200 rounded-xl w-full mt-6"></div>
      </div>
    );
  }

  if (!property) return null;

  const statusColors = {
    pending: "badge-pending",
    verified: "badge-verified",
    disputed: "badge-disputed",
    transferred: "badge-transferred",
  };

  return (
    <Link
      to={`/properties/${propertyId}`}
      className="glass-panel p-6 hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden flex flex-col h-full bg-white/70 hover:bg-white/90 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(84,129,255,0.15)] border-t-4 border-t-primary-400"
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-100 rounded-full blur-xl group-hover:bg-primary-200 transition-colors pointer-events-none"></div>

      <div className="flex justify-between items-start mb-6 relative z-10 w-full">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-5 h-5 text-primary-500" />
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Property #{propertyId}
            </h3>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-7">
            {property.surveyNumber}
          </p>
        </div>
        <span className={`badge ${statusColors[property.status]} ml-4 shrink-0 mt-1`}>
          {PROPERTY_STATUS_LABELS[property.status]}
        </span>
      </div>

      <div className="space-y-4 text-sm font-medium text-slate-600 relative z-10 flex-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
            <MapPin size={16} />
          </div>
          <span className="truncate">{property.location}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <Maximize size={16} />
          </div>
          <span>{property.area.toLocaleString()} Sq Ft</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center shrink-0">
            <Tag size={16} />
          </div>
          <span className="font-bold text-slate-800">₹ {parseFloat(property.marketValue).toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between relative z-10 w-full">
        <p className="text-xs font-semibold text-slate-400">
          Reg: {property.registrationDate.toLocaleDateString()}
        </p>
        <span className="flex items-center gap-1 text-primary-600 text-sm font-bold group-hover:translate-x-1 transition-transform">
          View Detail <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}

export default function Properties() {
  const { total, isLoading } = useTotalProperties();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Generate array of property IDs (1 to total)
  const propertyIds = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="space-y-8 animate-fade-in relative z-10 w-full">
      {/* Header */}
      <div className="glass-panel p-8 mb-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-primary-500 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-100 shrink-0 rounded-full blur-3xl opacity-50 z-0"></div>
        <div className="flex items-center gap-5 relative z-10 w-full">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <FileText className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Public Registry</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">
              Browse all verifiable property records on the blockchain
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 glass-panel p-4 items-center">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by survey number or location..."
            className="input pl-12 py-3 w-full bg-slate-50 border-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 bg-slate-100 shrink-0 rounded-xl flex items-center justify-center hidden sm:flex">
            <Filter size={20} className="text-slate-500" />
          </div>
          <select
            className="input py-3 w-full sm:w-auto bg-slate-50 border-slate-200 font-medium text-slate-700 cursor-pointer appearance-none pr-10"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path সীম '%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="disputed">Disputed</option>
            <option value="transferred">Transferred</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          Showing {propertyIds.length} properties
        </span>
      </div>

      {/* Property Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel p-6 h-64 skeleton flex flex-col justify-between">
              <div>
                 <div className="h-6 bg-slate-200/50 rounded w-1/3 mb-2"></div>
                 <div className="h-4 bg-slate-200/50 rounded w-1/4 mb-6"></div>
                 <div className="h-4 bg-slate-200/50 rounded w-3/4 mb-3"></div>
                 <div className="h-4 bg-slate-200/50 rounded w-1/2"></div>
              </div>
              <div className="h-4 bg-slate-200/50 rounded w-1/4 mt-auto"></div>
            </div>
          ))}
        </div>
      ) : propertyIds.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {propertyIds.map((id) => (
            <PropertyCard key={id} propertyId={id} />
          ))}
        </div>
      ) : (
        <div className="glass-panel border-dashed border-2 p-12 text-center max-w-2xl mx-auto flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <Search size={32} className="text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">
            No properties found
          </h3>
          <p className="text-slate-500 font-medium mb-8">
            Be the pioneer! Register the very first property on the decentralized registry block.
          </p>
          <Link to="/register" className="btn btn-primary px-8">
            Register Property
          </Link>
        </div>
      )}
    </div>
  );
}
