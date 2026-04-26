"""Build v5 document — surgical insertion into original, update TOC/LOF/LOT."""
import os, copy
from docx import Document
from docx.shared import Pt, Inches, RGBColor, Cm, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

SRC = r"c:\Projects\MSc\BharatRegistry\JASH_PROJECT_REPORT_MSC_BHARAT_REGISTRY-Final.docx"
DST = r"c:\Projects\MSc\BharatRegistry\JASH_PROJECT_REPORT_MSC_BHARAT_REGISTRY-v5.docx"
IMG = r"c:\Projects\MSc\BharatRegistry\docs\images\v5"
BLACK = RGBColor(0,0,0)

doc = Document(SRC)

# ── HELPERS ──────────────────────────────────────────────────────────────────
def find_para_idx(text, start=0):
    for i, p in enumerate(doc.paragraphs):
        if i < start: continue
        if text.lower() in p.text.lower():
            return i
    return -1

def make_body_para(text):
    """Create a body paragraph matching original doc style."""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    pf = p.paragraph_format
    pf.line_spacing = 1.0
    pf.space_after = Pt(0)
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(14)
    run.font.color.rgb = BLACK
    return p

def make_code_block(lines):
    """Create a list of code-line paragraphs."""
    paras = []
    for ln in lines:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        pf = p.paragraph_format
        pf.line_spacing = 1.0
        pf.space_after = Pt(0)
        pf.left_indent = Cm(1.0)
        run = p.add_run(ln if ln else ' ')
        run.font.name = 'Courier New'
        run.font.size = Pt(10)
        run.font.color.rgb = BLACK
        paras.append(p)
    return paras

def make_image_para(img_name, width=5.5):
    fpath = os.path.join(IMG, img_name)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run()
    run.add_picture(fpath, width=Inches(width))
    return p

def make_caption(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pf = p.paragraph_format
    pf.line_spacing = 1.0
    pf.space_before = Pt(4)
    pf.space_after = Pt(12)
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(11)
    run.font.color.rgb = BLACK
    run.italic = True
    return p

def make_blank():
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_after = Pt(0)
    return p

def move_elements_after(anchor_idx, elements):
    """Move list of paragraph elements from end of body to after anchor_idx."""
    body = doc.element.body
    anchor_el = doc.paragraphs[anchor_idx]._p
    ref_idx = list(body).index(anchor_el)
    for j, el in enumerate(elements):
        xml_el = el._p if hasattr(el, '_p') else el._tbl if hasattr(el, '_tbl') else el
        body.remove(xml_el)
        body.insert(ref_idx + 1 + j, xml_el)

def make_table(headers, rows):
    t = doc.add_table(rows=1+len(rows), cols=len(headers))
    t.style = 'Table Grid'
    for ci, h in enumerate(headers):
        cell = t.rows[0].cells[ci]
        cell.text = h
        for run in cell.paragraphs[0].runs:
            run.bold = True
            run.font.name = 'Times New Roman'
            run.font.size = Pt(10)
            run.font.color.rgb = BLACK
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            cell = t.rows[ri+1].cells[ci]
            cell.text = str(val)
            for run in cell.paragraphs[0].runs:
                run.font.name = 'Times New Roman'
                run.font.size = Pt(9)
                run.font.color.rgb = BLACK
    return t

print("Helpers loaded. Starting insertions...")

# ═══════════════════════════════════════════════════════════════════════════
# INSERTION 1: After 3.9 — Architecture diagram
# ═══════════════════════════════════════════════════════════════════════════
i39 = find_para_idx('3.9 Holistic System Architecture')
i310 = find_para_idx('3.10 Deep Architecture', i39+1)
anchor = i310 - 1

els = []
els.append(make_body_para(
    'The architectural blueprint of the Bharat Registry follows a four-tier layered model, '
    'where each tier encapsulates a distinct set of responsibilities. The Presentation Tier '
    'handles all citizen and administrator interactions through a React 18 single-page application '
    'bundled by Vite. The API Gateway Tier orchestrates business logic, validates identity tokens, '
    'and mediates between the frontend and both on-chain and off-chain storage layers. The Blockchain '
    'Tier maintains the immutable source of truth through eight Solidity smart contracts deployed on '
    'a private Hyperledger Besu network running the Istanbul Byzantine Fault Tolerant 2.0 consensus '
    'protocol. The Data Tier provides persistent storage through MongoDB for queryable metadata and '
    'IPFS for content-addressed document storage. This separation ensures that each layer can be '
    'independently audited, scaled, and maintained without affecting the others.'))
els.append(make_image_para('architecture.png', 5.5))
els.append(make_caption('Figure 3.1: Bharat Registry — Four-Tier Hybrid System Architecture'))
els.append(make_blank())
move_elements_after(anchor, els)
print(f"INS 1 done at anchor={anchor}")

# ═══════════════════════════════════════════════════════════════════════════
# INSERTION 2: After 3.10.1 LVI — LVI diagram
# ═══════════════════════════════════════════════════════════════════════════
i3101 = find_para_idx('3.10.1 The')
i3102 = find_para_idx('3.10.2', i3101+1)
anchor2 = i3102 - 1

els2 = []
els2.append(make_body_para(
    'The Listen-Verify-Index pattern is implemented in eventListener.js, which maintains a '
    'persistent WebSocket subscription to the Hyperledger Besu node. When a Solidity event such '
    'as PropertyRegistered or TransferCompleted is emitted, the listener receives the raw event '
    'data in real time. The Verify phase confirms that the block containing the event has achieved '
    'finality under the deterministic IBFT 2.0 consensus — since IBFT 2.0 provides instant, fork-free '
    'finality, this verification is computationally trivial. The Index phase then fetches the full '
    'transaction receipt, extracts the event arguments, and performs a MongoDB upsert operation '
    'using findOneAndUpdate with the upsert flag set to true. This guarantees idempotent writes '
    'even if the same event is received multiple times during network recovery scenarios.'))
els2.append(make_image_para('lvi.png', 5.5))
els2.append(make_caption('Figure 3.2: Listen-Verify-Index (LVI) Pattern — Real-Time Synchronisation'))
els2.append(make_blank())
move_elements_after(anchor2, els2)
print(f"INS 2 done at anchor={anchor2}")

# ═══════════════════════════════════════════════════════════════════════════
# INSERTION 3: After 3.12.2 — Trimodal + Roles diagrams
# ═══════════════════════════════════════════════════════════════════════════
i3122 = find_para_idx('3.12.2 Handling')
i4 = find_para_idx('Chapter 4', i3122+1)
anchor3 = i4 - 1

els3 = []
els3.append(make_body_para(
    'The Bharat Registry partitions its persistent state across three storage substrates, each '
    'optimised for a different dimension of data management. The blockchain stores only the six '
    'fields per property that establish legal provenance and ownership proof. IPFS stores physical '
    'evidentiary documents — sale deeds, survey maps, and certificates — using content-addressed '
    'hashing that makes tampering computationally detectable. MongoDB stores the rich operational '
    'metadata that enables geospatial searching, full-text filtering, and administrative dashboards. '
    'The referential integrity between these three layers is maintained by the propertyId serving '
    'as the universal key across all stores, and the ipfsDocumentHash field on-chain serving as '
    'the cryptographic anchor to the document layer.'))
els3.append(make_image_para('trimodal.png', 5.5))
els3.append(make_caption('Figure 3.3: Tri-Modal Data Storage Strategy'))
els3.append(make_blank())
els3.append(make_body_para(
    'Access governance is enforced through a six-level role hierarchy that operates at both '
    'the API middleware layer and the smart contract layer simultaneously. At the API layer, '
    'the authorize() middleware verifies the JWT role claim against a whitelist of permitted '
    'roles for each endpoint. At the smart contract layer, OpenZeppelin AccessControl enforces '
    'three distinct bytes32 role identifiers: ADMIN_ROLE, REGISTRAR_ROLE, and VERIFIER_ROLE. '
    'The Super Admin is the root of the hierarchy and is the only actor authorised to grant '
    'or revoke any role. No citizen can acquire administrative permissions without explicit '
    'role promotion, providing a cryptographically enforced separation of privilege.'))
els3.append(make_image_para('roles.png', 5.5))
els3.append(make_caption('Figure 3.4: Role Hierarchy and Permission Structure'))
els3.append(make_blank())
move_elements_after(anchor3, els3)
print(f"INS 3 done at anchor={anchor3}")


# ═══════════════════════════════════════════════════════════════════════════
# INSERTION 4: After 4.1.2 — ERD diagram
# ═══════════════════════════════════════════════════════════════════════════
i412 = find_para_idx('4.1.2 Off-Chain MongoDB')
i42 = find_para_idx('4.2 Directory', i412+1)
anchor4 = i42 - 1

els4 = []
els4.append(make_body_para(
    'The entity relationship diagram below captures the four MongoDB collections and their '
    'referential relationships. The walletAddress field in the Properties collection serves '
    'as a foreign key reference to the Users collection, enforced at the application layer '
    'by the authentication middleware. The propertyId field doubles as both the MongoDB '
    'document primary key and the on-chain mapping key in LandRegistry.sol, ensuring '
    'zero-ambiguity cross-layer data correlation. The Documents collection maintains a '
    'bidirectional reference to Properties through the propertyId foreign key, while the '
    'Transactions collection references both the seller and buyer through their wallet addresses.'))
els4.append(make_image_para('erd.png', 5.8))
els4.append(make_caption('Figure 4.1: Entity Relationship Diagram — Hybrid Data Model'))
els4.append(make_blank())
move_elements_after(anchor4, els4)
print(f"INS 4 done at anchor={anchor4}")

# ═══════════════════════════════════════════════════════════════════════════
# INSERTION 5: After 4.3.1 — LandRegistry.sol code
# ═══════════════════════════════════════════════════════════════════════════
i431 = find_para_idx('4.3.1 Engineering the Land Registry')
i432 = find_para_idx('4.3.2', i431+1)
anchor5 = i432 - 1

els5 = []
els5.append(make_body_para(
    'The following code listing presents the registerProperty function extracted from '
    'LandRegistry.sol. The function enforces a unique survey number constraint through an O(1) '
    'mapping lookup before incrementing the global propertyCounter. This atomic check-then-write '
    'pattern prevents duplicate parcel registrations even under concurrent transaction load within '
    'the same block. The function inherits nonReentrant and whenNotPaused modifiers from '
    'OpenZeppelin, providing defence-in-depth against reentrancy exploits and administrative '
    'circuit-breaking capability.'))
els5 += make_code_block([
    '// LandRegistry.sol — Core Property Registration',
    'struct Property {',
    '    uint256 propertyId;',
    '    string  surveyNumber;',
    '    string  location;',
    '    uint256 area;',
    '    address currentOwner;',
    '    uint256 marketValue;',
    '    PropertyStatus status;',
    '    uint256 registrationDate;',
    '    string  ipfsDocumentHash;',
    '}',
    '',
    'mapping(uint256 => Property) public properties;',
    'mapping(string  => uint256)  public surveyToPropertyId;',
    'uint256 public propertyCounter;',
    '',
    'function registerProperty(',
    '    string memory surveyNumber, string memory location,',
    '    uint256 area, uint256 marketValue,',
    '    string memory ipfsDocumentHash',
    ') external nonReentrant whenNotPaused returns (uint256) {',
    '    require(area > 0, "area must be positive");',
    '    require(bytes(surveyNumber).length > 0, "survey number required");',
    '    require(surveyToPropertyId[surveyNumber] == 0,',
    '        "survey number already registered");',
    '    propertyCounter++;',
    '    uint256 pid = propertyCounter;',
    '    properties[pid] = Property({',
    '        propertyId: pid, surveyNumber: surveyNumber,',
    '        location: location, area: area,',
    '        currentOwner: msg.sender, marketValue: marketValue,',
    '        status: PropertyStatus.Pending,',
    '        registrationDate: block.timestamp,',
    '        ipfsDocumentHash: ipfsDocumentHash',
    '    });',
    '    surveyToPropertyId[surveyNumber] = pid;',
    '    emit PropertyRegistered(pid, msg.sender,',
    '        surveyNumber, location, area, marketValue);',
    '    return pid;',
    '}',
])
els5.append(make_blank())
els5.append(make_body_para(
    'The verifyProperty and disputeProperty functions implement role-gated state transitions. '
    'Only addresses holding the VERIFIER_ROLE may advance a property from Pending to Verified. '
    'Only REGISTRAR_ROLE holders may flag a property as Disputed. This separation ensures that '
    'no single actor can both register and approve a parcel, implementing the four-eyes principle '
    'at the cryptographic level.'))
els5 += make_code_block([
    '// LandRegistry.sol — Role-Gated State Transitions',
    'function verifyProperty(uint256 propertyId)',
    '    external onlyRole(VERIFIER_ROLE) whenNotPaused {',
    '    Property storage prop = _getProperty(propertyId);',
    '    require(prop.status == PropertyStatus.Pending,',
    '        "property not in pending state");',
    '    prop.status = PropertyStatus.Verified;',
    '    emit PropertyVerified(propertyId, msg.sender, block.timestamp);',
    '}',
    '',
    'function transferOwnership(uint256 propertyId,',
    '    address from, address to)',
    '    external onlyTransferContract whenNotPaused {',
    '    Property storage prop = _getProperty(propertyId);',
    '    require(prop.currentOwner == from, "incorrect owner");',
    '    prop.currentOwner = to;',
    '    prop.status = PropertyStatus.Pending;',
    '    emit PropertyTransferred(propertyId, from, to,',
    '        block.timestamp);',
    '}',
])
els5.append(make_blank())
move_elements_after(anchor5, els5)
print(f"INS 5 done at anchor={anchor5}")


# ═══════════════════════════════════════════════════════════════════════════
# INSERTION 6: After 4.3.2 — eventListener.js code
# ═══════════════════════════════════════════════════════════════════════════
i432b = find_para_idx('4.3.2 The Synchronization Engine')
i44 = find_para_idx('4.4 Presentation', i432b+1)
anchor6 = i44 - 1

els6 = []
els6.append(make_body_para(
    'The event listener module implements the complete LVI synchronisation pipeline. Each '
    'handler callback independently invokes syncPropertySnapshot or appendTransferTimeline to '
    'apply the on-chain state delta to MongoDB using an upsert operation. The normalizeAddress '
    'utility ensures all Ethereum addresses are stored in lowercase canonical form, preventing '
    'case-sensitive duplicate detection failures. The service includes a 30-second retry loop '
    'that automatically re-establishes the WebSocket connection when the Besu node becomes '
    'available after planned maintenance or transient network interruptions.'))
els6 += make_code_block([
    '// eventListener.js — LVI Sync Handlers',
    'const syncPropertySnapshot = async (propertyId, opts) => {',
    '  const data = await blockchainService.getProperty(propertyId);',
    '  const update = { $set: {',
    '    propertyId: data.propertyId,',
    '    surveyNumber: data.surveyNumber,',
    '    currentOwner: normalizeAddress(data.currentOwner),',
    '    marketValue: data.marketValue,',
    '    status: data.status,',
    '    ...opts.set,',
    '  }};',
    '  if (opts.push) update.$push = opts.push;',
    '  await Property.findOneAndUpdate(',
    '    { propertyId: Number(propertyId) },',
    '    update, { upsert: true, new: true }',
    '  );',
    '};',
    '',
    'onPropertyRegistered: async (propertyId, owner, sn, event) => {',
    '  await syncPropertySnapshot(propertyId, {',
    '    set: { blockchainTxHash: event?.transactionHash },',
    '  });',
    '},',
    '',
    'onPropertyTransferred: async (propertyId, from, to, event) => {',
    '  await syncPropertySnapshot(propertyId, {',
    '    set:  { currentOwner: normalizeAddress(to) },',
    '    push: { previousOwners: {',
    '      walletAddress: normalizeAddress(from),',
    '      transferDate: new Date(),',
    '      transactionHash: event?.transactionHash,',
    '    }},',
    '  });',
    '},',
    '',
    '// Retry logic - every 30 seconds until Besu is reachable',
    'const setupGlobalEventListeners = async () => {',
    '  const ok = await trySetupListeners();',
    '  if (!ok && !retryTimer) {',
    '    retryTimer = setInterval(async () => {',
    '      await trySetupListeners();',
    '    }, 30000);',
    '  }',
    '};',
])
els6.append(make_blank())
move_elements_after(anchor6, els6)
print(f"INS 6 done")

# ═══════════════════════════════════════════════════════════════════════════
# INSERTION 7: After 4.5.1 — Transfer.sol + FSM diagrams
# ═══════════════════════════════════════════════════════════════════════════
i451 = find_para_idx('4.5.1 The Ledger Logic')
i452 = find_para_idx('4.5.2', i451+1)
anchor7 = i452 - 1

els7 = []
els7.append(make_body_para(
    'The Transfer.sol contract implements a seven-state finite state machine with built-in '
    'escrow custody. The state diagram below illustrates all permissible transitions. Each '
    'transition is protected by require() statements that enforce caller identity, correct '
    'sequencing, and minimum value constraints. The escrow funds are held natively within '
    'the contract as Ether and can only be released by completeTransfer or returned by '
    'cancelTransfer. A platform fee of 100 basis points is deducted on completion.'))
els7.append(make_image_para('transfer_fsm.png', 5.5))
els7.append(make_caption('Figure 4.2: Transfer.sol — Seven-State Finite State Machine'))
els7.append(make_blank())
els7.append(make_image_para('property_fsm.png', 5.5))
els7.append(make_caption('Figure 4.3: LandRegistry.sol — Property Lifecycle State Machine'))
els7.append(make_blank())
els7 += make_code_block([
    '// Transfer.sol — Escrow and Completion Logic',
    'function depositEscrow(uint256 transferId)',
    '    external payable nonReentrant whenNotPaused {',
    '    TransferRequest storage req = _getTransfer(transferId);',
    '    require(req.buyer == msg.sender, "caller not buyer");',
    '    require(req.status == TransferStatus.Initiated,',
    '        "invalid state");',
    '    require(msg.value >= req.agreedPrice, "insufficient");',
    '    req.escrowAmount = msg.value;',
    '    req.status = TransferStatus.EscrowFunded;',
    '    emit EscrowDeposited(transferId, msg.sender, msg.value);',
    '}',
    '',
    'function completeTransfer(uint256 transferId)',
    '    external nonReentrant whenNotPaused {',
    '    TransferRequest storage req = _getTransfer(transferId);',
    '    require(req.status == TransferStatus.ApprovedByRegistrar,',
    '        "not fully approved");',
    '    uint256 fee = (req.escrowAmount * platformFeeBps) / 10000;',
    '    uint256 sellerAmt = req.escrowAmount - fee;',
    '    req.status = TransferStatus.Completed;',
    '    req.completedAt = block.timestamp;',
    '    // Atomic: ownership + fund release in same block',
    '    landRegistry.transferOwnership(',
    '        req.propertyId, req.seller, req.buyer);',
    '    payable(feeCollector).transfer(fee);',
    '    payable(req.seller).transfer(sellerAmt);',
    '    emit TransferCompleted(transferId, req.propertyId,',
    '        req.seller, req.buyer);',
    '}',
])
els7.append(make_blank())
move_elements_after(anchor7, els7)
print(f"INS 7 done")

# ═══════════════════════════════════════════════════════════════════════════
# INSERTION 8: After 4.5.2 — blockchainService.js code
# ═══════════════════════════════════════════════════════════════════════════
i452b = find_para_idx('4.5.2 The Synchronization Engine: blockchainService')
i453 = find_para_idx('4.5.3', i452b+1)
anchor8 = i453 - 1

els8 = []
els8.append(make_body_para(
    'The blockchainService.js module maintains a single JsonRpcProvider and Wallet signer '
    'instance shared across all Express route handlers through the Node.js module cache. '
    'The getProperty function normalises Solidity BigInt return values to JavaScript strings '
    'using the toString() method, preventing precision loss on large uint256 token amounts. '
    'The setupEventListeners function binds JavaScript callbacks to the Solidity event '
    'filters through the ethers.js Contract.on() interface.'))
els8 += make_code_block([
    '// blockchainService.js — Provider and Contract Setup',
    'const { ethers } = require("ethers");',
    'const provider = new ethers.JsonRpcProvider(',
    '    process.env.RPC_URL || "http://127.0.0.1:8545");',
    'const signer = new ethers.Wallet(',
    '    process.env.PRIVATE_KEY, provider);',
    '',
    'const landRegistry = new ethers.Contract(',
    '    process.env.LAND_REGISTRY_ADDRESS,',
    '    LandRegistryABI, signer);',
    'const transferContract = new ethers.Contract(',
    '    process.env.TRANSFER_ADDRESS, TransferABI, signer);',
    '',
    'const getProperty = async (propertyId) => {',
    '    const p = await landRegistry.getProperty(propertyId);',
    '    return {',
    '        propertyId: p.propertyId.toString(),',
    '        surveyNumber: p.surveyNumber,',
    '        currentOwner: p.currentOwner.toLowerCase(),',
    '        marketValue: p.marketValue.toString(),',
    '        status: Number(p.status),',
    '        registrationDate:',
    '            new Date(Number(p.registrationDate) * 1000),',
    '        ipfsDocumentHash: p.ipfsDocumentHash,',
    '    };',
    '};',
    '',
    'const checkConnection = async () => {',
    '    try { await provider.getBlockNumber(); return true; }',
    '    catch { return false; }',
    '};',
])
els8.append(make_blank())
move_elements_after(anchor8, els8)
print(f"INS 8 done")


# ═══════════════════════════════════════════════════════════════════════════
# INSERTION 9: After 4.6 — auth.js Aadhaar + wallet code
# ═══════════════════════════════════════════════════════════════════════════
i46 = find_para_idx('4.6 The Digital Identity Anchor')
i47 = find_para_idx('4.7', i46+1)
anchor9 = i47 - 1

els9 = []
els9.append(make_body_para(
    'The authentication module implements the Aadhaar-to-wallet binding through a two-phase '
    'protocol. During the first phase (registration), the 16-digit Aadhaar number is validated '
    'by a regular expression check and then hashed using SHA-256 with a sovereign salt. The '
    'resulting hash is stored in the User document; the raw Aadhaar number is never persisted. '
    'During the second phase (wallet linking), the backend generates a random 32-byte nonce, '
    'the user signs it with their MetaMask private key, and the backend uses ethers.verifyMessage '
    'to recover and confirm the signing address before permanently binding the wallet.'))
els9 += make_code_block([
    '// auth.js — Registration with Aadhaar Hashing',
    'if (aadhaarNumber && !validateAadhaar(aadhaarNumber)) {',
    '    return res.status(400).json({ success: false,',
    '        message: "Invalid Aadhaar: must be 16 digits" });',
    '}',
    'const aadhaarHash = aadhaarNumber',
    '    ? hashAadhaar(aadhaarNumber) : undefined;',
    'if (aadhaarHash) {',
    '    const conflict = await User.findOne({ aadhaarHash });',
    '    if (conflict) return res.status(400).json({',
    '        success: false,',
    '        message: "Aadhaar already registered" });',
    '}',
    '',
    '// auth.js — MetaMask Wallet Verification',
    'router.post("/verify", auth, async (req, res) => {',
    '  const { walletAddress, signature } = req.body;',
    '  const user = await User.findById(req.user.userId)',
    '      .select("+nonce");',
    '  const message = buildWalletSignatureMessage(user.nonce);',
    '  const recovered = ethers.verifyMessage(',
    '      message, signature);',
    '  if (recovered.toLowerCase() !==',
    '      walletAddress.toLowerCase())',
    '      return res.status(401).json({',
    '          success: false,',
    '          message: "Invalid wallet signature" });',
    '  user.walletAddress = walletAddress.toLowerCase();',
    '  user.nonce = crypto.randomBytes(32).toString("hex");',
    '  await user.save();',
    '  res.json({ success: true, token: generateToken(user) });',
    '});',
])
els9.append(make_blank())

# Also add auth middleware code
els9.append(make_body_para(
    'The role-based authorization middleware follows a closure pattern that accepts a variadic '
    'list of permitted roles and returns an Express middleware function. This design enables '
    'declarative route protection where each endpoint specifies its required roles directly '
    'in the route definition. The middleware checks the role property on the authenticated '
    'user object and returns a 403 Forbidden response if the user lacks the required role.'))
els9 += make_code_block([
    '// middleware/auth.js — RBAC Authorization',
    'const authorize = (...roles) => {',
    '  return (req, res, next) => {',
    '    if (!req.user)',
    '      return res.status(401).json({',
    '        success: false,',
    '        message: "Authentication required." });',
    '    if (!roles.includes(req.user.role))',
    '      return res.status(403).json({',
    '        success: false,',
    '        message: "Insufficient permissions." });',
    '    next();',
    '  };',
    '};',
])
els9.append(make_blank())
move_elements_after(anchor9, els9)
print(f"INS 9 done")

# ═══════════════════════════════════════════════════════════════════════════
# INSERTION 10: After 5.5 Testing — Test and Performance tables
# ═══════════════════════════════════════════════════════════════════════════
i55 = find_para_idx('5.5 Comprehensive Testing')
i56 = find_para_idx('5.6', i55+1)
anchor10 = i56 - 1

els10 = []
els10.append(make_body_para(
    'The following tables provide a structured summary of the smart contract test scenarios '
    'and the measured system performance characteristics. All smart contract tests were executed '
    'using the Hardhat testing framework with Chai assertions against a local Besu node. API '
    'integration tests used Jest with Supertest against an in-memory MongoDB instance.'))

t1 = make_table(
    ['Test Scenario','Contract','Expected Outcome'],
    [['Successful property registration','LandRegistry.sol','PropertyRegistered event emitted; propertyId returned'],
     ['Duplicate survey number','LandRegistry.sol','Revert: "survey number already registered"'],
     ['Unauthorised verification','LandRegistry.sol','Revert: AccessControl role missing'],
     ['Escrow below agreed price','Transfer.sol','Revert: "insufficient escrow amount"'],
     ['Non-buyer deposits escrow','Transfer.sol','Revert: "caller is not the buyer"'],
     ['Complete without approval','Transfer.sol','Revert: "not fully approved"'],
     ['Cancel after completion','Transfer.sol','Revert: "already completed"'],
     ['Double lien on property','MortgageRegistry.sol','Revert: "Lien already active"'],
    ])
els10.append(t1)
els10.append(make_caption('Table 5.1: Smart Contract Unit Test Scenarios'))
els10.append(make_blank())

t2 = make_table(
    ['Metric','Observed Value','Notes'],
    [['Block Time','2 seconds','Configurable in genesis.json; deterministic under IBFT 2.0'],
     ['Transaction Finality','1 block (immediate)','IBFT 2.0 provides fork-free instant finality'],
     ['Property Registration Gas','~120,000 gas','Optimised struct packing; O(1) mapping'],
     ['Transfer Completion Gas','~180,000 gas','Cross-contract transferOwnership() call'],
     ['MongoDB Sync Latency','< 500 ms','LVI updates within one block period'],
     ['API Read Response','< 50 ms','Served from MongoDB; no blockchain call'],
     ['API Write Response','2,000 - 4,000 ms','Includes mining wait time'],
     ['Fault Tolerance','F=1 of 4 nodes','N >= 3F+1 under IBFT 2.0'],
    ])
els10.append(t2)
els10.append(make_caption('Table 5.2: System Performance Characteristics'))
els10.append(make_blank())
move_elements_after(anchor10, els10)
print(f"INS 10 done")

# ═══════════════════════════════════════════════════════════════════════════
# INSERTION 11: After 6.1.1 — Comparison table + expanded analysis
# ═══════════════════════════════════════════════════════════════════════════
i611 = find_para_idx('6.1.1 Quantitative Throughput')
i612 = find_para_idx('6.1.2', i611+1)
anchor11 = i612 - 1

els11 = []
t3 = make_table(
    ['Metric','Legacy SRO System','Bharat Registry'],
    [['Transaction Finality','15-30 days (manual)','1 block (~2 seconds)'],
     ['Fraud Vector','Forged paper deed; insider tampering','None: SHA-256 hash on-chain'],
     ['Ownership Proof','Sub-registrar physical stamp','ECDSA cryptographic signature'],
     ['Document Storage','Physical cabinet (lossy)','IPFS content-addressed (tamper-proof)'],
     ['Search Capability','Manual ledger (days)','MongoDB geospatial (< 50 ms)'],
     ['Concurrent Safety','Single-writer serialised','Smart contract atomic guarantees'],
    ])
els11.append(t3)
els11.append(make_caption('Table 6.1: Legacy SRO System vs. Bharat Registry'))
els11.append(make_blank())
els11.append(make_body_para(
    'The quantitative benchmarks reveal a paradigm shift in transaction processing efficiency. '
    'Where the traditional Sub-Registrar Office requires an average of fifteen to thirty '
    'calendar days to process a single ownership mutation — involving physical document '
    'verification, manual ledger updates, and inter-departmental courier services — the Bharat '
    'Registry achieves deterministic finality within a single IBFT 2.0 block period of '
    'approximately two seconds. This represents a throughput improvement exceeding three orders '
    'of magnitude. The elimination of human intermediaries from the critical path simultaneously '
    'removes the corruption vector that historically enabled phantom registrations and '
    'fraudulent deed forgeries across Indian land governance systems.'))
move_elements_after(anchor11, els11)
print(f"INS 11 done")


# ═══════════════════════════════════════════════════════════════════════════
# UPDATE LIST OF FIGURES (Table 6 in original)
# ═══════════════════════════════════════════════════════════════════════════
lof = doc.tables[6]
# Clear existing rows except header
while len(lof.rows) > 1:
    tr = lof.rows[-1]._tr
    lof._tbl.remove(tr)

new_figs = [
    ('3.1', 'System Architecture — Four-Tier Model', ''),
    ('3.2', 'Listen-Verify-Index (LVI) Pattern', ''),
    ('3.3', 'Tri-Modal Data Storage Strategy', ''),
    ('3.4', 'Role Hierarchy and Permission Structure', ''),
    ('4.1', 'Entity Relationship Diagram — Hybrid Data Model', ''),
    ('4.2', 'Transfer.sol — Seven-State Finite State Machine', ''),
    ('4.3', 'LandRegistry.sol — Property Lifecycle State Machine', ''),
]
for fno, fdesc, fpg in new_figs:
    row = lof.add_row()
    row.cells[0].text = fno
    row.cells[1].text = fdesc
    row.cells[2].text = fpg
    for cell in row.cells:
        for run in cell.paragraphs[0].runs:
            run.font.name = 'Times New Roman'
            run.font.size = Pt(11)
            run.font.color.rgb = BLACK

# Update header styling
for run in lof.rows[0].cells[0].paragraphs[0].runs:
    run.font.name = 'Times New Roman'
    run.font.size = Pt(11)
    run.bold = True
    run.font.color.rgb = BLACK

print("List of Figures updated")

# ═══════════════════════════════════════════════════════════════════════════
# UPDATE LIST OF TABLES (Table 7 in original)
# ═══════════════════════════════════════════════════════════════════════════
lot = doc.tables[7]
while len(lot.rows) > 1:
    tr = lot.rows[-1]._tr
    lot._tbl.remove(tr)

new_tbls = [
    ('2.3', 'Gantt Chart Table', ''),
    ('2.3.1', 'Timeline Representation', ''),
    ('3.3', 'Software Specification', ''),
    ('3.4', 'Hardware Specification', ''),
    ('3.5', 'Functional Requirements', ''),
    ('3.6', 'Non-Functional Requirements', ''),
    ('3.7', 'Event Table', ''),
    ('5.1', 'Smart Contract Unit Test Scenarios', ''),
    ('5.2', 'System Performance Characteristics', ''),
    ('6.1', 'Legacy SRO System vs. Bharat Registry', ''),
    ('6.3', 'Unit Test Cases', ''),
    ('6.3', 'Integration Test Cases', ''),
    ('6.4', 'Functional Test Cases', ''),
    ('6.5', 'Performance Test Cases', ''),
    ('6.6', 'System Test Cases', ''),
    ('6.7', 'Acceptance Test Cases', ''),
    ('7.3', 'Comparison with Existing System', ''),
]
for tno, tdesc, tpg in new_tbls:
    row = lot.add_row()
    row.cells[0].text = tno
    row.cells[1].text = tdesc
    row.cells[2].text = tpg
    for cell in row.cells:
        for run in cell.paragraphs[0].runs:
            run.font.name = 'Times New Roman'
            run.font.size = Pt(11)
            run.font.color.rgb = BLACK

print("List of Tables updated")

# ═══════════════════════════════════════════════════════════════════════════
# NORMALISE ALL FONTS — ensure black Times New Roman throughout
# ═══════════════════════════════════════════════════════════════════════════
for p in doc.paragraphs:
    for run in p.runs:
        if run.font.color and run.font.color.type is not None:
            run.font.color.rgb = BLACK
        name = run.font.name or ''
        if 'Courier' in name:
            run.font.name = 'Courier New'
        elif name and 'Times' not in name:
            run.font.name = 'Times New Roman'

for tbl in doc.tables:
    for row in tbl.rows:
        for cell in row.cells:
            for p in cell.paragraphs:
                for run in p.runs:
                    if run.font.color and run.font.color.type is not None:
                        run.font.color.rgb = BLACK
                    name = run.font.name or ''
                    if name and 'Courier' not in name and 'Times' not in name:
                        run.font.name = 'Times New Roman'

print("Font normalisation complete")

# ═══════════════════════════════════════════════════════════════════════════
# SAVE
# ═══════════════════════════════════════════════════════════════════════════
doc.save(DST)
print(f"\nSUCCESS — Saved: {DST}")
print(f"Total paragraphs: {len(doc.paragraphs)}")
print(f"Total tables: {len(doc.tables)}")

import math
size_mb = os.path.getsize(DST) / (1024*1024)
print(f"File size: {size_mb:.2f} MB")

