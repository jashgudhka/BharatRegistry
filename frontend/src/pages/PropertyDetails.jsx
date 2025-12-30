import { useParams, Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { ArrowLeft, MapPin, Maximize, Tag, User, Calendar, FileText, ExternalLink, Send } from 'lucide-react'
import { useProperty, useIsPropertyVerified } from '../hooks/useContract'
import { usePropertyTransfers } from '../hooks/useTransfer'
import { PROPERTY_STATUS_LABELS } from '../utils/constants'
import InitiateTransferModal from '../components/transfer/InitiateTransferModal'
import { useState } from 'react'

export default function PropertyDetails() {
  const { propertyId } = useParams()
  const { address, isConnected } = useAccount()
  const { property, isLoading, error } = useProperty(propertyId)
  const { isVerified } = useIsPropertyVerified(propertyId)
  const { transferIds } = usePropertyTransfers(propertyId)
  const [showTransferModal, setShowTransferModal] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="card animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="card text-center py-12">
        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Property Not Found</h3>
        <p className="text-gray-500 mb-4">
          The property you're looking for doesn't exist or hasn't been registered yet.
        </p>
        <Link to="/properties" className="btn btn-primary">
          Browse Properties
        </Link>
      </div>
    )
  }

  const isOwner = isConnected && address?.toLowerCase() === property.currentOwner.toLowerCase()
  const canBuy = isConnected && !isOwner && property.status === 'verified'

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    verified: 'bg-green-100 text-green-800 border-green-200',
    disputed: 'bg-red-100 text-red-800 border-red-200',
    transferred: 'bg-blue-100 text-blue-800 border-blue-200',
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/properties" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft size={20} />
        Back to Properties
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Property #{propertyId}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[property.status]}`}>
              {PROPERTY_STATUS_LABELS[property.status]}
            </span>
          </div>
          <p className="text-gray-600">{property.surveyNumber}</p>
        </div>

        {canBuy && (
          <button
            onClick={() => setShowTransferModal(true)}
            className="btn btn-primary"
          >
            <Send size={20} />
            Initiate Purchase
          </button>
        )}
      </div>

      {/* Property Details */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="text-gray-400 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{property.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Maximize className="text-gray-400 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Area</p>
                  <p className="font-medium">{property.area.toLocaleString()} sq.m</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Tag className="text-gray-400 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Market Value</p>
                  <p className="font-medium">{property.marketValue} ETH</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="text-gray-400 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Registration Date</p>
                  <p className="font-medium">{property.registrationDate.toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
            {property.ipfsDocumentHash ? (
              <a
                href={`https://gateway.pinata.cloud/ipfs/${property.ipfsDocumentHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FileText className="text-primary-500" size={20} />
                <span className="flex-1 font-medium">Property Documents</span>
                <ExternalLink size={16} className="text-gray-400" />
              </a>
            ) : (
              <p className="text-gray-500 text-center py-4">No documents uploaded</p>
            )}
          </div>

          {/* Transfer History */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Transfer History</h2>
            {transferIds?.length > 0 ? (
              <div className="space-y-3">
                {transferIds.map((id) => (
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
              <p className="text-gray-500 text-center py-4">No transfer history</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Owner</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="text-primary-500" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm text-gray-600 truncate">
                  {property.currentOwner}
                </p>
                {isOwner && (
                  <span className="text-xs text-primary-500 font-medium">You</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {isOwner && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Owner Actions</h2>
              <div className="space-y-2">
                <button className="btn btn-outline w-full justify-start">
                  <FileText size={18} />
                  Update Documents
                </button>
                <button className="btn btn-outline w-full justify-start">
                  <Tag size={18} />
                  Update Market Value
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <InitiateTransferModal
          propertyId={propertyId}
          marketValue={property.marketValue}
          onClose={() => setShowTransferModal(false)}
        />
      )}
    </div>
  )
}
