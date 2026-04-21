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
            disputes, title insurance, and fractional ownership using
            deterministic dummy values.
          </p>
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
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Modules configured: {configuredModules}/6
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="text-primary-600" /> DocumentRegistry
          </h2>
          <input
            className="input"
            placeholder="Content hash source"
            value={docForm.contentHash}
            onChange={(e) =>
              setDocForm((p) => ({ ...p, contentHash: e.target.value }))
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input"
              placeholder="Property ID"
              value={docForm.propertyId}
              onChange={(e) =>
                setDocForm((p) => ({ ...p, propertyId: e.target.value }))
              }
            />
            <input
              className="input"
              placeholder="Subject wallet"
              value={docForm.subject}
              onChange={(e) =>
                setDocForm((p) => ({ ...p, subject: e.target.value }))
              }
            />
          </div>
          <select
            className="input"
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
          <input
            className="input"
            placeholder="URI"
            value={docForm.uri}
            onChange={(e) => setDocForm((p) => ({ ...p, uri: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Metadata"
            value={docForm.metadata}
            onChange={(e) =>
              setDocForm((p) => ({ ...p, metadata: e.target.value }))
            }
          />
          <div className="flex flex-wrap gap-2">
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
          <div className="rounded-xl bg-slate-50 p-3">
            <input
              className="input"
              placeholder="Hash to verify authenticity"
              value={docVerifyInput}
              onChange={(e) => setDocVerifyInput(e.target.value)}
            />
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Authentic: {isDocumentAuthentic ? "Yes" : "No"}
            </p>
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Fingerprint className="text-primary-600" /> IdentityRegistry
          </h2>
          <input
            className="input"
            placeholder="Identity hash"
            value={identityForm.identityHash}
            onChange={(e) =>
              setIdentityForm((p) => ({ ...p, identityHash: e.target.value }))
            }
          />
          <input
            className="input"
            placeholder="Metadata URI"
            value={identityForm.metadataURI}
            onChange={(e) =>
              setIdentityForm((p) => ({ ...p, metadataURI: e.target.value }))
            }
          />
          <button
            className="btn btn-primary"
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
            Submit KYC
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="input"
              placeholder="Review wallet"
              value={identityForm.reviewAddress}
              onChange={(e) =>
                setIdentityForm((p) => ({
                  ...p,
                  reviewAddress: e.target.value,
                }))
              }
            />
            <input
              className="input"
              placeholder="Review notes"
              value={identityForm.reviewNotes}
              onChange={(e) =>
                setIdentityForm((p) => ({ ...p, reviewNotes: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-outline"
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
              Approve Identity
            </button>
            <button
              className="btn btn-outline"
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
              Reject Identity
            </button>
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Landmark className="text-primary-600" /> MortgageRegistry
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input"
              placeholder="Property ID"
              value={mortgageForm.propertyId}
              onChange={(e) =>
                setMortgageForm((p) => ({ ...p, propertyId: e.target.value }))
              }
            />
            <input
              className="input"
              placeholder="Borrower"
              value={mortgageForm.borrower}
              onChange={(e) =>
                setMortgageForm((p) => ({ ...p, borrower: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input
              className="input"
              placeholder="Principal ETH"
              value={mortgageForm.principalEth}
              onChange={(e) =>
                setMortgageForm((p) => ({ ...p, principalEth: e.target.value }))
              }
            />
            <input
              className="input"
              type="date"
              value={mortgageForm.dueDate}
              onChange={(e) =>
                setMortgageForm((p) => ({ ...p, dueDate: e.target.value }))
              }
            />
            <input
              className="input"
              placeholder="Reference"
              value={mortgageForm.referenceId}
              onChange={(e) =>
                setMortgageForm((p) => ({ ...p, referenceId: e.target.value }))
              }
            />
          </div>
          <button
            className="btn btn-primary"
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
            Create Lien
          </button>
          <div className="grid grid-cols-3 gap-3">
            <input
              className="input"
              placeholder="Lien ID"
              value={mortgageForm.lienId}
              onChange={(e) =>
                setMortgageForm((p) => ({ ...p, lienId: e.target.value }))
              }
            />
            <input
              className="input"
              placeholder="Outstanding ETH"
              value={mortgageForm.outstandingEth}
              onChange={(e) =>
                setMortgageForm((p) => ({
                  ...p,
                  outstandingEth: e.target.value,
                }))
              }
            />
            <button
              className="btn btn-outline"
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
          <p className="text-sm font-semibold text-slate-600">
            Active encumbrance on property {mortgageForm.propertyId}:{" "}
            {hasEncumbrance ? "Yes" : "No"}
          </p>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Scale className="text-primary-600" /> DisputeResolution
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <input
              className="input"
              placeholder="Dispute Type"
              value={disputeForm.disputeType}
              onChange={(e) =>
                setDisputeForm((p) => ({ ...p, disputeType: e.target.value }))
              }
            />
            <input
              className="input"
              placeholder="Property ID"
              value={disputeForm.propertyId}
              onChange={(e) =>
                setDisputeForm((p) => ({ ...p, propertyId: e.target.value }))
              }
            />
            <input
              className="input"
              placeholder="Transfer ID"
              value={disputeForm.transferId}
              onChange={(e) =>
                setDisputeForm((p) => ({ ...p, transferId: e.target.value }))
              }
            />
          </div>
          <input
            className="input"
            placeholder="Respondent wallet"
            value={disputeForm.respondent}
            onChange={(e) =>
              setDisputeForm((p) => ({ ...p, respondent: e.target.value }))
            }
          />
          <input
            className="input"
            placeholder="Evidence URI"
            value={disputeForm.evidenceURI}
            onChange={(e) =>
              setDisputeForm((p) => ({ ...p, evidenceURI: e.target.value }))
            }
          />
          <div className="flex gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={disputeForm.blockProperty}
                onChange={(e) =>
                  setDisputeForm((p) => ({
                    ...p,
                    blockProperty: e.target.checked,
                  }))
                }
              />{" "}
              Block Property
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
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
            className="btn btn-primary"
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
            Open Dispute
          </button>
          <div className="grid grid-cols-3 gap-3">
            <input
              className="input"
              placeholder="Dispute ID"
              value={disputeForm.disputeId}
              onChange={(e) =>
                setDisputeForm((p) => ({ ...p, disputeId: e.target.value }))
              }
            />
            <select
              className="input"
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
            <button
              className="btn btn-outline"
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
          <p className="text-sm font-semibold text-slate-600">
            Property blocked: {isPropertyBlocked ? "Yes" : "No"}
          </p>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Shield className="text-primary-600" /> TitleInsurance
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input"
              placeholder="Reserve ETH"
              value={insuranceForm.reserveEth}
              onChange={(e) =>
                setInsuranceForm((p) => ({ ...p, reserveEth: e.target.value }))
              }
            />
            <button
              className="btn btn-outline"
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
              Fund Reserve
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input"
              placeholder="Property ID"
              value={insuranceForm.propertyId}
              onChange={(e) =>
                setInsuranceForm((p) => ({ ...p, propertyId: e.target.value }))
              }
            />
            <input
              className="input"
              placeholder="Policy holder"
              value={insuranceForm.holder}
              onChange={(e) =>
                setInsuranceForm((p) => ({ ...p, holder: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input
              className="input"
              placeholder="Premium ETH"
              value={insuranceForm.premiumEth}
              onChange={(e) =>
                setInsuranceForm((p) => ({ ...p, premiumEth: e.target.value }))
              }
            />
            <input
              className="input"
              placeholder="Coverage ETH"
              value={insuranceForm.coverageEth}
              onChange={(e) =>
                setInsuranceForm((p) => ({ ...p, coverageEth: e.target.value }))
              }
            />
            <input
              className="input"
              type="date"
              value={insuranceForm.expiryDate}
              onChange={(e) =>
                setInsuranceForm((p) => ({ ...p, expiryDate: e.target.value }))
              }
            />
          </div>
          <input
            className="input"
            placeholder="Policy URI"
            value={insuranceForm.policyURI}
            onChange={(e) =>
              setInsuranceForm((p) => ({ ...p, policyURI: e.target.value }))
            }
          />
          <button
            className="btn btn-primary"
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
                [refetchReservePool],
              )
            }
          >
            Issue Policy
          </button>
          <div className="grid grid-cols-3 gap-3">
            <input
              className="input"
              placeholder="Policy ID"
              value={insuranceForm.policyId}
              onChange={(e) =>
                setInsuranceForm((p) => ({ ...p, policyId: e.target.value }))
              }
            />
            <input
              className="input"
              placeholder="Dispute ID"
              value={insuranceForm.claimDisputeId}
              onChange={(e) =>
                setInsuranceForm((p) => ({
                  ...p,
                  claimDisputeId: e.target.value,
                }))
              }
            />
            <button
              className="btn btn-outline"
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
                  "Claim payout completed",
                  [refetchReservePool],
                )
              }
            >
              Payout Claim
            </button>
          </div>
          <p className="text-sm font-semibold text-slate-600">
            Reserve pool: {reservePool ? formatUnits(reservePool, 18) : "0"} ETH
          </p>
        </section>

        <section className="card p-6 space-y-4 xl:col-span-2">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <PieChart className="text-primary-600" /> PropertyToken / Fractional
            Ownership
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              className="input"
              placeholder="Property ID"
              value={tokenForm.propertyId}
              onChange={(e) =>
                setTokenForm((p) => ({ ...p, propertyId: e.target.value }))
              }
            />
            <input
              className="input"
              placeholder="Total shares"
              value={tokenForm.totalShares}
              onChange={(e) =>
                setTokenForm((p) => ({ ...p, totalShares: e.target.value }))
              }
            />
            <input
              className="input md:col-span-2"
              placeholder="Token URI"
              value={tokenForm.tokenURI}
              onChange={(e) =>
                setTokenForm((p) => ({ ...p, tokenURI: e.target.value }))
              }
            />
          </div>
          <button
            className="btn btn-primary"
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
                [refetchTokenizedProperty, refetchHolderShares],
              )
            }
          >
            Tokenize Property
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="input"
              placeholder="Holder wallet"
              value={tokenForm.holderAddress}
              onChange={(e) =>
                setTokenForm((p) => ({ ...p, holderAddress: e.target.value }))
              }
            />
            <button
              className="btn btn-outline"
              onClick={() =>
                Promise.all([refetchTokenizedProperty(), refetchHolderShares()])
              }
            >
              Refresh Share State
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-slate-500 font-semibold">Token Active</p>
              <p className="text-slate-800 font-extrabold text-lg">
                {tokenizedProperty?.active ? "Yes" : "No"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-slate-500 font-semibold">Total Shares</p>
              <p className="text-slate-800 font-extrabold text-lg">
                {tokenizedProperty ? Number(tokenizedProperty.totalShares) : 0}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-slate-500 font-semibold">Holder Shares</p>
              <p className="text-slate-800 font-extrabold text-lg">
                {holderShares ? Number(holderShares) : 0}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
