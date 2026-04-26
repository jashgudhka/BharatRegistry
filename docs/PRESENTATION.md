---
title: "Proposing a Blockchain Powered Land Registry and Implementing Smart Contracts to Revolutionize the System"
author: Jash Gudhka (Under the guidance of Dr. Swati R Maurya)
date: Somaiya Vidyavihar University
---

### Problem Overview
- India's land registration suffers from a paper-based "presumptive titling" system, leading to widespread property fraud.
- An estimated 7.4 Million pending land disputes are reported.
- Lack of transparency and high costs require multiple intermediaries.

### The Proposed Solution
- A **Permissioned Blockchain (Ethereum-based)** to establish a single source of truth for property titles.
- Implementation of the **Unique Property Token (UPT)**.
- **Smart Contracts** to automate property transfers, inheritance, and liens.
- **Zero Cost for Citizens:** Gas fees absorbed by the governmental network.

---

### Global Implementations: Georgia and Sweden
- **Georgia:** Partnered with Bitfury to move land registry to the blockchain. Registration times were reduced from days to minutes.
- **Sweden:** Piloted a blockchain solution with Lantmäteriet and ChromaWay using smart contracts to execute complete, atomic transactions.
- **Key Takeaways:** Real-world implementations prove that speed, security, and fraud reduction can be realistically achieved via blockchain.

---

### Proposed System Architecture
- Hybrid approach combining on-chain transaction integrity with off-chain large file storage (IPFS).
- Deep integration with existing digital infrastructure (Aadhaar, ULPIN).
- Validator nodes managed by distributed government entities (Registrars, Courts).

![](images/offchain.png)

---

### The Unique Property Token (UPT)
A non-fungible asset (ERC-721 standard) containing:
- Specific Unique Land Parcel Identification Number (ULPIN).
- Encrypted identity hash linked to the owner's Aadhaar.
- Cryptographic hashes of pertinent legal documents.
- Scannable via QR Code for instant, verifiable due diligence.

---

### Core Use Case: Property Sale
- Buyer and Seller agree on terms off-chain.
- Sub-Registrar verifies documentation and payments.
- Smart contract triggers `transferUPT` irrevocably transferring the asset on-chain upon valid official event.

![](images/workflow.png)

---

### Core Use Case: Automated Inheritance ("Lost Heir")
- "Executable Will" Smart Contract solves the problem of abandoned or misclaimed property.
- Will contents stored encrypted within the smart contract.
- Official death registry event triggers automated Aadhaar-verified UPT transfer to the Heir.

![](images/inheritance.png)

---

### Enhancements: Secure Multi-Party Loan Authorization
- Property owners can designate a "Trusted Member" via Smart Contract to manage their property.
- High-stakes transactions (e.g., Bank Loans) enforce an Escrow. 
- Bank Officer, Trusted Member, and Owner (via 2FA) co-verify actions ensuring delegated consent prevents fraud.

![](images/multiparty_loan.png)

---

### Key Features Summary
1. **Zero-Cost Design:** Operating entirely without citizen gas fees.
2. **Robust Identity Verification:** Immutable mapping through Aadhaar biometrics.
3. **Proactive Inheritance:** Reimagining succession organically through smart contracts.
4. **Decentralized Governance:** Validator networks eliminate single points of failure natively.

---

### Conclusion
- Beyond a technological upgrade, the framework provides a transparent structural baseline.
- Addresses the 7.4M backlog of court disputes preemptively.
- The future involves autonomous actions (weather APIs triggering smart-contract crop insurance; formal judicial execution directly onto the blockchain).
