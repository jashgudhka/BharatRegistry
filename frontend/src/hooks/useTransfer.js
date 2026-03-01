import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { TRANSFER_ADDRESS, TRANSFER_STATUS } from "../utils/constants";
import { TRANSFER_ABI } from "../config/TransferABI";

/**
 * Hook to get transfer details by ID
 */
export function useTransfer(transferId) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: TRANSFER_ADDRESS,
    abi: TRANSFER_ABI,
    functionName: "getTransfer",
    args: [BigInt(transferId || 0)],
    enabled: !!transferId,
  });

  const transfer = data
    ? {
        transferId: Number(data.transferId),
        propertyId: Number(data.propertyId),
        seller: data.seller,
        buyer: data.buyer,
        agreedPrice: formatUnits(data.agreedPrice, 18),
        escrowAmount: formatUnits(data.escrowAmount, 18),
        status: TRANSFER_STATUS[data.status],
        initiatedAt: new Date(Number(data.createdAt) * 1000),
        completedAt:
          data.completedAt > 0
            ? new Date(Number(data.completedAt) * 1000)
            : null,
      }
    : null;

  return { transfer, isLoading, error, refetch };
}

/**
 * Hook to get user transfers
 */
export function useUserTransfers(userAddress) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: TRANSFER_ADDRESS,
    abi: TRANSFER_ABI,
    functionName: "getUserTransfers",
    args: [userAddress],
    enabled: !!userAddress,
  });

  const transferIds = data ? data.map((id) => Number(id)) : [];

  return { transferIds, isLoading, error, refetch };
}

/**
 * Hook to get property transfers
 */
export function usePropertyTransfers(propertyId) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: TRANSFER_ADDRESS,
    abi: TRANSFER_ABI,
    functionName: "getPropertyTransfers",
    args: [BigInt(propertyId || 0)],
    enabled: !!propertyId,
  });

  const transferIds = data ? data.map((id) => Number(id)) : [];

  return { transferIds, isLoading, error, refetch };
}

/**
 * Hook to initiate a transfer
 */
export function useInitiateTransfer() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const initiateTransfer = async (propertyId, offeredPrice) => {
    writeContract({
      address: TRANSFER_ADDRESS,
      abi: TRANSFER_ABI,
      functionName: "initiateTransfer",
      args: [BigInt(propertyId), parseUnits(offeredPrice, 18)],
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      gas: 1000000n,
    });
  };

  return {
    initiateTransfer,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Hook to deposit escrow
 */
export function useDepositEscrow() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const depositEscrow = async (transferId, amount) => {
    writeContract({
      address: TRANSFER_ADDRESS,
      abi: TRANSFER_ABI,
      functionName: "depositEscrow",
      args: [BigInt(transferId)],
      value: parseUnits(amount, 18),
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      gas: 1000000n,
    });
  };

  return {
    depositEscrow,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Hook to approve transfer as seller
 */
export function useApproveAsSeller() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approveAsSeller = async (transferId) => {
    writeContract({
      address: TRANSFER_ADDRESS,
      abi: TRANSFER_ABI,
      functionName: "approveTransferAsSeller",
      args: [BigInt(transferId)],
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      gas: 500000n,
    });
  };

  return {
    approveAsSeller,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Hook to approve transfer as government/registrar
 */
export function useApproveAsGovernment() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approveAsGovernment = async (transferId) => {
    writeContract({
      address: TRANSFER_ADDRESS,
      abi: TRANSFER_ABI,
      functionName: "approveTransferAsRegistrar",
      args: [BigInt(transferId)],
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      gas: 500000n,
    });
  };

  return {
    approveAsGovernment,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Hook to complete transfer
 */
export function useCompleteTransfer() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const completeTransfer = async (transferId) => {
    writeContract({
      address: TRANSFER_ADDRESS,
      abi: TRANSFER_ABI,
      functionName: "completeTransfer",
      args: [BigInt(transferId)],
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      gas: 1000000n,
    });
  };

  return {
    completeTransfer,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Hook to cancel transfer
 */
export function useCancelTransfer() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const cancelTransfer = async (transferId, reason) => {
    writeContract({
      address: TRANSFER_ADDRESS,
      abi: TRANSFER_ABI,
      functionName: "cancelTransfer",
      args: [BigInt(transferId), reason],
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      gas: 500000n,
    });
  };

  return {
    cancelTransfer,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}
