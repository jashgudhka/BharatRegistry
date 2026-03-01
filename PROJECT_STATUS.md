# 🚀 Bharat Registry - Project Status

## ✅ All Services Running Successfully!

### Running Services

| Service                | Port | Status     | URL                   |
| ---------------------- | ---- | ---------- | --------------------- |
| **Hardhat Blockchain** | 8545 | ✅ Running | http://127.0.0.1:8545 |
| **Backend API**        | 5000 | ✅ Running | http://localhost:5000 |
| **Frontend UI**        | 5173 | ✅ Running | http://localhost:5173 |

### Smart Contracts Deployed

| Contract         | Address                                      |
| ---------------- | -------------------------------------------- |
| **LandRegistry** | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| **Transfer**     | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│                     localhost:5173                           │
│  Dashboard │ Properties │ Transfers │ Register               │
└─────────────┬───────────────────────────────────────────────┘
              │ HTTP
              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Backend API (Express.js)                   │
│                     localhost:5000                           │
│  Auth │ Properties │ Transfers │ Users                       │
└─────────────┬───────────────────────────────────────────────┘
              │ Web3.js
              ↓
┌─────────────────────────────────────────────────────────────┐
│        Blockchain Smart Contracts (Solidity)                │
│            Localhost Hardhat Network (31337)                │
│  LandRegistry │ Transfer │ RBAC │ Storage                   │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Pages

- **Home** (/) - Landing page with project overview
- **Dashboard** (/dashboard) - User's property & transfer overview
- **Properties** (/properties) - Browse all properties
- **Property Details** (/properties/:id) - Single property view
- **Register Property** (/register) - Register new property
- **Transfers** (/transfers) - View user's transfers
- **Transfer Details** (/transfers/:id) - Manage transfer workflow

### API Endpoints

**Authentication**

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

**Properties**

- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Register new property
- `PUT /api/properties/:id` - Update property

**Transfers**

- `GET /api/transfers` - Get user's transfers
- `POST /api/transfers` - Initiate transfer
- `PUT /api/transfers/:id` - Update transfer status

**Users**

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

## 🔧 Configuration Files

### Backend (.env)

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/bharat-registry
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
RPC_URL=http://127.0.0.1:8545
LAND_REGISTRY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
TRANSFER_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

### Frontend (.env)

```
VITE_LAND_REGISTRY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_TRANSFER_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VITE_API_URL=http://localhost:5000
VITE_CHAIN_ID=31337
```

## 📊 Project Structure

```
BharatRegistry/
├── blockchain/
│   ├── contracts/           # Smart Contracts
│   │   ├── ILandRegistry.sol
│   │   ├── ITransfer.sol
│   │   ├── LandRegistry.sol
│   │   └── Transfer.sol
│   ├── scripts/
│   │   └── deploy.js        # Deployment script
│   ├── test/
│   │   ├── LandRegistry.test.js
│   │   └── Transfer.test.js
│   └── hardhat.config.js
│
├── backend/
│   ├── src/
│   │   ├── models/          # MongoDB Models
│   │   │   ├── User.js
│   │   │   ├── Property.js
│   │   │   └── Transaction.js
│   │   ├── routes/          # API Routes
│   │   │   ├── auth.js
│   │   │   ├── property.js
│   │   │   ├── transfer.js
│   │   │   └── user.js
│   │   ├── middleware/      # Express Middleware
│   │   │   ├── auth.js
│   │   │   └── validation.js
│   │   ├── services/        # Business Logic
│   │   │   └── blockchainService.js
│   │   └── app.js           # Express App
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── pages/           # Page Components
    │   │   ├── Home.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Properties.jsx
    │   │   ├── PropertyDetails.jsx
    │   │   ├── RegisterProperty.jsx
    │   │   ├── Transfers.jsx
    │   │   └── TransferDetails.jsx
    │   ├── components/      # Reusable Components
    │   │   ├── layout/
    │   │   │   └── Layout.jsx
    │   │   ├── common/
    │   │   │   ├── Alert.jsx
    │   │   │   └── LoadingSpinner.jsx
    │   │   └── transfer/
    │   │       └── InitiateTransferModal.jsx
    │   ├── hooks/           # Web3 Hooks
    │   │   ├── useContract.js
    │   │   └── useTransfer.js
    │   ├── config/          # Contract ABIs
    │   │   ├── LandRegistryABI.js
    │   │   └── TransferABI.js
    │   ├── utils/
    │   │   └── constants.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── .env
    └── index.html
```

## 🚀 Quick Start

### Terminal 1 - Blockchain

```bash
npm run blockchain    # or: cd blockchain && npm run node
```

### Terminal 2 - Deploy Contracts

```bash
npm run deploy        # or: cd blockchain && npm run deploy:local
```

### Terminal 3 - Backend

```bash
npm run backend       # or: cd backend && npm run dev
```

### Terminal 4 - Frontend

```bash
npm run frontend      # or: cd frontend && npm run dev
```

## 🧪 Testing

Run smart contract tests:

```bash
npm test             # or: cd blockchain && npm test
```

## 🔗 Next Steps

1. **Connect Wallet**: Open frontend and connect with MetaMask/RainbowKit
2. **Add Hardhat Network**: In MetaMask, add localhost:8545 chain (ID: 31337)
3. **Import Accounts**: Use private keys from Hardhat node output
4. **Test Flow**:
   - Register a property
   - Browse properties
   - Initiate transfer
   - Deposit escrow
   - Complete transfer approval workflow

## 📝 Notes

- All data persists in local MongoDB instance
- Smart contracts run on local Hardhat network (31337)
- Use MetaMask to interact with blockchain
- Default test accounts have 10,000 ETH each
- JWT authentication for API endpoints

---

**Project Status**: ✅ **READY FOR TESTING & DEVELOPMENT**
