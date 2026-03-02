const blockchainService = require("./blockchainService");
const Property = require("../models/Property");
const Transaction = require("../models/Transaction");

const setupGlobalEventListeners = () => {
  console.log("🎧 Setting up global blockchain event listeners...");

  blockchainService.setupEventListeners({
    onPropertyRegistered: async (propertyId, owner, surveyNumber, event) => {
      try {
        console.log(`[Event] PropertyRegistered: ${propertyId.toString()}`);
        const propertyData = await blockchainService.getProperty(propertyId);
        
        await Property.findOneAndUpdate(
          { propertyId: Number(propertyId) },
          {
            propertyId: propertyData.propertyId,
            surveyNumber: propertyData.surveyNumber,
            location: {
              address: propertyData.location,
            },
            area: propertyData.area,
            currentOwner: propertyData.currentOwner.toLowerCase(),
            marketValue: propertyData.marketValue,
            status: propertyData.status,
            registrationDate: propertyData.registrationDate,
            blockchainTxHash: event?.transactionHash,
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error("Failed to sync registered property:", err);
      }
    },
    
    onPropertyVerified: async (propertyId, verifier, event) => {
      try {
        console.log(`[Event] PropertyVerified: ${propertyId.toString()}`);
        const propertyData = await blockchainService.getProperty(propertyId);
        
        await Property.findOneAndUpdate(
          { propertyId: Number(propertyId) },
          {
            status: propertyData.status,
            verifiedBy: verifier.toLowerCase(),
            verifiedAt: new Date(),
          }
        );
      } catch (err) {
        console.error("Failed to sync verified property:", err);
      }
    },
    
    onPropertyTransferred: async (propertyId, from, to, event) => {
      try {
        console.log(`[Event] PropertyTransferred: ${propertyId.toString()} from ${from} to ${to}`);
        const propertyData = await blockchainService.getProperty(propertyId);
        
        await Property.findOneAndUpdate(
          { propertyId: Number(propertyId) },
          {
            currentOwner: to.toLowerCase(),
            status: propertyData.status,
          }
        );
      } catch (err) {
        console.error("Failed to sync transferred property:", err);
      }
    },
    
    onTransferInitiated: async (transferId, propertyId, buyer, price, event) => {
      try {
        console.log(`[Event] TransferInitiated: ${transferId.toString()}`);
        const transferData = await blockchainService.getTransfer(transferId);
        
        await Transaction.findOneAndUpdate(
          { transferId: Number(transferId) },
          {
            transferId: transferData.transferId,
            propertyId: transferData.propertyId,
            seller: transferData.seller.toLowerCase(),
            buyer: transferData.buyer.toLowerCase(),
            agreedPrice: transferData.agreedPrice,
            escrowAmount: transferData.escrowAmount,
            status: transferData.status,
            $push: {
              timeline: {
                status: transferData.status,
                actor: buyer.toLowerCase(),
                transactionHash: event?.transactionHash,
                notes: "Transfer initiated via smart contract",
              },
            },
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error("Failed to sync initiated transfer:", err);
      }
    },
    
    onTransferCompleted: async (transferId, from, to, event) => {
      try {
        console.log(`[Event] TransferCompleted: ${transferId.toString()}`);
        const transferData = await blockchainService.getTransfer(transferId);
        
        await Transaction.findOneAndUpdate(
          { transferId: Number(transferId) },
          {
            status: transferData.status,
            completedAt: transferData.completedAt,
            $push: {
              timeline: {
                status: transferData.status,
                actor: to.toLowerCase(),
                transactionHash: event?.transactionHash,
                notes: "Transfer completed successfully",
              },
            },
          }
        );
      } catch (err) {
        console.error("Failed to sync completed transfer:", err);
      }
    }
  });
};

module.exports = { setupGlobalEventListeners };
