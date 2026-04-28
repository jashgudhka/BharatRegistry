import { useMemo, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from "wagmi";
import {
  keccak256,
  stringToHex,
  parseUnits,
  formatUnits,
  isAddress,
} from "viem";
import {
  AlertCircle,
  BadgeCheck,
  FileCheck2,
  Fingerprint,
  Landmark,
  Scale,
  Shield,
  PieChart,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  DOCUMENT_REGISTRY_ADDRESS,
  IDENTITY_REGISTRY_ADDRESS,
  MORTGAGE_REGISTRY_ADDRESS,
  DISPUTE_RESOLUTION_ADDRESS,
  TITLE_INSURANCE_ADDRESS,
  PROPERTY_TOKEN_ADDRESS,
} from "../utils/constants";
import { DOCUMENT_REGISTRY_ABI } from "../config/DocumentRegistryABI";
import { IDENTITY_REGISTRY_ABI } from "../config/IdentityRegistryABI";
import { MORTGAGE_REGISTRY_ABI } from "../config/MortgageRegistryABI";
import { DISPUTE_RESOLUTION_ABI } from "../config/DisputeResolutionABI";
import { TITLE_INSURANCE_ABI } from "../config/TitleInsuranceABI";
import { PROPERTY_TOKEN_ABI } from "../config/PropertyTokenABI";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const moduleHealth = [
  {
    label: "DocumentRegistry",
    address: DOCUMENT_REGISTRY_ADDRESS,
    icon: FileCheck2,
  },
  {
    label: "IdentityRegistry",
    address: IDENTITY_REGISTRY_ADDRESS,
    icon: Fingerprint,
  },
  {
    label: "MortgageRegistry",
    address: MORTGAGE_REGISTRY_ADDRESS,
    icon: Landmark,
  },
  {
    label: "DisputeResolution",
    address: DISPUTE_RESOLUTION_ADDRESS,
    icon: Scale,
  },
  { label: "TitleInsurance", address: TITLE_INSURANCE_ADDRESS, icon: Shield },
  { label: "PropertyToken", address: PROPERTY_TOKEN_ADDRESS, icon: PieChart },
];

const docTypeOptions = [
  { value: 0, label: "Deed" },
  { value: 1, label: "KYC" },
  { value: 2, label: "Title Certificate" },
  { value: 3, label: "Survey Report" },
  { value: 4, label: "Insurance" },
  { value: 5, label: "Other" },
];

const disputeOutcomeOptions = [
  { value: 1, label: "In Favor Claimant" },
  { value: 2, label: "In Favor Respondent" },
  { value: 3, label: "Fraud Confirmed" },
  { value: 4, label: "Title Invalidated" },
  { value: 5, label: "Settlement" },
];

function safeBytes32(value) {
  const raw = value.trim();
  if (/^0x[a-fA-F0-9]{64}$/.test(raw)) {
    return raw;
  }
  return keccak256(stringToHex(raw));
}

function shortHash(hash) {
  if (!hash) return "";
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

export default function EcosystemWorkbench() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState(false);

  const [docForm, setDocForm] = useState({
    contentHash: "deed:survey-2026-001",
    propertyId: "1",
    subject: address || "",
    documentType: "0",
    uri: "ipfs://dummy-deed-001",
    metadata: "Dummy deed for workflow testing",
  });
  const [docVerifyInput, setDocVerifyInput] = useState("deed:survey-2026-001");

  const [identityForm, setIdentityForm] = useState({
    identityHash: "kyc:citizen-001",
    metadataURI: "ipfs://dummy-kyc-001",
    reviewAddress: "",
    reviewApproved: true,
    reviewNotes: "KYC approved in dummy workflow",
    roleAddress: "",
    roleId: "1",
  });

  const [mortgageForm, setMortgageForm] = useState({
    propertyId: "1",
    borrower: address || "",
    principalEth: "5",
    dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    referenceId: "LOAN-DUMMY-001",
    lienId: "1",
    outstandingEth: "2",
  });

  const [disputeForm, setDisputeForm] = useState({
    disputeType: "0",
    propertyId: "1",
    transferId: "0",
    respondent: "",
    blockProperty: true,
    blockTransfer: false,
    evidenceURI: "ipfs://dummy-dispute-evidence-001",
    disputeId: "1",
    outcome: "3",
    keepBlocks: false,
    resolutionURI: "ipfs://dummy-dispute-resolution-001",
  });

  const [insuranceForm, setInsuranceForm] = useState({
    reserveEth: "20",
    propertyId: "1",
    holder: address || "",
    premiumEth: "0.1",
    coverageEth: "10",
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    policyURI: "ipfs://dummy-policy-001",
    policyId: "1",
    claimDisputeId: "1",
  });

  const [tokenForm, setTokenForm] = useState({
    propertyId: "1",
    totalShares: "1000",
    tokenURI: "ipfs://dummy-token-001",
    holderAddress: address || "",
  });

  const docHashForRead = useMemo(() => {
    if (!docVerifyInput.trim()) return null;
    try {
      return safeBytes32(docVerifyInput);
    } catch {
      return null;
    }
  }, [docVerifyInput]);

  const { data: isDocumentAuthentic, refetch: refetchDocumentAuth } =
    useReadContract({
      address: DOCUMENT_REGISTRY_ADDRESS,
      abi: DOCUMENT_REGISTRY_ABI,
      functionName: "isDocumentAuthentic",
      args: docHashForRead ? [docHashForRead] : undefined,
      query: {
        enabled: DOCUMENT_REGISTRY_ADDRESS !== ZERO_ADDRESS && !!docHashForRead,
      },
    });

  const { data: hasEncumbrance, refetch: refetchEncumbrance } = useReadContract(
    {
      address: MORTGAGE_REGISTRY_ADDRESS,
      abi: MORTGAGE_REGISTRY_ABI,
      functionName: "hasActiveEncumbrance",
      args: [BigInt(mortgageForm.propertyId || 0)],
      query: {
        enabled:
          MORTGAGE_REGISTRY_ADDRESS !== ZERO_ADDRESS &&
          !!mortgageForm.propertyId,
      },
    },
  );

  const { data: isPropertyBlocked, refetch: refetchPropertyBlocked } =
    useReadContract({
      address: DISPUTE_RESOLUTION_ADDRESS,
      abi: DISPUTE_RESOLUTION_ABI,
      functionName: "isPropertyBlocked",
      args: [BigInt(disputeForm.propertyId || 0)],
      query: {
        enabled:
          DISPUTE_RESOLUTION_ADDRESS !== ZERO_ADDRESS &&
          !!disputeForm.propertyId,
      },
    });

  const { data: reservePool, refetch: refetchReservePool } = useReadContract({
    address: TITLE_INSURANCE_ADDRESS,
    abi: TITLE_INSURANCE_ABI,
    functionName: "reservePool",
    query: {
      enabled: TITLE_INSURANCE_ADDRESS !== ZERO_ADDRESS,
    },
  });

  const { data: tokenizedProperty, refetch: refetchTokenizedProperty } =
    useReadContract({
      address: PROPERTY_TOKEN_ADDRESS,
      abi: PROPERTY_TOKEN_ABI,
      functionName: "getTokenizedProperty",
      args: [BigInt(tokenForm.propertyId || 0)],
      query: {
        enabled:
          PROPERTY_TOKEN_ADDRESS !== ZERO_ADDRESS && !!tokenForm.propertyId,
      },
    });

  const { data: holderShares, refetch: refetchHolderShares } = useReadContract({
    address: PROPERTY_TOKEN_ADDRESS,
    abi: PROPERTY_TOKEN_ABI,
    functionName: "balanceShares",
    args: [
      BigInt(tokenForm.propertyId || 0),
      tokenForm.holderAddress || ZERO_ADDRESS,
    ],
    query: {
      enabled:
        PROPERTY_TOKEN_ADDRESS !== ZERO_ADDRESS &&
        !!tokenForm.propertyId &&
        isAddress(tokenForm.holderAddress || ""),
    },
  });

  const configuredModules = moduleHealth.filter(
    (item) => item.address !== ZERO_ADDRESS,
  ).length;

  const executeWrite = async (callFactory, successLabel, refetchers = []) => {
    setBusy(true);
    try {
      const hash = await callFactory();
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success(`${successLabel} | ${shortHash(hash)}`);
      await Promise.all(refetchers.map((fn) => fn()));
    } catch (error) {
      toast.error(error.shortMessage || error.message || "Transaction failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <section className="glass-panel p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-gradient-to-br from-primary-200/50 to-teal-200/40 blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Ecosystem Workbench
          </h1>
          <p className="mt-3 text-slate-600 max-w-3xl leading-relaxed">
            Execute full on-chain workflows for documents, KYC, encumbrances,
            disputes, title insurance, and fractional ownership.
          </p>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/50 p-4 rounded-2xl border border-white/20">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purpose</p>
              <p className="text-sm text-slate-600">Simulate advanced legal & financial events that happen on the blockchain.</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Justification</p>
              <p className="text-sm text-slate-600">Each module connects directly to deployed smart contracts for real-time validation.</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</p>
              <p className="text-sm text-slate-600">Modules configured: {configuredModules}/6</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {moduleHealth.map((item) => {
              const healthy = item.address !== ZERO_ADDRESS;
              return (
                <span
                  key={item.label}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide ${
                    healthy
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <item.icon size={14} />
                  {item.label}
                  {healthy ? (
                    <BadgeCheck size={14} />
                  ) : (
                    <AlertCircle size={14} />
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-6 space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="text-primary-600" /> DocumentRegistry
            </h2>
            <p className="text-sm text-slate-500 mt-1">Notarize and verify legal document hashes on-chain.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Document Source Hash</label>
              <input
                className="input mt-1"
                placeholder="Unique string to be hashed (e.g. deed-001)"
                value={docForm.contentHash}
                onChange={(e) =>
                  setDocForm((p) => ({ ...p, contentHash: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Property ID</label>
                <input
                  className="input mt-1"
                  placeholder="Asset ID"
                  value={docForm.propertyId}
                  onChange={(e) =>
                    setDocForm((p) => ({ ...p, propertyId: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Subject Wallet</label>
                <input
                  className="input mt-1"
                  placeholder="Owner address"
                  value={docForm.subject}
                  onChange={(e) =>
                    setDocForm((p) => ({ ...p, subject: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Document Type</label>
              <select
                className="input mt-1"
                value={docForm.documentType}
                onChange={(e) =>
                  setDocForm((p) => ({ ...p, documentType: e.target.value }))
                }
              >
                {docTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Storage URI (IPFS)</label>
              <input
                className="input mt-1"
                placeholder="ipfs://..."
                value={docForm.uri}
                onChange={(e) => setDocForm((p) => ({ ...p, uri: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Public Metadata</label>
              <input
                className="input mt-1"
                placeholder="Brief description"
                value={docForm.metadata}
                onChange={(e) =>
                  setDocForm((p) => ({ ...p, metadata: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              className="btn btn-primary"
              disabled={busy || DOCUMENT_REGISTRY_ADDRESS === ZERO_ADDRESS}
              onClick={() =>
                executeWrite(
                  () =>
                    writeContractAsync({
                      address: DOCUMENT_REGISTRY_ADDRESS,
                      abi: DOCUMENT_REGISTRY_ABI,
                      functionName: "registerDocument",
                      args: [
                        safeBytes32(docForm.contentHash),
                        BigInt(docForm.propertyId || 0),
                        docForm.subject,
                        Number(docForm.documentType || 0),
                        docForm.uri,
                        docForm.metadata,
                      ],
                    }),
                  "Document registered",
                  [refetchDocumentAuth],
                )
              }
            >
              {busy ? <Loader2 className="animate-spin" size={16} /> : null}
              Register Hash
            </button>
            <button
              className="btn btn-outline"
              disabled={busy || DOCUMENT_REGISTRY_ADDRESS === ZERO_ADDRESS}
              onClick={() =>
                executeWrite(
                  () =>
                    writeContractAsync({
                      address: DOCUMENT_REGISTRY_ADDRESS,
                      abi: DOCUMENT_REGISTRY_ABI,
                      functionName: "verifyDocument",
                      args: [safeBytes32(docForm.contentHash)],
                    }),
                  "Document verified",
                  [refetchDocumentAuth],
                )
              }
            >
              Verify Hash
            </button>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Authenticity Checker</label>
            <input
              className="input mt-1"
              placeholder="Paste hash here to verify"
              value={docVerifyInput}
              onChange={(e) => setDocVerifyInput(e.target.value)}
            />
            <div className="mt-3 flex items-center justify-between px-1">
              <span className="text-sm font-medium text-slate-600">On-Chain status:</span>
              <span className={`text-sm font-bold ${isDocumentAuthentic ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isDocumentAuthentic ? "VERIFIED AUTHENTIC" : "NOT FOUND"}
              </span>
            </div>
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Fingerprint className="text-primary-600" /> IdentityRegistry
            </h2>
            <p className="text-sm text-slate-500 mt-1">Manage Sovereign Identity and KYC on-chain.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Identity Data Hash</label>
              <input
                className="input mt-1"
                placeholder="KYC hash (e.g. kyc:001)"
                value={identityForm.identityHash}
                onChange={(e) =>
                  setIdentityForm((p) => ({ ...p, identityHash: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Documents URI (IPFS)</label>
              <input
                className="input mt-1"
                placeholder="ipfs://..."
                value={identityForm.metadataURI}
                onChange={(e) =>
                  setIdentityForm((p) => ({ ...p, metadataURI: e.target.value }))
                }
              />
            </div>

            <button
              className="btn btn-primary w-full"
              disabled={busy || IDENTITY_REGISTRY_ADDRESS === ZERO_ADDRESS}
              onClick={() =>
                executeWrite(
                  () =>
                    writeContractAsync({
                      address: IDENTITY_REGISTRY_ADDRESS,
                      abi: IDENTITY_REGISTRY_ABI,
                      functionName: "submitIdentity",
                      args: [identityForm.identityHash, identityForm.metadataURI],
                    }),
                  "Identity submitted",
                )
              }
            >
              Submit KYC for Review
            </button>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-primary-600 uppercase mb-3">Admin Controls</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Review Target Wallet</label>
                  <input
                    className="input mt-1"
                    placeholder="Address to verify"
                    value={identityForm.reviewAddress}
                    onChange={(e) =>
                      setIdentityForm((p) => ({
                        ...p,
                        reviewAddress: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Review Remarks</label>
                  <input
                    className="input mt-1"
                    placeholder="Internal notes"
                    value={identityForm.reviewNotes}
                    onChange={(e) =>
                      setIdentityForm((p) => ({ ...p, reviewNotes: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="btn btn-outline flex-1"
              disabled={busy || IDENTITY_REGISTRY_ADDRESS === ZERO_ADDRESS}
              onClick={() =>
                executeWrite(
                  () =>
                    writeContractAsync({
                      address: IDENTITY_REGISTRY_ADDRESS,
                      abi: IDENTITY_REGISTRY_ABI,
                      functionName: "reviewIdentity",
                      args: [
                        identityForm.reviewAddress,
                        true,
                        identityForm.reviewNotes,
                      ],
                    }),
                  "Identity approved",
                )
              }
            >
              Approve
            </button>
            <button
              className="btn btn-outline flex-1 border-red-200 text-red-600 hover:bg-red-50"
              disabled={busy || IDENTITY_REGISTRY_ADDRESS === ZERO_ADDRESS}
              onClick={() =>
                executeWrite(
                  () =>
                    writeContractAsync({
                      address: IDENTITY_REGISTRY_ADDRESS,
                      abi: IDENTITY_REGISTRY_ABI,
                      functionName: "reviewIdentity",
                      args: [
                        identityForm.reviewAddress,
                        false,
                        "Dummy rejection",
                      ],
                    }),
                  "Identity rejected",
                )
              }
            >
              Reject
            </button>
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Landmark className="text-primary-600" /> MortgageRegistry
            </h2>
            <p className="text-sm text-slate-500 mt-1">Create and manage property-backed liens and loans.</p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Property ID</label>
                <input
                  className="input mt-1"
                  placeholder="Asset ID"
                  value={mortgageForm.propertyId}
                  onChange={(e) =>
                    setMortgageForm((p) => ({ ...p, propertyId: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Borrower Wallet</label>
                <input
                  className="input mt-1"
                  placeholder="Debtor address"
                  value={mortgageForm.borrower}
                  onChange={(e) =>
                    setMortgageForm((p) => ({ ...p, borrower: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Principal (ETH)</label>
                <input
                  className="input mt-1"
                  placeholder="Loan amount"
                  value={mortgageForm.principalEth}
                  onChange={(e) =>
                    setMortgageForm((p) => ({ ...p, principalEth: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Due Date</label>
                <input
                  className="input mt-1"
                  type="date"
                  value={mortgageForm.dueDate}
                  onChange={(e) =>
                    setMortgageForm((p) => ({ ...p, dueDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Bank Reference</label>
                <input
                  className="input mt-1"
                  placeholder="Ref ID"
                  value={mortgageForm.referenceId}
                  onChange={(e) =>
                    setMortgageForm((p) => ({ ...p, referenceId: e.target.value }))
                  }
                />
              </div>
            </div>

            <button
              className="btn btn-primary w-full"
              disabled={busy || MORTGAGE_REGISTRY_ADDRESS === ZERO_ADDRESS}
              onClick={() =>
                executeWrite(
                  () =>
                    writeContractAsync({
                      address: MORTGAGE_REGISTRY_ADDRESS,
                      abi: MORTGAGE_REGISTRY_ABI,
                      functionName: "createLien",
                      args: [
                        BigInt(mortgageForm.propertyId || 0),
                        mortgageForm.borrower,
                        parseUnits(mortgageForm.principalEth || "0", 18),
                        BigInt(
                          Math.floor(
                            new Date(mortgageForm.dueDate).getTime() / 1000,
                          ),
                        ),
                        mortgageForm.referenceId,
                      ],
                    }),
                  "Lien created",
                  [refetchEncumbrance],
                )
              }
            >
              Issue New Mortgage Lien
            </button>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-primary-600 uppercase mb-3">Lien Management</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Lien ID</label>
                  <input
                    className="input mt-1"
                    placeholder="Existing ID"
                    value={mortgageForm.lienId}
                    onChange={(e) =>
                      setMortgageForm((p) => ({ ...p, lienId: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">New O/S (ETH)</label>
                  <input
                    className="input mt-1"
                    placeholder="Balance"
                    value={mortgageForm.outstandingEth}
                    onChange={(e) =>
                      setMortgageForm((p) => ({
                        ...p,
                        outstandingEth: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex items-end">
                  <button
                    className="btn btn-outline w-full"
                    disabled={busy || MORTGAGE_REGISTRY_ADDRESS === ZERO_ADDRESS}
                    onClick={() =>
                      executeWrite(
                        () =>
                          writeContractAsync({
                            address: MORTGAGE_REGISTRY_ADDRESS,
                            abi: MORTGAGE_REGISTRY_ABI,
                            functionName: "updateOutstanding",
                            args: [
                              BigInt(mortgageForm.lienId || 0),
                              parseUnits(mortgageForm.outstandingEth || "0", 18),
                            ],
                          }),
                        "Outstanding updated",
                        [refetchEncumbrance],
                      )
                    }
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between px-1">
            <span className="text-sm font-medium text-slate-600">Active Lien on Property {mortgageForm.propertyId}:</span>
            <span className={`text-sm font-bold ${hasEncumbrance ? 'text-amber-600' : 'text-emerald-600'}`}>
              {hasEncumbrance ? "YES (BLOCKED)" : "NO (FREE)"}
            </span>
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Scale className="text-primary-600" /> DisputeResolution
            </h2>
            <p className="text-sm text-slate-500 mt-1">Arbitrate property claims and enforce legal blocks.</p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Type</label>
                <input
                  className="input mt-1"
                  placeholder="0=Gen, 1=Frd"
                  value={disputeForm.disputeType}
                  onChange={(e) =>
                    setDisputeForm((p) => ({ ...p, disputeType: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Property ID</label>
                <input
                  className="input mt-1"
                  placeholder="Asset ID"
                  value={disputeForm.propertyId}
                  onChange={(e) =>
                    setDisputeForm((p) => ({ ...p, propertyId: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Transfer ID</label>
                <input
                  className="input mt-1"
                  placeholder="Tx ID"
                  value={disputeForm.transferId}
                  onChange={(e) =>
                    setDisputeForm((p) => ({ ...p, transferId: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Respondent Wallet</label>
              <input
                className="input mt-1"
                placeholder="Accused address"
                value={disputeForm.respondent}
                onChange={(e) =>
                  setDisputeForm((p) => ({ ...p, respondent: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Evidence URI (IPFS)</label>
              <input
                className="input mt-1"
                placeholder="ipfs://..."
                value={disputeForm.evidenceURI}
                onChange={(e) =>
                  setDisputeForm((p) => ({ ...p, evidenceURI: e.target.value }))
                }
              />
            </div>

            <div className="flex gap-4 px-1 py-1">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  checked={disputeForm.blockProperty}
                  onChange={(e) =>
                    setDisputeForm((p) => ({
                      ...p,
                      blockProperty: e.target.checked,
                    }))
                  }
                />{" "}
                Block Asset
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  checked={disputeForm.blockTransfer}
                  onChange={(e) =>
                    setDisputeForm((p) => ({
                      ...p,
                      blockTransfer: e.target.checked,
                    }))
                  }
                />{" "}
                Block Transfer
              </label>
            </div>

            <button
              className="btn btn-primary w-full"
              disabled={busy || DISPUTE_RESOLUTION_ADDRESS === ZERO_ADDRESS}
              onClick={() =>
                executeWrite(
                  () =>
                    writeContractAsync({
                      address: DISPUTE_RESOLUTION_ADDRESS,
                      abi: DISPUTE_RESOLUTION_ABI,
                      functionName: "openDispute",
                      args: [
                        Number(disputeForm.disputeType || 0),
                        BigInt(disputeForm.propertyId || 0),
                        BigInt(disputeForm.transferId || 0),
                        disputeForm.respondent,
                        disputeForm.blockProperty,
                        disputeForm.blockTransfer,
                        disputeForm.evidenceURI,
                      ],
                    }),
                  "Dispute opened",
                  [refetchPropertyBlocked],
                )
              }
            >
              File Official Dispute
            </button>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-primary-600 uppercase mb-3">Resolution Panel</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Dispute ID</label>
                  <input
                    className="input mt-1"
                    placeholder="Case ID"
                    value={disputeForm.disputeId}
                    onChange={(e) =>
                      setDisputeForm((p) => ({ ...p, disputeId: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Outcome</label>
                  <select
                    className="input mt-1"
                    value={disputeForm.outcome}
                    onChange={(e) =>
                      setDisputeForm((p) => ({ ...p, outcome: e.target.value }))
                    }
                  >
                    {disputeOutcomeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    className="btn btn-outline w-full"
                    disabled={busy || DISPUTE_RESOLUTION_ADDRESS === ZERO_ADDRESS}
                    onClick={() =>
                      executeWrite(
                        () =>
                          writeContractAsync({
                            address: DISPUTE_RESOLUTION_ADDRESS,
                            abi: DISPUTE_RESOLUTION_ABI,
                            functionName: "resolveDispute",
                            args: [
                              BigInt(disputeForm.disputeId || 0),
                              Number(disputeForm.outcome || 1),
                              disputeForm.keepBlocks,
                              disputeForm.resolutionURI,
                            ],
                          }),
                        "Dispute resolved",
                        [refetchPropertyBlocked],
                      )
                    }
                  >
                    Resolve
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between px-1">
            <span className="text-sm font-medium text-slate-600">Legal Block on Property {disputeForm.propertyId}:</span>
            <span className={`text-sm font-bold ${isPropertyBlocked ? 'text-red-600' : 'text-emerald-600'}`}>
              {isPropertyBlocked ? "BLOCKED BY DISPUTE" : "NO LEGAL BLOCKS"}
            </span>
          </div>
        </section>
                      args: [
                        BigInt(disputeForm.disputeId || 0),
                        Number(disputeForm.outcome || 1),
                        disputeForm.keepBlocks,
                        disputeForm.resolutionURI,
                      ],
                    }),
                  "Dispute resolved",
                  [refetchPropertyBlocked],
                )
              }
            >
              Resolve
            </button>
          </div>
          <p className="text-sm font-semibold text-slate-600">

        <section className="card p-6 space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Shield className="text-primary-600" /> TitleInsurance
            </h2>
            <p className="text-sm text-slate-500 mt-1">Insure property titles and process automated payouts.</p>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Reserve (ETH)</label>
                <input
                  className="input mt-1"
                  placeholder="Amount to pool"
                  value={insuranceForm.reserveEth}
                  onChange={(e) =>
                    setInsuranceForm((p) => ({ ...p, reserveEth: e.target.value }))
                  }
                />
              </div>
              <div className="flex items-end">
                <button
                  className="btn btn-outline w-full"
                  disabled={busy || TITLE_INSURANCE_ADDRESS === ZERO_ADDRESS}
                  onClick={() =>
                    executeWrite(
                      () =>
                        writeContractAsync({
                          address: TITLE_INSURANCE_ADDRESS,
                          abi: TITLE_INSURANCE_ABI,
                          functionName: "fundReserve",
                          value: parseUnits(insuranceForm.reserveEth || "0", 18),
                        }),
                      "Reserve funded",
                      [refetchReservePool],
                    )
                  }
                >
                  Fund Pool
                </button>
              </div>
            </div>

            <div className="pt-2">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Property ID</label>
                  <input
                    className="input mt-1"
                    placeholder="Asset ID"
                    value={insuranceForm.propertyId}
                    onChange={(e) =>
                      setInsuranceForm((p) => ({
                        ...p,
                        propertyId: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Policy Holder</label>
                  <input
                    className="input mt-1"
                    placeholder="Beneficiary address"
                    value={insuranceForm.holder}
                    onChange={(e) =>
                      setInsuranceForm((p) => ({ ...p, holder: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Premium</label>
                  <input
                    className="input mt-1"
                    placeholder="Cost (ETH)"
                    value={insuranceForm.premiumEth}
                    onChange={(e) =>
                      setInsuranceForm((p) => ({
                        ...p,
                        premiumEth: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Coverage</label>
                  <input
                    className="input mt-1"
                    placeholder="Payout (ETH)"
                    value={insuranceForm.coverageEth}
                    onChange={(e) =>
                      setInsuranceForm((p) => ({
                        ...p,
                        coverageEth: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Expiry</label>
                  <input
                    className="input mt-1"
                    type="date"
                    value={insuranceForm.expiryDate}
                    onChange={(e) =>
                      setInsuranceForm((p) => ({ ...p, expiryDate: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary w-full"
              disabled={busy || TITLE_INSURANCE_ADDRESS === ZERO_ADDRESS}
              onClick={() =>
                executeWrite(
                  () =>
                    writeContractAsync({
                      address: TITLE_INSURANCE_ADDRESS,
                      abi: TITLE_INSURANCE_ABI,
                      functionName: "issuePolicy",
                      args: [
                        BigInt(insuranceForm.propertyId || 0),
                        insuranceForm.holder,
                        parseUnits(insuranceForm.premiumEth || "0", 18),
                        parseUnits(insuranceForm.coverageEth || "0", 18),
                        BigInt(
                          Math.floor(
                            new Date(insuranceForm.expiryDate).getTime() / 1000,
                          ),
                        ),
                        insuranceForm.policyURI,
                      ],
                    }),
                  "Policy issued",
                )
              }
            >
              Issue Insurance Policy
            </button>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-primary-600 uppercase mb-3">Claims Processing</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Policy ID</label>
                  <input
                    className="input mt-1"
                    placeholder="P-001"
                    value={insuranceForm.policyId}
                    onChange={(e) =>
                      setInsuranceForm((p) => ({ ...p, policyId: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Dispute ID</label>
                  <input
                    className="input mt-1"
                    placeholder="Case ID"
                    value={insuranceForm.claimDisputeId}
                    onChange={(e) =>
                      setInsuranceForm((p) => ({
                        ...p,
                        claimDisputeId: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex items-end">
                  <button
                    className="btn btn-outline w-full"
                    disabled={busy || TITLE_INSURANCE_ADDRESS === ZERO_ADDRESS}
                    onClick={() =>
                      executeWrite(
                        () =>
                          writeContractAsync({
                            address: TITLE_INSURANCE_ADDRESS,
                            abi: TITLE_INSURANCE_ABI,
                            functionName: "payoutFromDispute",
                            args: [
                              BigInt(insuranceForm.policyId || 0),
                              BigInt(insuranceForm.claimDisputeId || 0),
                            ],
                          }),
                        "Claim payout processed",
                        [refetchReservePool],
                      )
                    }
                  >
                    Process Payout
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between px-1">
            <span className="text-sm font-medium text-slate-600">Total Insurance Reserve:</span>
            <span className="text-sm font-bold text-primary-600">
              {reservePool ? formatUnits(reservePool, 18) : "0"} ETH
            </span>
          </div>
        </section>

        <section className="card p-6 space-y-4 xl:col-span-2">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <PieChart className="text-primary-600" /> PropertyToken / Fractional Ownership
            </h2>
            <p className="text-sm text-slate-500 mt-1">Transform physical land into tradeable digital shares.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-xs font-bold text-primary-600 uppercase">Tokenize Asset</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Property ID</label>
                  <input
                    className="input mt-1"
                    placeholder="Asset ID"
                    value={tokenForm.propertyId}
                    onChange={(e) =>
                      setTokenForm((p) => ({ ...p, propertyId: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Total Shares</label>
                  <input
                    className="input mt-1"
                    placeholder="e.g. 1000"
                    value={tokenForm.totalShares}
                    onChange={(e) =>
                      setTokenForm((p) => ({ ...p, totalShares: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Token Metadata URI</label>
                <input
                  className="input mt-1"
                  placeholder="ipfs://..."
                  value={tokenForm.tokenURI}
                  onChange={(e) =>
                    setTokenForm((p) => ({ ...p, tokenURI: e.target.value }))
                  }
                />
              </div>
              <button
                className="btn btn-primary w-full"
                disabled={busy || PROPERTY_TOKEN_ADDRESS === ZERO_ADDRESS}
                onClick={() =>
                  executeWrite(
                    () =>
                      writeContractAsync({
                        address: PROPERTY_TOKEN_ADDRESS,
                        abi: PROPERTY_TOKEN_ABI,
                        functionName: "tokenizeProperty",
                        args: [
                          BigInt(tokenForm.propertyId || 0),
                          BigInt(tokenForm.totalShares || 0),
                          tokenForm.tokenURI,
                        ],
                      }),
                    "Property tokenized",
                    [refetchTokenizedProperty],
                  )
                }
              >
                Create Digital Shares
              </button>
            </div>

            <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-primary-600 uppercase">Share Inventory</p>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Investor Wallet</label>
                <input
                  className="input mt-1 bg-white"
                  placeholder="Address to check"
                  value={tokenForm.holderAddress}
                  onChange={(e) =>
                    setTokenForm((p) => ({ ...p, holderAddress: e.target.value }))
                  }
                />
              </div>
              <button
                className="btn btn-outline w-full bg-white"
                onClick={() => {
                  refetchTokenizedProperty();
                  refetchHolderShares();
                  toast.success("State refreshed from chain");
                }}
              >
                Refresh Share Data
              </button>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                  <p className={`text-sm font-bold mt-1 ${tokenizedProperty?.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {tokenizedProperty?.active ? "TOKENIZED" : "NOT ACTIVE"}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Supply</p>
                  <p className="text-sm font-bold mt-1 text-slate-900">
                    {tokenizedProperty ? Number(tokenizedProperty.totalShares).toLocaleString() : "0"}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Holder's Balance</p>
                  <p className="text-lg font-black mt-1 text-primary-600">
                    {holderShares ? Number(holderShares).toLocaleString() : "0"} Shares
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
