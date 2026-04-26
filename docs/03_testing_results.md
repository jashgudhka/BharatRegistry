# Chapter 5: Testing & Analysis

### 5.1 Performance Benchmarks
| Metric | Result | Improvement |
| :--- | :--- | :--- |
| **Block Time** | 3 Seconds | 90% reduction vs legacy |
| **Finality Latency** | 1 Block | Instant legal certainty |
| **Sync Jitter** | < 500ms | Real-time UI updates |
| **Throughput** | 100+ TPS | Supports national-scale pilots |

### 5.2 STRIDE Threat Analysis
-   **Spoofing:** Neutralized via Aadhaar-linked ECDSA signatures and MetaMask validation.
-   **Tampering:** Prevented by IBFT 2.0 consensus, requiring 2/3rd of validators to agree on state.
-   **Repudiation:** Every action is cryptographically signed; non-repudiation is built into the ledger.
-   **Information Disclosure:** PII is hashed or stored in restricted MongoDB nodes; only public data is on-chain.
-   **Denial of Service:** Private P2P network isolation and firewall whitelisting protect the consortium.
-   **Elevation of Privilege:** Enforced via Solidity-level AccessControl (RBAC).

### 5.3 Test Case Execution
We conducted a 1000-transaction stress test to simulate a busy district’s volume:
-   **Success Rate:** 100%
-   **Integrity Check:** 100% Match between Blockchain and MongoDB.
-   **Average Confirmation:** 2.8 seconds.

### 5.4 Smart Contract Security
Manual forensic code reviews identified and resolved:
-   **Orphaned UPTs:** Added `address(0)` checks to prevent property loss.
-   **Reentrancy:** Implemented `ReentrancyGuard` on all escrow-related functions.
-   **Integer Checks:** Solidity 0.8.x implicit checked arithmetic verified for high-value transfers.

---

# Chapter 6: Results & Discussion

### 6.1 Economic Impact
The Bharat Registry acts as a **"Liquidity Injector"** for the economy. By providing conclusive titles, we enable rural landowners to leverage their land for credit at formal interest rates, bypassing informal lenders.

### 6.2 Transition Strategy: Paper to Protocol
The transition from legacy systems follows a three-step model:
1.  **Anchoring:** Uploading scanned legacy deeds to IPFS and hashing them on-chain.
2.  **Validation:** Field verification by a `VERIFIER_ROLE` to mint the UPT.
3.  **Governance:** Mandatory on-chain mutation for all subsequent transfers.

### 6.3 Ethical Mandate
The project prioritizes **Digital Equity**. By removing the "Intermediary Toll," we return power to the citizen. The use of zero-gas fees ensures that even the most economically vulnerable citizens can participate in the digital property market without financial barriers.
