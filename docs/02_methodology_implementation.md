# Chapter 3: Methodology & Architectural Design

### 3.1 Technology Stack
| Layer | Selection | Rationale |
| :--- | :--- | :--- |
| **Trust Layer** | Hyperledger Besu | Permissioned Consortium + EVM Compatibility |
| **Consensus** | IBFT 2.0 | Instant Finality + Zero Gas Fees |
| **Data** | MongoDB / GeoJSON | High-performance off-chain indexing |
| **Storage** | IPFS | Decentralized, content-addressable storage |
| **Frontend** | React / Vite | Modern UI + Robust Web3 state management |

### 3.2 System Architecture
The architecture follows a **Four-Tier Hybrid Stack**:
1.  **Client Layer:** React/Vite SPA with premium glassmorphism aesthetic.
2.  **API Gateway:** Node.js/Express handling sessions and metadata.
3.  **Sync Loop:** Persistent listener watching Besu logs to update the MongoDB cache.
4.  **Decentralized Core:** Hyperledger Besu & IPFS as the final arbiters of truth.

### 3.3 Conceptual Models
-   **Class Diagram:** Defines the relationships between `User`, `Property`, `Transfer`, `Document`, and `Dispute` entities.
-   **Use Case Diagram:** Maps stakeholder actions (Register, Transfer, Verify, Mortgage) to the system.
-   **Sequence Diagram:** Details the asynchronous flow from frontend to blockchain confirmation.
-   **Activity Diagram:** Defines the "Atomic Swap" workflow for property transfers requiring dual signatures.

### 3.4 Behavioral Modeling: The State Machine
A land parcel in Bharat Registry exists in one of five discrete states:
-   `MINTED`: Newly created by a verifier.
-   `VERIFIED`: Confirmed boundaries, active for trade.
-   `LIEN_LOCKED`: Under active bank mortgage.
-   `IN_ESCROW`: Transfer in progress.
-   `DISPUTED`: Frozen due to legal challenge.

---

# Chapter 4: System Implementation

### 4.1 The Ledger Logic: `LandRegistry.sol`
The core arbiter of the system, implementing role-based access control (RBAC).
-   **Role Hierarchy:** `ADMIN_ROLE`, `REGISTRAR_ROLE`, `VERIFIER_ROLE`.
-   **Core Functions:**
    -   `registerProperty()`: Creates the property struct with IPFS document hash.
    -   `transferOwnership()`: Atomically swaps ownership in the ledger.
    -   `verifyProperty()`: Upgrades status from Minted to Verified.

### 4.2 Fractional Ownership: `PropertyToken.sol`
Implemented as an **ERC-1155** token, enabling:
-   **Fractionalization:** Splitting a property into shares for investment or inheritance.
-   **Lease Management:** Smart contracts that automate rent payments and claims.
-   **Sale Listings:** On-chain fractional marketplaces for property portions.

### 4.3 The Sync Engine: `blockchainService.js`
A fault-tolerant background service that ensures the MongoDB index is a perfect mirror of the blockchain.
-   **LVI Pattern:** "Listen-Verify-Index" pattern to handle event detection and consensus finality checks.
-   **Audit Recovery:** Automatic block-replay to heal data gaps after server downtime.

### 4.4 Data Storage Strategy
We implement a **"Tri-Modal"** strategy for scalability:
-   **Structural Metadata:** (Survey No, Owner, Document CID) stored on-chain.
-   **Descriptive Metadata:** (Photos, blueprints) stored on IPFS.
-   **Operational Metadata:** (Search tags, regional categories) stored in MongoDB.

### 4.5 Identity Management
The **Aadhaar-to-Wallet** link is the most critical attack surface. We use a **"Sovereign Multi-Sig"** for key recovery, ensuring that land rights are tied to a citizen's physical existence through biometric verification, not just their possession of a digital key.
