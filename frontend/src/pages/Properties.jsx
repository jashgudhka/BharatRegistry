import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, MapPin, Maximize, Tag } from "lucide-react";
import { useTotalProperties, useProperty } from "../hooks/useContract";
import { PROPERTY_STATUS_LABELS } from "../utils/constants";

function PropertyCard({ propertyId }) {
  const { property, isLoading } = useProperty(propertyId);

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
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
      className="card hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">
            Property #{propertyId}
          </h3>
          <p className="text-sm text-gray-500">{property.surveyNumber}</p>
        </div>
        <span className={`badge ${statusColors[property.status]}`}>
          {PROPERTY_STATUS_LABELS[property.status]}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin size={16} />
          <span className="truncate">{property.location}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Maximize size={16} />
          <span>{property.area.toLocaleString()} sq.m</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Tag size={16} />
          <span>{property.marketValue} ETH</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Registered: {property.registrationDate.toLocaleDateString()}
        </p>
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        <p className="text-gray-600 mt-1">
          Browse all registered properties on the blockchain
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by survey number or location..."
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            className="input w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
      <div className="text-sm text-gray-500">
        Showing {propertyIds.length} properties
      </div>

      {/* Property Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : propertyIds.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {propertyIds.map((id) => (
            <PropertyCard key={id} propertyId={id} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Search size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No properties found
          </h3>
          <p className="text-gray-500 mb-4">
            Be the first to register a property on the blockchain!
          </p>
          <Link to="/register" className="btn btn-primary">
            Register Property
          </Link>
        </div>
      )}
    </div>
  );
}
