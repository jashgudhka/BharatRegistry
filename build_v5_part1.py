"""Part 1: Helpers and diagram generation for v5 document."""
import os, sys
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUT = r'c:\Projects\MSc\BharatRegistry\docs\images\v5'
os.makedirs(OUT, exist_ok=True)

def sbox(ax, cx, cy, w, h, text, fill='#eef2ff'):
    ax.add_patch(patches.FancyBboxPatch((cx-w/2, cy-h/2), w, h,
        boxstyle='round,pad=0.06', lw=1.8, edgecolor='black', facecolor=fill))
    lines = text.split('\n')
    for i, ln in enumerate(lines):
        off = 0.15*(len(lines)-1)/2 - 0.15*i
        ax.text(cx, cy+off, ln, ha='center', va='center',
                fontsize=12, fontweight='bold', fontfamily='serif', color='black')

def arr(ax, x1, y1, x2, y2, lbl=''):
    ax.annotate('', xy=(x2,y2), xytext=(x1,y1),
                arrowprops=dict(arrowstyle='-|>', color='black', lw=1.8))
    if lbl:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx, my+0.22, lbl, ha='center', va='bottom',
                fontsize=10, fontfamily='serif', style='italic', color='black')

# ── 1. Architecture ──
fig, ax = plt.subplots(figsize=(14, 10), facecolor='white')
ax.set_facecolor('white'); ax.axis('off'); ax.set_xlim(0,14); ax.set_ylim(0,10)

tiers = [
    (7, 8.5, 12.8, 1.3, 'Tier 1: Presentation Layer',
     'React 18 + Vite  |  MetaMask Wallet  |  Tailwind CSS  |  Role-Aware JWT Context', '#dbeafe'),
    (7, 6.7, 12.8, 1.3, 'Tier 2: API Gateway (Node.js / Express)',
     '8 Route Groups  |  JWT + RBAC Middleware  |  Swagger at /api-docs  |  Helmet + CORS', '#dcfce7'),
    (7, 4.9, 12.8, 1.3, 'Tier 3: Blockchain (Hyperledger Besu, IBFT 2.0)',
     '8 Solidity Contracts  |  blockchainService.js  |  eventListener.js  |  Gas-Free Network', '#ede9fe'),
    (7, 3.1, 12.8, 1.3, 'Tier 4: Data Layer',
     'MongoDB (Users/Properties/Transactions/Documents)  |  IPFS  |  Mongoose ODM', '#fff7ed'),
]
for cx,cy,w,h,title,sub,fill in tiers:
    ax.add_patch(patches.Rectangle((cx-w/2, cy-h/2), w, h, lw=2, edgecolor='black', facecolor=fill))
    ax.text(cx, cy+0.22, title, ha='center', va='center', fontsize=13, fontweight='bold', fontfamily='serif', color='black')
    ax.text(cx, cy-0.22, sub, ha='center', va='center', fontsize=10, fontfamily='serif', color='#333')

for y in [7.85, 6.05, 4.25]:
    ax.annotate('', xy=(7,y-0.05), xytext=(7,y+0.05), arrowprops=dict(arrowstyle='<->', color='black', lw=1.5))

ax.set_title('Bharat Registry — Four-Tier Hybrid System Architecture', fontsize=15, fontweight='bold', fontfamily='serif', pad=12, color='black')
plt.tight_layout(pad=0.5)
plt.savefig(os.path.join(OUT,'architecture.png'), dpi=200, bbox_inches='tight', facecolor='white')
plt.close()
print('1/7 architecture')

# ── 2. ERD ──
fig, ax = plt.subplots(figsize=(16, 12), facecolor='white')
ax.set_facecolor('white'); ax.axis('off'); ax.set_xlim(0,16); ax.set_ylim(0,12)

def erd_entity(ax, x, y, w, title, fields):
    rh = 0.40
    th = rh * (len(fields) + 1)
    ax.add_patch(patches.Rectangle((x, y), w, th, lw=1.8, edgecolor='black', facecolor='white'))
    ax.add_patch(patches.Rectangle((x, y+th-rh), w, rh, lw=0, facecolor='#c0c8e0'))
    ax.text(x+w/2, y+th-rh/2, title, ha='center', va='center', fontsize=12, fontweight='bold', fontfamily='serif', color='black')
    for i, (pk, name, typ) in enumerate(fields):
        ry = y + th - rh*(i+2)
        fc = '#f4f6fc' if i%2==0 else 'white'
        ax.add_patch(patches.Rectangle((x, ry), w, rh, lw=0.5, edgecolor='#999', facecolor=fc))
        label = f'  {pk:3s} {name} : {typ}'
        ax.text(x+0.1, ry+rh/2, label, ha='left', va='center', fontsize=9.5, fontfamily='monospace', color='black')

erd_entity(ax, 0.3, 6.0, 4.5, 'USERS', [
    ('PK','walletAddress','String'),('','email','String'),('','password','String (bcrypt)'),
    ('','fullName','String'),('','aadhaarHash','String (SHA-256)'),('','panNumber','String'),
    ('','role','Enum [6 roles]'),('','isVerified','Boolean'),('','kycDocuments','Array'),
    ('','linkedWallets','Array'),('','nonce','String (rotated)'),
])
erd_entity(ax, 5.8, 4.8, 5.0, 'PROPERTIES', [
    ('PK','propertyId','Number (unique)'),('UK','surveyNumber','String (unique)'),
    ('','address','String'),('','city / state / pincode','String'),
    ('','coordinates','GeoJSON {lat, lng}'),('','area','Number (sqm)'),
    ('','propertyType','Enum [5 types]'),('FK','currentOwner','walletAddress'),
    ('','marketValue','String (wei)'),('','status','Enum [4 states]'),
    ('','documents','Array'),('','previousOwners','Array'),
    ('','blockchainTxHash','String'),('','metadata','Object'),
])
erd_entity(ax, 11.5, 5.2, 4.3, 'TRANSACTIONS', [
    ('PK','transferId','Number (unique)'),('FK','propertyId','Number'),
    ('FK','seller','walletAddress'),('FK','buyer','walletAddress'),
    ('','agreedPrice','String (wei)'),('','escrowAmount','String (wei)'),
    ('','status','Enum [7 states]'),('','timeline','Array'),
    ('','initiationTxHash','String'),('','completionTxHash','String'),
    ('','disputeReason','String'),
])
erd_entity(ax, 5.8, 0.3, 5.0, 'DOCUMENTS', [
    ('PK','hash','String (unique)'),('','originalName','String'),
    ('','documentType','Enum [11 types]'),('','status','Enum [3 states]'),
    ('FK','uploadedBy','walletAddress'),('FK','propertyId','Number'),
    ('','ipfsHash','String'),('','onChainTxHash','String'),
    ('','verifiedBy','String'),
])

arr(ax, 4.8, 9.5, 5.8, 9.5, '1  owns  1..*')
arr(ax, 10.8, 8.5, 11.5, 8.5, '1..*  transfers')
arr(ax, 8.3, 4.8, 8.3, 4.2, '1  has  0..*')

ax.set_title('Entity Relationship Diagram — Bharat Registry Hybrid Data Model', fontsize=15, fontweight='bold', fontfamily='serif', pad=12, color='black')
plt.tight_layout(pad=0.5)
plt.savefig(os.path.join(OUT,'erd.png'), dpi=200, bbox_inches='tight', facecolor='white')
plt.close()
print('2/7 erd')

# ── 3. Transfer FSM ──
fig, ax = plt.subplots(figsize=(14, 12), facecolor='white')
ax.set_facecolor('white'); ax.axis('off'); ax.set_xlim(0,14); ax.set_ylim(0,12)

sbox(ax, 7,10.5, 5,0.85,'INITIATED','#dbeafe')
sbox(ax, 7, 8.7, 5,0.85,'ESCROW FUNDED','#dcfce7')
sbox(ax, 7, 6.9, 5,0.85,'APPROVED BY SELLER','#fff8e1')
sbox(ax, 7, 5.1, 5,0.85,'APPROVED BY REGISTRAR','#fce4ec')
sbox(ax, 7, 3.3, 5,0.85,'COMPLETED','#dcfce7')
sbox(ax, 2, 6.9, 3.8,0.85,'CANCELLED','#ffebee')
sbox(ax,12, 6.9, 3.8,0.85,'DISPUTED','#fff3e0')

arr(ax, 7,10.07, 7,9.13, 'initiateTransfer(propertyId, buyer, price)')
arr(ax, 7,8.27,  7,7.33, 'depositEscrow(msg.value >= agreedPrice)')
arr(ax, 7,6.47,  7,5.53, 'approveTransferAsSeller()')
arr(ax, 7,4.67,  7,3.73, 'approveTransferAsRegistrar()')
arr(ax, 4.5,6.9, 3.9,6.9, 'cancelTransfer()')
arr(ax, 9.5,6.9,10.1,6.9, 'disputeTransfer()')

ax.text(7, 2.3,
    'completeTransfer(): 1% fee → feeCollector | remainder → seller | LandRegistry.transferOwnership() called atomically',
    ha='center', va='center', fontsize=10, fontfamily='serif', style='italic', color='black')
ax.set_title('Transfer.sol — Seven-State Finite State Machine', fontsize=15, fontweight='bold', fontfamily='serif', pad=12, color='black')
plt.tight_layout(pad=0.5)
plt.savefig(os.path.join(OUT,'transfer_fsm.png'), dpi=200, bbox_inches='tight', facecolor='white')
plt.close()
print('3/7 transfer_fsm')

# ── 4. Property FSM ──
fig, ax = plt.subplots(figsize=(14, 9), facecolor='white')
ax.set_facecolor('white'); ax.axis('off'); ax.set_xlim(0,14); ax.set_ylim(0,9)

sbox(ax, 2.5,4.5, 4,0.9,'PENDING','#dbeafe')
sbox(ax, 7,  7,   4,0.9,'VERIFIED','#dcfce7')
sbox(ax, 7,  2,   4,0.9,'DISPUTED','#ffebee')
sbox(ax,11.5,4.5, 4,0.9,'TRANSFERRED','#ede9fe')

arr(ax, 4.5,4.85, 5.2,6.6, 'verifyProperty() [VERIFIER_ROLE]')
arr(ax, 4.5,4.15, 5.2,2.4, 'disputeProperty(reason) [REGISTRAR_ROLE]')
arr(ax, 9.0,7.0, 9.8,5.0,  'transferOwnership() [via Transfer.sol]')
arr(ax, 5.2,2.3, 4.5,4.1,  're-verify [VERIFIER_ROLE]')

ax.set_title('LandRegistry.sol — Property Lifecycle State Machine', fontsize=15, fontweight='bold', fontfamily='serif', pad=12, color='black')
plt.tight_layout(pad=0.5)
plt.savefig(os.path.join(OUT,'property_fsm.png'), dpi=200, bbox_inches='tight', facecolor='white')
plt.close()
print('4/7 property_fsm')

# ── 5. LVI Pattern ──
fig, ax = plt.subplots(figsize=(14, 9), facecolor='white')
ax.set_facecolor('white'); ax.axis('off'); ax.set_xlim(0,14); ax.set_ylim(0,9)

def bx(ax,cx,cy,w,h,text,fill='#f0f4ff'):
    ax.add_patch(patches.Rectangle((cx-w/2,cy-h/2),w,h,lw=1.8,edgecolor='black',facecolor=fill))
    lines = text.split('\n')
    for i,ln in enumerate(lines):
        off = 0.14*(len(lines)-1)/2 - 0.14*i
        ax.text(cx,cy+off,ln,ha='center',va='center',fontsize=11,fontweight='bold',fontfamily='serif',color='black')

bx(ax,2.5,7, 4,1,'Hyperledger Besu\n(IBFT 2.0)')
bx(ax,7,  7, 4,1,'eventListener.js\n(WebSocket)')
bx(ax,11.5,7,3.5,0.85,'1. LISTEN\nEvent Received','#dcfce7')
bx(ax,11.5,5.3,3.5,0.85,'2. VERIFY\nBlock Finality','#fff8e1')
bx(ax,11.5,3.6,3.5,0.85,'3. INDEX\nMongoDB Upsert','#dbeafe')
bx(ax,7,  2, 4,0.85,'Read Layer\nSynchronised','#dcfce7')

arr(ax, 4.5,7, 5.0,7, 'Emit Events')
arr(ax, 9.0,7, 9.75,7, 'Subscribe')
arr(ax, 11.5,6.57, 11.5,5.73)
arr(ax, 11.5,4.87, 11.5,4.03)
arr(ax, 9.75,2.0, 9.0,2.0, 'Confirm Sync')

ax.set_title('Listen-Verify-Index (LVI) Pattern — Blockchain to MongoDB Synchronisation', fontsize=14, fontweight='bold', fontfamily='serif', pad=12, color='black')
plt.tight_layout(pad=0.5)
plt.savefig(os.path.join(OUT,'lvi.png'), dpi=200, bbox_inches='tight', facecolor='white')
plt.close()
print('5/7 lvi')

# ── 6. Trimodal ──
fig, ax = plt.subplots(figsize=(14, 9), facecolor='white')
ax.set_facecolor('white'); ax.axis('off'); ax.set_xlim(0,14); ax.set_ylim(0,9)

cols = [
    (2.5, 'ON-CHAIN\n(Hyperledger Besu)', '#dbeafe',
     ['propertyId  (uint256)', 'surveyNumber  (string)', 'currentOwner  (address)',
      'marketValue  (uint256)', 'status  (enum)', 'ipfsDocumentHash  (string)']),
    (7.0, 'IPFS CLUSTER', '#dcfce7',
     ['Sale deed  (PDF)', 'Survey maps  (GeoTIFF)', 'Certificate scans',
      'Property photos', 'Verifier affidavits']),
    (11.5, 'MONGODB\n(Off-Chain Index)', '#fff7ed',
     ['location  (GeoJSON)', 'area, propertyType', 'documents[]  (Array)',
      'previousOwners[]', 'builtUpArea, amenities', 'lastSyncedBlock  (Number)']),
]
for cx, title, fill, items in cols:
    nrows = len(items)
    H = 0.45*(nrows+1)
    top_y = 2.5 + H
    ax.add_patch(patches.Rectangle((cx-2.2, 2.5), 4.4, H, lw=2, edgecolor='black', facecolor=fill))
    ax.add_patch(patches.Rectangle((cx-2.2, top_y-0.50), 4.4, 0.50, lw=0, facecolor='#bbb'))
    for j, t in enumerate(title.split('\n')):
        off = 0.13*(len(title.split('\n'))-1)/2 - 0.13*j
        ax.text(cx, top_y-0.25+off, t, ha='center', va='center', fontsize=12, fontweight='bold', fontfamily='serif', color='black')
    for i, item in enumerate(items):
        ax.text(cx-2.0, top_y-0.65-i*0.45, item, ha='left', va='center', fontsize=10, fontfamily='monospace', color='black')

arr(ax, 4.7,5.5, 4.3,5.5)
ax.text(4.5, 5.8, 'CID Anchor', ha='center', fontsize=10, fontfamily='serif', style='italic')
arr(ax, 9.3,5.5, 8.8,5.5)
ax.text(9.05, 5.8, 'LVI Sync', ha='center', fontsize=10, fontfamily='serif', style='italic')

ax.text(2.5, 1.8, 'Immutable • Source of Truth', ha='center', fontsize=10, fontfamily='serif', style='italic')
ax.text(7.0, 1.8, 'Content-Addressed • Tamper-Proof', ha='center', fontsize=10, fontfamily='serif', style='italic')
ax.text(11.5, 1.8, 'Query-Optimised • Geospatial', ha='center', fontsize=10, fontfamily='serif', style='italic')

ax.set_title('Tri-Modal Data Storage Strategy — Blockchain, IPFS, and MongoDB', fontsize=14, fontweight='bold', fontfamily='serif', pad=12, color='black')
plt.tight_layout(pad=0.5)
plt.savefig(os.path.join(OUT,'trimodal.png'), dpi=200, bbox_inches='tight', facecolor='white')
plt.close()
print('6/7 trimodal')

# ── 7. Role Hierarchy ──
fig, ax = plt.subplots(figsize=(14, 10), facecolor='white')
ax.set_facecolor('white'); ax.axis('off'); ax.set_xlim(0,14); ax.set_ylim(0,10)

def role(ax, cx, cy, w, h, name, caps):
    ax.add_patch(patches.Rectangle((cx-w/2, cy-h/2), w, h, lw=1.8, edgecolor='black', facecolor='#f5f5f5'))
    ax.add_patch(patches.Rectangle((cx-w/2, cy+h/2-0.45), w, 0.45, lw=0, facecolor='#ccc'))
    ax.text(cx, cy+h/2-0.22, name, ha='center', va='center', fontsize=12, fontweight='bold', fontfamily='serif', color='black')
    for i, c in enumerate(caps):
        ax.text(cx, cy+h/2-0.60-i*0.35, '• '+c, ha='center', va='top', fontsize=9.5, fontfamily='serif', color='black')

role(ax, 7,8.8, 5,1.5, 'SUPER ADMIN', ['Full system access','Assign/revoke all roles','Network governance'])
role(ax, 3.2,6.2, 4.5,1.6, 'ADMIN', ['KYC approval','Verify/dispute properties','Document management','All admin routes'])
role(ax, 10.8,6.2, 4.5,1.6, 'REGISTRAR', ['Approve transfers on-chain','disputeProperty()','REGISTRAR_ROLE holder','Admin routes access'])
role(ax, 1.8,3.2, 3.8,1.4, 'VERIFIER', ['Verify properties','verifyProperty()','VERIFIER_ROLE holder'])
role(ax, 5.8,3.2, 3.8,1.4, 'BANK', ['Encumbrance checks','Due-diligence reports','Loan verification'])
role(ax, 7,0.8, 6,1.2, 'CITIZEN (USER)', ['Register property  |  Initiate transfers  |  Upload documents  |  Link wallet'])

edges = [(7,8.05,3.2,7.0),(7,8.05,10.8,7.0),(3.2,5.4,1.8,3.9),(3.2,5.4,5.8,3.9),(10.8,5.4,7,1.4)]
for x1,y1,x2,y2 in edges:
    ax.annotate('', xy=(x2,y2), xytext=(x1,y1), arrowprops=dict(arrowstyle='-|>', color='black', lw=1.8))

ax.set_title('Role Hierarchy and Permission Structure — Bharat Registry', fontsize=14, fontweight='bold', fontfamily='serif', pad=12, color='black')
plt.tight_layout(pad=0.5)
plt.savefig(os.path.join(OUT,'roles.png'), dpi=200, bbox_inches='tight', facecolor='white')
plt.close()
print('7/7 roles')

print('\nAll 7 diagrams saved to', OUT)
print('Files:', sorted(os.listdir(OUT)))
