const blockchainService = require("./blockchainService");
const Property = require("../models/Property");
const Transaction = require("../models/Transaction");

let listenersInitialized = false;
let retryTimer = null;
let connectionWarningLogged = false;

const normalizeAddress = (value) =>
  typeof value === "string" ? value.toLowerCase() : value;

const buildTransferSnapshot = (transferData) => ({
  transferId: transferData.transferId,
  propertyId: transferData.propertyId,
  seller: normalizeAddress(transferData.seller),
  buyer: normalizeAddress(transferData.buyer),
  agreedPrice: transferData.agreedPrice,
  escrowAmount: transferData.escrowAmount,
  status: transferData.status,
});

const appendTransferTimeline = async (
  transferId,
  timelineEntry,
  setUpdate = {},
) => {
  const transferData = await blockchainService.getTransfer(transferId);

  await Transaction.findOneAndUpdate(
    { transferId: Number(transferId) },
    {
      $set: {
        ...buildTransferSnapshot(transferData),
        ...setUpdate,
      },
      $push: {
        timeline: timelineEntry,
      },
    },
    { upsert: true, new: true },
  );
};

const syncPropertySnapshot = async (
  propertyId,
  options = { set: {}, push: null },
) => {
  const { set: setUpdate = {}, push: pushUpdate = null } = options;
  const propertyData = await blockchainService.getProperty(propertyId);

  const update = {
    $set: {
      propertyId: propertyData.propertyId,
      surveyNumber: propertyData.surveyNumber,
      location: {
        address: propertyData.location,
      },
      area: propertyData.area,
      currentOwner: normalizeAddress(propertyData.currentOwner),
      marketValue: propertyData.marketValue,
      status: propertyData.status,
      registrationDate: propertyData.registrationDate,
      ...setUpdate,
    },
  };

  if (pushUpdate) {
    update.$push = pushUpdate;
  }

  await Property.findOneAndUpdate({ propertyId: Number(propertyId) }, update, {
    upsert: true,
    new: true,
  });
};

const registerListeners = () => {
  blockchainService.setupEventListeners({
    onPropertyRegistered: async (propertyId, owner, surveyNumber, event) => {
      try {
        console.log(`[Event] PropertyRegistered: ${propertyId.toString()}`);
        await syncPropertySnapshot(propertyId, {
          set: {
            blockchainTxHash: event?.transactionHash,
          },
        });
      } catch (err) {
        console.error("Failed to sync registered property:", err);
      }
    },

    onPropertyVerified: async (propertyId, verifier) => {
      try {
        console.log(`[Event] PropertyVerified: ${propertyId.toString()}`);
        await syncPropertySnapshot(propertyId, {
          set: {
            verifiedBy: normalizeAddress(verifier),
            verifiedAt: new Date(),
          },
        });
      } catch (err) {
        console.error("Failed to sync verified property:", err);
      }
    },

    onPropertyTransferred: async (propertyId, from, to, event) => {
      try {
        console.log(
          `[Event] PropertyTransferred: ${propertyId.toString()} from ${from} to ${to}`,
        );

        await syncPropertySnapshot(propertyId, {
          set: {
            currentOwner: normalizeAddress(to),
          },
          push: {
            previousOwners: {
              walletAddress: normalizeAddress(from),
              transferDate: new Date(),
              transactionHash: event?.transactionHash,
            },
          },
        });
      } catch (err) {
        console.error("Failed to sync transferred property:", err);
      }
    },

    onTransferInitiated: async (
      transferId,
      propertyId,
      buyer,
      price,
      event,
    ) => {
      try {
        console.log(`[Event] TransferInitiated: ${transferId.toString()}`);

        await appendTransferTimeline(
          transferId,
          {
            status: "initiated",
            actor: normalizeAddress(buyer),
            transactionHash: event?.transactionHash,
            notes: "Transfer initiated via smart contract",
          },
          {
            initiationTxHash: event?.transactionHash,
          },
        );
      } catch (err) {
        console.error("Failed to sync initiated transfer:", err);
      }
    },

    onEscrowDeposited: async (transferId, amount, event) => {
      try {
        console.log(`[Event] EscrowDeposited: ${transferId.toString()}`);
        const transferData = await blockchainService.getTransfer(transferId);

        await appendTransferTimeline(
          transferId,
          {
            status: "escrow_funded",
            actor: normalizeAddress(transferData.buyer),
            transactionHash: event?.transactionHash,
            notes: "Escrow deposited by buyer",
          },
          {
            escrowAmount: amount.toString(),
            escrowTxHash: event?.transactionHash,
          },
        );
      } catch (err) {
        console.error("Failed to sync escrow deposit:", err);
      }
    },

    onTransferApprovedBySeller: async (transferId, event) => {
      try {
        console.log(
          `[Event] TransferApprovedBySeller: ${transferId.toString()}`,
        );
        const transferData = await blockchainService.getTransfer(transferId);

        await appendTransferTimeline(transferId, {
          status: "approved_by_seller",
          actor: normalizeAddress(transferData.seller),
          transactionHash: event?.transactionHash,
          notes: "Seller approved transfer",
        });
      } catch (err) {
        console.error("Failed to sync seller approval:", err);
      }
    },

    onTransferApprovedByRegistrar: async (transferId, registrar, event) => {
      try {
        console.log(
          `[Event] TransferApprovedByRegistrar: ${transferId.toString()}`,
        );

        await appendTransferTimeline(transferId, {
          status: "approved_by_registrar",
          actor: normalizeAddress(registrar),
          transactionHash: event?.transactionHash,
          notes: "Registrar approved transfer",
        });
      } catch (err) {
        console.error("Failed to sync registrar approval:", err);
      }
    },

    onTransferCompleted: async (transferId, from, to, event) => {
      try {
        console.log(`[Event] TransferCompleted: ${transferId.toString()}`);
        const transferData = await blockchainService.getTransfer(transferId);

        await appendTransferTimeline(
          transferId,
          {
            status: "completed",
            actor: normalizeAddress(to),
            transactionHash: event?.transactionHash,
            notes: "Transfer completed successfully",
          },
          {
            completionTxHash: event?.transactionHash,
            completedAt: transferData.completedAt,
          },
        );
      } catch (err) {
        console.error("Failed to sync completed transfer:", err);
      }
    },

    onTransferCancelled: async (transferId, reason, event) => {
      try {
        console.log(`[Event] TransferCancelled: ${transferId.toString()}`);

        await appendTransferTimeline(
          transferId,
          {
            status: "cancelled",
            actor: "system",
            transactionHash: event?.transactionHash,
            notes: `Transfer cancelled: ${reason}`,
          },
          {
            cancellationReason: reason,
          },
        );
      } catch (err) {
        console.error("Failed to sync cancelled transfer:", err);
      }
    },

    onTransferDisputed: async (transferId, reason, event) => {
      try {
        console.log(`[Event] TransferDisputed: ${transferId.toString()}`);

        await appendTransferTimeline(
          transferId,
          {
            status: "disputed",
            actor: "system",
            transactionHash: event?.transactionHash,
            notes: `Transfer disputed: ${reason}`,
          },
          {
            disputeReason: reason,
          },
        );
      } catch (err) {
        console.error("Failed to sync disputed transfer:", err);
      }
    },
  });

  listenersInitialized = true;
};

const trySetupListeners = async () => {
  if (listenersInitialized) {
    return true;
  }

  const isConnected = await blockchainService.checkConnection();
  if (!isConnected) {
    if (!connectionWarningLogged) {
      console.warn(
        "Blockchain RPC is unavailable. Event listeners will retry every 30 seconds.",
      );
      connectionWarningLogged = true;
    }
    return false;
  }

  registerListeners();
  console.log("Blockchain event listeners attached.");

  connectionWarningLogged = false;
  if (retryTimer) {
    clearInterval(retryTimer);
    retryTimer = null;
  }

  return true;
};

const setupGlobalEventListeners = async () => {
  console.log("Setting up global blockchain event listeners...");

  const setupComplete = await trySetupListeners();
  if (setupComplete || retryTimer) {
    return;
  }

  retryTimer = setInterval(async () => {
    try {
      await trySetupListeners();
    } catch (error) {
      console.error("Failed to retry blockchain listener setup:", error);
    }
  }, 30000);
};

module.exports = { setupGlobalEventListeners };
