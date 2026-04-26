---
title: "Proposing a Blockchain Powered Land Registry and Implementing Smart Contracts to Revolutionize the System"
author: 
  - Jash Gudhka, jashgudhka@gmail.com
  - Student at Somaiya Vidyavihar University, Mumbai, India
  - Under the guidance of Dr. Swati R Maurya
---

## Abstract
India's land registration system is overloaded with old paperwork and unorganized data. It is one of the main reasons for land related issues for the citizens. Poor management has led to property fraud, inheritance disputes, etc. This paper proposes a blockchain framework that will be designed to modernize this system. This solution will utilize a private Ethereum network (permissioned blockchain) to establish a single, authoritative source of truth for property titles, where each property will be represented as a unique digital asset. Smart contracts will help to automate critical processes such as ownership transfers, inheritance claims, broker agreements, loan verifications, etc, which will be triggered by digitally verified real world events. Inspired by successful international implementations set in Georgia and Sweden, this proposed system will incorporate features specifically for the Indian context, including integration with the Aadhaar identity system and a novel automated notification system for "lost heirs." The key design choice is the separation of on-chain registration from off-chain financial transactions, making the system possibly free for citizens to use. This decentralized architecture will provide data immutability and tamper resistance, which will allow citizens to have direct and verifiable access to their property records. This framework may help to significantly reduce fraud, streamline the administration process, and provide clear, indisputable ownership rights.

**Keywords:** Blockchain, Land Registry, Smart Contracts, India, e-Governance, Property Rights, Property disputes, Digital India, Ethereum, Decentralization. 

## I. INTRODUCTION
India's land administration system is a colonial-era relic, it is a complex web of paper based records and overlapping regulations that has failed to keep up with the nations development. Despite modernization efforts like the Digital India Land Records Modernization Programme (DILRMP) [1], the system is still relies on the idea of "presumptive titling." This means that having a “land record” is not a guarantee of your ownership of the land but just evidence, which can be challenged in court if someone wants to. This fundamental flaw has created a system that is notoriously "inefficient, expensive, and outdated," imposing a heavy burden on ordinary citizens [8]. 

For the average person, any property related transaction be it a sale, purchase, or inheritance, it is a journey through a messy bureaucratic maze. They must assemble a "chain of documents" to prove ownership history, a process so confusing that it often requires costly intermediaries like lawyers, and it is often time consuming. This lack of transparency is a breeding ground for fraud, from forged deeds to the same property being sold to multiple unsuspecting buyers [2], [9]. Inheritance, which is ought to be a simple transfer of assets, in the current system it can easily lead to long lasting legal disputes because of unclear titles. Land related conflicts are very common; a 2018 study revealed they constitute a staggering percentage, around 20% of all pending cases in Indian courts, a testament to the urgent need for reform [10] and according to the latest reports the number has been reported to be around 7.4 Million pending land disputes in courts and these are reported cases, many disputes go unreported, solved under the table. 

The issues extend to the real estate market as well, where an informal and unregulated brokerage ecosystem often leads to commission disputes and a lack of professional accountability. The cumulative effect of these problems is a significant drag on the economy and an overwhelming caseload for the judiciary. 

Blockchain technology presents an opportunity to fundamentally re-engineer this broken system. By creating a single, unchangeable, and transparent digital ledger, it can serve as the "single source of truth" for land ownership. This paper proposes a blockchain framework crafted for the Indians. It proposes a blockchain that not only secures property titles but also automates key processes through smart contracts, can also integrate with India's national identity system, and is could be served as a zero cost or cheap public utility for all citizens. 

## II. RELATED WORK AND GLOBAL IMPLEMENTATIONS
### A. Georgia
Emerging from the Soviet era, Georgia was severely suffering by systemic corruption and a very strong public mistrust in state government organizations. To try to make it better, the government partnered with the Bitfury Group to reform its land registry on a blockchain [3]. The system uses property titles as a base to the Bitcoin blockchain, creating an immutable and publicly verifiable record. The impact was immediate and profound, registration times reduced from days to mere minutes, administrative overheads fell sharply, and property related fraud was almost eradicated. The Georgian success story became a powerful demonstration of blockchain's potential to restore trust and efficiency in public services, especially in contexts where old school legacy systems have been compromised [4]. As one analysis concluded, "The Georgian project is a leading example of how blockchain can be used to secure government records and make them transparent to the public" [11].

### B. Sweden
In Sweden, the land registry authority, Lantmäteriet, collaborated with the tech firm ChromaWay, Telia, and several banks to pilot a blockchain solution for property transactions [5]. Their primary goal was to create a seamless and transparent workflow shared among all stakeholders, the buyer, seller, broker, bank, and government. In their model, a smart contract takes care of the entire transaction, from the digital signing of the purchase agreement to the final registration of the new title. While it has not yet been rolled out nationally, the Swedish trial confirmed that smart contracts could effectively manage complex, multi party transactions, ensuring that all participants are synchronized and that the exchange of funds and title is secure and atomic(Is done or not done at all)[6]. The project also highlighted that end-to-end digitization depends on building a collaborative ecosystem [12]. 

### C. Key Takeaways
The innovative attempts in Georgia and Sweden offer two vital insights. First, blockchain technology can deliver dramatic improvements in speed and security, significantly reducing the risk of fraud. Second, a successful implementation, consisting of the entire transaction lifecycle, not merely the final act of registration is possible. My proposed framework for India builds on these lessons, focusing on both the integrity of the digital title and the automation of the processes that govern it.

## III. PROPOSED SYSTEM ARCHITECTURE
The architecture I propose in this paper is a decentralized, secure, and citizen focused system. It can be built on a permissioned blockchain network based on Ethereum network, that employs a hybrid on-chain/off-chain data strategy, and integrates deeply with India's existing digital public infrastructure to establish a single, authoritative source of truth for land ownership.
 
![Proposed System Architecture](images/architecture.png)
*Fig. 1. Proposed System Architecture*

### A. Platform: Private Permissioned Blockchain
I suggest for a private, permissioned blockchain built on an Ethereum framework for example, Hyperledger Besu or Quorum. This choice is intentional, because it offers a balance of control, cost-effectiveness, and performance. 
1.	**Sovereignty:** The Government of India would maintain ultimate authority over the network, with the power to designate which trusted entities (nodes) are permitted to validate transactions.
2.	**Zero Cost for Citizens:** Because the network is private and does not rely on public mining, transactions can be processed without "gas" fees. This makes the land registry a free public service. 
3.	**Data Privacy:** Unlike public blockchains where all data is open, a permissioned model ensures that sensitive land ownership information is not exposed to the public. 
4.	**Scalability:** Private networks can handle a much higher volume of transactions per second compared to their public counterparts, a critical requirement for a nation of India's scale. 

### B. The Digital Title: A Unique Property Token (UPT)
At the heart of this system is the Unique Property Token (UPT), a non-fungible digital asset representing a specific parcel of land. Each UPT, which will be compliant with standards like ERC-721, would encapsulate the following essential data: 
- The government-assigned Unique Land Parcel Identification Number (ULPIN) [1]. 
- An encrypted identity hash of the current owner, securely linked to their Aadhaar identity for stronger verification.
- An immutable, chronological ledger of all past ownership transfers.
- Cryptographic hashes of all pertinent legal documents, including sale deeds, mutation orders, and survey maps.

To bridge the physical and digital worlds, a QR code can be generated for each UPT. This code can be printed on official documents or accessed via a mobile app. A simple scan would instantly retrieve and verify the property's real-time status on the blockchain, making due diligence simple and accessible [9]. 

### C. Data Security and Decentralized Governance
The system's security model is built on a hybrid approach to data storage: 
- **On-Chain Data:** The UPT itself, containing the essential ownership and transaction history, resides on the blockchain. This information benefits directly from the cryptographic immutability of the distributed ledger. 
- **Off-Chain Storage:** The bulky legal documents (sale deeds, survey maps, etc.) are encrypted and stored on a decentralized file system, such as the InterPlanetary File System (IPFS). Only the cryptographic hash (a unique fingerprint) of these documents is recorded on-chain. This design keeps the blockchain lean and efficient while ensuring that the off-chain documents are tamper-proof, any alteration to a document would change its hash, creating a mismatch with the on-chain record if the owner needs to do any changes, it needs to be approved On-Chain as well via the respective government authorities. 
 
![On-Chain vs. Off-Chain Data Model](images/offchain.png)
*Fig. 2. On-Chain vs. Off-Chain Data Model*

Governance of the network, while permissioned, is also decentralized. Validator nodes the computers that maintain the ledger would be operated by a distributed group of stakeholders, including the Central Land Records Ministry, State Sub-Registrar Offices, and key judicial bodies. This distribution of authority ensures that no single entity can unilaterally manipulate the ledger, making the system highly resilient to both internal corruption and external attacks. 

Citizens would interact with the system via a secure web portal or mobile application, using their Aadhaar number for robust identity authentication. 

## IV. CORE USE CASES AND SMART CONTRACT IMPLEMENTATION
Smart contracts are the main essence of this framework, automating complex processes to minimize human error, eliminate ambiguity, and enforce rules transparently. The diagrams below illustrate the core workflows, detailing the interactions between citizens, authorities, and the blockchain. 

### A. Use Case 1: Property Sale
The following workflow details a standard property sale. It is designed to ensure that the digital title transfer is final and irreversible, contingent only upon verification by a Sub-Registrar Office (SRO) official. This creates a secure, auditable, and efficient process. 

Citizens (Buyer & Seller) agree on Terms & Make Payment (Off-Chain). They then Submit Joint "Transfer Request" with Payment Proof to the Portal and now the SRO Verifies Identities & Payment Proof. On successful verification of the documents SRO Triggers the `transferUPT` Function to transfer the UPT. Once UPT is Transferred to Buyer on Blockchain, the Buyer & Seller Receives Confirmation.
 
![Property Sale & Transfer Process](images/workflow.png)
*Fig. 3. Property Sale & Transfer Process*

### B. Use Case 2: Bank Mortgage and Digital Lien
This use case reimagines the process of securing a loan against a property. It creates a transparent and instantly verifiable digital lien on the property's UPT. The smart contract governing the lien is autonomous, ensuring that the lien is only released when the loan conditions are met, thus protecting the interests of both the lender and the property owner. With the help of this smart contract the loan frauds can be reduced to none, because the smart contract will be applied to a UPT and if the owner tries to create another smart contract to get a loan for the same property, they will not be able to do that. 
 
![Bank Mortgage & Digital Lien Process](images/mortgage.png)
*Fig. 4. Bank Mortgage & Digital Lien Process*

### C. Use Case 3: Automated Inheritance and the "Lost Heir" Solution
A significant social challenge in India is that legal heirs are often unaware of property inherited to them, leading to unclaimed assets and legal disputes. This feature directly addresses this problem by creating a secure, private, and automated mechanism for succession. The transfer is triggered by a verified real-world event (such as the issuance of a death certificate), ensuring that intended beneficiaries are automatically notified and can claim their inheritance with minimal efforts. 
 
![Automated Inheritance & "Lost Heir" Process](images/inheritance.png)
*Fig. 5. Automated Inheritance & "Lost Heir" Process*
 
## V. KEY FEATURES AND INNOVATIONS
Our framework is not a generic blockchain solution. It introduces several innovations tailored to address the specific pain points of the Indian real estate and legal environment. 
- **Zero-Cost Citizen Service:** By leveraging a permissioned blockchain, we eliminate the variable and often high transaction fees (or "gas" costs) associated with public blockchains. This makes the system a true public good, accessible to all citizens regardless of their financial status.
- **Robust Identity Verification via Aadhaar:** The mandatory use of Aadhaar based biometric authentication for all critical actions (such as title transfer or placing a lien) provides a powerful defense against impersonation and identity fraud. 
- **Proactive Inheritance:** The "Executable Will" smart contract is a novel solution to the problem of "lost heirs." It transforms inheritance from a reactive, often litigious process into a proactive and automated one, reducing the burden on both families and the courts. 
- **Formalizing the Informal:** By enabling on-chain agreements for broker commissions, the system brings much-needed transparency and accountability to a traditionally unregulated segment of the real estate market. 

## VI. IMPLEMENTATION CHALLENGES AND MITIGATION
Deploying a system of this scale and importance will naturally face significant hurdles. A carefully planned, phased rollout, likely starting with a pilot program in a single tech-forward district, will be a possible way to implement this successfully. The key challenges include: 
- **Legacy Data Migration:** The most problematic task will be the digitization and verification of millions of existing, often weak and vague, paper based land records. This will be a massive bottleneck, requiring a combination of modern technologies like Optical Character Recognition (OCR) and AI, alongside a well structured and accountable manual verification process. 
- **Bridging the Digital Divide:** To ensure equitable access, a nationwide public outreach and education campaign will be necessary. Because most of the population even though are literate, are often technically challenged, so it needs to be taught .This must go beyond simple advertising and involve hands on training and support centers to help all citizens, regardless of their technical literacy, use the system confidently without any struggles.
- **Legal and Regulatory Adaptation:** The existing legal framework for property rights will need to evolve. Amendments will be required to formally recognize blockchain based digital titles and smart contract driven transactions as legally binding, ensuring that the new system has full judicial support.

## VII. CONCLUSION AND FUTURE SCOPE
The framework detailed in this paper represents more than a mere technological upgrade. It offers a foundational blueprint for a more transparent, and efficient system of property rights in India. While the core architecture addresses the most pressing current issues, its true potential lies in future integrations that could ripple across the broader digital ecosystem. 

Imagine a future where a property transfer on the blockchain automatically triggers address updates in a citizen's passport and bank records. Consider agricultural land where smart contracts, fed by trusted weather data could autonomously process and pay out crop insurance claims. The final step in this evolution would be a formal, on-chain dispute resolution mechanism, where judicial orders are issued and executed directly as blockchain transactions, creating a fully digital and unbroken chain of governance.

### A. Future Enhancements: Biometric Verification and Trusted Delegation 
To further enhance the security and add practical convenience, the framework can be extended with features like advanced biometric verification and a system for delegated authority. These would address real world scenarios where a property owner may be unable to be physically present for a transaction, without compromising the integrity of the system. 

#### 1) Biometric Identity Assurance
While Aadhaar integration provides a strong baseline, the system's future could incorporate real-time biometric verification for the most critical transactions. For high-stakes actions like transferring a title or authorizing a large loan, the owner would be required to provide a live biometric scan (such as a fingerprint or iris scan). This would create an unbreakable link between the individual and the transaction, virtually eliminating the risk of identity theft. 

#### 2) Delegated Authority via Smart Contracts
To solve the practical problem of an owner's absence, a "Trusted Member" feature can be introduced. Through a specific smart contract, an owner could delegate a limited and clearly defined set of rights to a trusted individual, such as a family member or a legal representative. This contract would grant the delegate the authority to perform specific actions, like presenting documents for verification at a government office, while explicitly forbidding them from executing major actions like selling the property, unless they authorize it via a smart contract. 

When the trusted member visits a government office, the official can scan a QR code to instantly verify the smart contract on the blockchain, confirming that the delegate has the owner's explicit, digitally-signed permission to act on their behalf for a specific, limited purpose. 

#### 3) Secure Multi-Party Loan Authorization
The "Trusted Member" concept can be powerful, but it requires additional safeguards when applied to financial transactions like bank loans. By default, a trusted member would be barred from securing a loan against the property. To enable this, a multi party escrow, a smart contract would be necessary, involving three distinct parties: the property owner, the trusted member, and a designated bank officer acting as an escrow agent.
 
![Secure Multi-Party Loan Authorization](images/multiparty_loan.png)
*Fig. 6. Secure Multi-Party Loan Authorization*

The creation of this escrow contract would require the simultaneous, biometrically verified consent of all three parties, ensuring that the owner, the trusted member, and the bank are all in agreement. To add a final layer of security and prevent misuse, a two-factor authentication (2FA) mechanism would be implemented. Even with the escrow contract in place, the trusted member cannot unilaterally secure the loan. The owner must provide a final, separate approval via a second smart contract, triggered by a 2FA notification. This final confirmation ensures the owner is fully aware of and consents to the loan at the moment of its creation, preventing any possibility of fraud by the delegate.

________________________________________
 
## REFERENCES
[1] Department of Land Resources, Government of India, "Digital India Land Records Modernization Programme (DILRMP)." Available: https://dolr.gov.in/programmes-schemes/dilrmp-2/
[2] V. Thakur, M. N. Doja, Y. K. Dwivedi, T. Ahmad, and G. Khadanga, "Land records on blockchain for implementation of land titling in India," *International Journal of Information Management*, vol. 52, p. 102071, 2020.
[3] N. Lazuashvili, A. Norta, and D. Draheim, "Integration of blockchain technology into a land registration system for immutable traceability: A case study of Georgia," in *Business Process Management: Blockchain and Central and Eastern Europe Forum*, pp. 219–233, 2019.
[4] Bitfury Group, "*Blockchain Land Registry in the Republic of Georgia*," 2017. Available: https://exonum.com/napr
[5] ChromaWay, "*The Swedish Land Registry and Blockchain*," 2017. Available: https://chromaway.com/
[6] M. Bal, "*Securing property rights in India through distributed ledger technology*," ORF Occasional Paper, 2017.
[7] MeitY, Government of India, "*National Strategy on Blockchain*," 2021. Available: https://www.meity.gov.in/writereaddata/files/National_BCT_Strategy.pdf
[8] NITI Aayog, "*Blockchain: The India Strategy*," 2020. Available: https://www.niti.gov.in/sites/default/files/2020-01/Blockchain_The_India_Strategy_Part_I.pdf
[9] UNDP, "Using blockchain to make land registry more reliable in India," 2018. Available: https://www.undp.org/blog/using-blockchain-make-land-registry-more-reliable-india
[10] Daksh India, "*State of the Indian Judiciary*," 2018. Available: https://dakshindia.org/state-of-the-indian-judiciary/
[11] World Bank, "Georgia’s blockchain land registry: A solution for India?," 2017. Available: https://blogs.worldbank.org/endpovertyinsouthasia/georgias-blockchain-land-registry-solution-india
[12] Lantmäteriet, "*Blockchain land registry project report*," 2017.
[13] A. Roy, "The anarchy of empire: In the wake of nine-eleven," 2005. 
[14] Department of Land Resources, Government of India, "Unique Land Parcel Identification Number (ULPIN) System," 2023. Available: https://pib.gov.in/PressReleaseIframePage.aspx?PRID=1908583
[15] "Assam rolls out ULPIN, now part of national land records modernisation programme," *The Hindu BusinessLine*, 2023. Available: https://www.thehindubusinessline.com/economy/assam-rolls-out-ulpin-now-part-of-national-land-records-modernisation-programme/article6665923ece
[16] "What is Digital India Land Records Modernisation Programme?," *The Economic Times*, 2024. Available: https://economictimes.indiatimes.com/news/economy/policy/what-is-digital-india-land-records-modernisation-programme/articleshow/107989912.cms
[17] Mondaq, "India: The digital India land records modernization programme (DILRMP) and its impact on the real estate sector," 2024. Available: https://www.mondaq.com/india/real-estate/1435920/the-digital-india-land-records-modernization-programme-dilrmp-and-its-impact-on-the-real-estate-sector
[18] Press Information Bureau, Government of India, "SVAMITVA scheme of Ministry of Panchayati Raj wins National Award for e-Governance 2023," 2023. Available: https://pib.gov.in/PressReleaseIframePage.aspx?PRID=1952323
[19] Geospatial World, "India's SVAMITVA scheme: A paradigm shift in rural land governance," 2023. Available: https://www.geospatialworld.net/blogs/indias-svamitva-scheme-a-paradigm-shift-in-rural-land-governance/
[20] World Bank, "Titling land in India: From presumptive to conclusive," Mar. 2, 2023. Available: https://www.worldbank.org/en/news/feature/2023/03/02/titling-land-in-india-from-presumptive-to-conclusive
[21] G. Nair, "*Land titling in India: Issues and the way forward*," Observer Research Foundation, 2021. Available: https://www.orfonline.org/research/land-titling-in-india-issues-and-the-way-forward
[22] "Karnataka to take up urban property ownership records survey across state," *Deccan Herald*, 2022. Available: https://www.deccanherald.com/state/karnataka-to-take-up-urban-property-ownership-records-survey-across-state-1157086.html
[23] "Property cards for 51 villages in Pune district by March-end," *The Times of India*, 2023. Available: https://timesofindia.indiatimes.com/city/pune/property-cards-for-51-villages-in-pune-district-by-march-end/articleshow/98082296.cms
[24] *Forbes*, "How blockchain is helping reduce land registry fraud," Nov. 19, 2021. Available: https://www.forbes.com/sites/forbestechcouncil/2021/11/19/how-blockchain-is-helping-reduce-land-registry-fraud/
[25] *Ledger Insights*, "Indian state of Telangana uses blockchain for land records," 2023. Available: https://www.ledgerinsights.com/india-telangana-blockchain-land-records/
[26] *Cointelegraph*, "Indian state government to use blockchain for land registry," 2018. Available: https://cointelegraph.com/news/indian-state-government-to-use-blockchain-for-land-registry
[27] World Economic Forum, "This is how blockchain can improve land registry," 2022. Available: https://www.weforum.org/agenda/2022/01/blockchain-land-registry-technology/
[28] PIB Delhi, "Secretary Smt. Nidhi Khare rolls out National Generic Document Registration System throughout Assam along with launch of Unique Land Parcel Identification Number," 2024. Available: https://www.pib.gov.in/PressReleasePage.aspx?PRID=2005546
[29] "How India will benefit from land registry on the blockchain," *Financial Express*, 2025. Available: https://www.financialexpress.com/business/digital-transformation-how-india-will-benefit-from-land-registry-on-the-blockchain-3604121/
[30] Observer Research Foundation, "The growing role of blockchain in Indian governance," 2023. Available: https://www.orfonline.org/expert-speak/the-growing-role-of-blockchain-in-indian-governance
[31] "Maharashtra authority develops blockchain technology to store property buyers' e-registration data," *Moneycontrol*, 2022. Available: https://www.moneycontrol.com/news/business/real-estate/maharashtra-authority-develops-blockchain-technology-to-store-property-buyers-e-registration-data-9140201.html
[32] S. Krishnapriya and G. Sarath, "Securing land registration using blockchain," *Procedia Computer Science*, vol. 171, pp. 1691–1700, 2020.
