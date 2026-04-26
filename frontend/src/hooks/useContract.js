import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { LAND_REGISTRY_ADDRESS, PROPERTY_STATUS } from '../utils/constants'
import { LAND_REGISTRY_ABI } from '../config/LandRegistryABI'

/**
 * Hook to get property details by ID
 */
export function useProperty(propertyId) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LAND_REGISTRY_ABI,
    functionName: 'getProperty',
    args: [BigInt(propertyId || 0)],
    enabled: !!propertyId,
  })

  const property = data ? {
    propertyId: Number(data.propertyId),
    surveyNumber: data.surveyNumber,
    location: data.location,
    area: Number(data.area),
    currentOwner: data.currentOwner,
    marketValue: formatUnits(data.marketValue, 18),
    status: PROPERTY_STATUS[data.status],
    registrationDate: new Date(Number(data.registrationDate) * 1000),
    ipfsDocumentHash: data.ipfsDocumentHash,
  } : null

  return { property, isLoading, error, refetch }
}

/**
 * Hook to get properties owned by an address
 */
export function useOwnerProperties(ownerAddress) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LAND_REGISTRY_ABI,
    functionName: 'getOwnerProperties',
    args: [ownerAddress],
    enabled: !!ownerAddress,
  })

  const propertyIds = data ? data.map(id => Number(id)) : []

  return { propertyIds, isLoading, error, refetch }
}

/**
 * Hook to get total properties count
 */
export function useTotalProperties() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LAND_REGISTRY_ABI,
    functionName: 'getTotalProperties',
  })

  return { total: data ? Number(data) : 0, isLoading, error, refetch }
}

/**
 * Hook to register a new property
 */
export function useRegisterProperty() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  })

  const registerProperty = async ({ surveyNumber, location, area, marketValue, ipfsHash }) => {
    writeContract({
      address: LAND_REGISTRY_ADDRESS,
      abi: LAND_REGISTRY_ABI,
      functionName: 'registerProperty',
      args: [surveyNumber, location, BigInt(area), parseUnits(marketValue, 18), ipfsHash || ''],
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      gas: 2000000n, // Fixed gas limit to bypass simulation crashes
    })
  }

  return {
    registerProperty,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
    hash,
    receipt,
  }
}

/**
 * Hook to update property documents
 */
export function useUpdatePropertyDocuments() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const updateDocuments = async (propertyId, newIpfsHash) => {
    writeContract({
      address: LAND_REGISTRY_ADDRESS,
      abi: LAND_REGISTRY_ABI,
      functionName: 'updatePropertyDocuments',
      args: [BigInt(propertyId), newIpfsHash],
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      gas: 1000000n,
    })
  }

  return {
    updateDocuments,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  }
}

/**
 * Hook to check if property is verified
 */
export function useIsPropertyVerified(propertyId) {
  const { data, isLoading, error } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LAND_REGISTRY_ABI,
    functionName: 'isPropertyVerified',
    args: [BigInt(propertyId || 0)],
    enabled: !!propertyId,
  })

  return { isVerified: data || false, isLoading, error }
}
