# 🎯 Bharat Registry - Getting Started Guide

## ✅ System Status

All services are **running and operational**:

- ✅ Blockchain (Hardhat) - http://127.0.0.1:8545
- ✅ Backend API - http://localhost:5000
- ✅ Frontend UI - http://localhost:5173

---

## 🎮 How to Use the Application

### 1. **Set Up Your Wallet**

#### Option A: MetaMask

1. Install [MetaMask browser extension](https://metamask.io)
2. Open MetaMask and click network dropdown
3. Click "Add Network"
4. Fill in:
   - Network Name: `Localhost Hardhat`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`
5. Click Save

#### Option B: Use Hardhat Accounts Directly

The frontend supports direct connection via RainbowKit which auto-detects Hardhat accounts.

### 2. **Import Test Accounts**

Get test accounts from Hardhat node output (when you run `npm run blockchain`):

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

Import these into MetaMask:

1. Click profile icon → Import Account
2. Paste private key (without 0x prefix)
3. Click Import

---

## 🏠 Frontend Walkthrough

### **Home Page** (/)

- Landing page with project overview
- Features and benefits
- How the system works
- "Get Started" button leads to Dashboard

### **Dashboard** (/dashboard)

- Requires wallet connection
- Shows your properties count
- Shows your transfers count
- Quick access to manage properties
- Latest transfers list

### **Properties** (/properties)

- Browse all registered properties
- Filter by status (Pending, Verified, Disputed)
- Search by survey number or location
- Click property to view details

### **Register Property** (/register)

- Fill in property details:
  - Survey Number (e.g., SV-2024-001)
  - Location (address)
  - City & State
  - Area (sq. meters)
  - Market Value (in ETH)
- Optional: Upload documents to IPFS
- Submit to register on blockchain
- Transaction will be sent from your wallet

### **Property Details** (/properties/:id)

- View full property information
- See current owner
- If verified, can initiate purchase
- View transfer history
- Download documents (from IPFS)

### **Initiate Purchase**

1. Click "Initiate Purchase" button
2. Enter agreed price (must be positive)
3. Confirm in wallet
4. Next step: Deposit escrow

### **Transfers** (/transfers)

- View all your transfers (as buyer or seller)
- Filter by status
- Click to manage transfer

### **Transfer Details** (/transfers/:id)

Shows transfer workflow:

1. **Pending** → Buyer deposits escrow
2. **Escrow Deposited** → Seller approves
3. **Seller Approved** → Government approves
4. **Government Approved** → Complete transfer
5. **Completed** ✅

---

## 💻 API Reference

### **Base URL**: http://localhost:5000/api

### **Authentication Routes**

```
POST /auth/register
{
  "walletAddress": "0x...",
  "email": "user@example.com",
  "name": "John Doe"
}

POST /auth/login
{
  "walletAddress": "0x..."
}
```

### **Property Routes**

```
GET /properties                    # Get all properties
GET /properties/:id                # Get property details
POST /properties                   # Register new property
{
  "surveyNumber": "SV-2024-001",
  "location": "123 Main St",
  "area": 1000,
  "marketValue": 10
}

PUT /properties/:id                # Update property
GET /properties/owner/:address     # Get user's properties
```

### **Transfer Routes**

```
GET /transfers                     # Get all transfers
GET /transfers/:id                 # Get transfer details
POST /transfers                    # Initiate transfer
{
  "propertyId": 1,
  "offeredPrice": 9.5
}

PUT /transfers/:id                 # Update transfer status
GET /transfers/property/:id        # Get transfers for property
```

### **User Routes**

```
GET /users/profile                 # Get user profile
PUT /users/profile                 # Update profile
```

---

## 🧪 Test Workflow

### **Complete Property Registration to Transfer**

#### **Step 1: Register a Property**

1. Connect wallet (Account #0)
2. Go to "Register Property"
3. Fill in:
   - Survey Number: `SV-2024-001`
   - Location: `123 Blockchain Street, Mumbai`
   - City: `Mumbai`
   - State: `Maharashtra`
   - Area: `500`
   - Market Value: `5` (ETH)
4. Click "Register Property"
5. Approve transaction in MetaMask
6. Wait for confirmation

#### **Step 2: Verify Property (Optional)**

Switch to admin account and call `verifyProperty(1)`

#### **Step 3: Initiate Transfer**

1. Switch to Account #1 (Buyer)
2. Go to "Properties"
3. Find the property you registered
4. Click "Initiate Purchase"
5. Enter price: `4.8` (ETH)
6. Approve in MetaMask

#### **Step 4: Deposit Escrow**

1. Stay as Account #1
2. Go to "Transfers"
3. Click your transfer
4. Click "Deposit Escrow"
5. Approve transaction (value: 4.8 ETH)

#### **Step 5: Seller Approval**

1. Switch to Account #0 (Seller)
2. Go to "Transfers"
3. Find the transfer
4. Click "Approve Transfer"
5. Approve in MetaMask

#### **Step 6: Government Approval**

1. Can use any account
2. Click "Government Approve"
3. Approve in MetaMask

#### **Step 7: Complete Transfer**

1. Any account can complete
2. Click "Complete Transfer"
3. Property ownership transfers to buyer

---

## 🔧 Troubleshooting

### **"Please connect wallet"**

- Click the "Connect Wallet" button (top right)
- Select your account
- Make sure you're on Localhost Hardhat (31337) network

### **"Contract target is invalid"**

- ✅ **FIXED**: Backend now has proper .env configuration
- Contract addresses are correctly set

### **"Insufficient gas"**

- Make sure you're using a test account with ETH
- All Hardhat test accounts have 10,000 ETH by default

### **"Transaction rejected"**

- Check MetaMask for errors
- Make sure transaction details are correct
- Approve in MetaMask popup

### **"Property not found"**

- Make sure property ID exists
- Check if property was successfully registered
- Try refreshing the page

### **Database connection issues**

- Make sure MongoDB is running
- Check backend terminal for connection errors
- Verify MONGODB_URI in backend/.env

---

## 📊 Project Statistics

| Component              | Details                    |
| ---------------------- | -------------------------- |
| **Smart Contracts**    | 2 (LandRegistry, Transfer) |
| **API Endpoints**      | 15+                        |
| **Frontend Pages**     | 8                          |
| **React Components**   | 10+                        |
| **Solidity Functions** | 20+                        |
| **Test Cases**         | 30+                        |

---

## 🚀 Performance Tips

1. **Local Development**

   - Keep all terminals open (blockchain, backend, frontend)
   - Use MetaMask for faster transactions

2. **Testing**

   - Use test accounts from Hardhat node
   - Don't worry about gas prices (always 1 gwei)

3. **Database**
   - MongoDB stores user data
   - Blockchain stores property & transfer data

---

## 📚 Documentation

- [Project README](./README.md)
- [Project Status](./PROJECT_STATUS.md)
- [Smart Contracts](./blockchain/contracts/)
- [Backend API](./backend/src/routes/)
- [Frontend Components](./frontend/src/components/)

---

## 🎓 Learning Resources

- [Solidity Documentation](https://docs.soliditylang.org/)
- [Hardhat Docs](https://hardhat.org/docs)
- [Ethers.js Guide](https://docs.ethers.org/)
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [wagmi Hooks](https://wagmi.sh/)

---

## 💡 Next Steps

1. ✅ Test the complete workflow above
2. Deploy to testnet (Sepolia)
3. Add more property types
4. Implement property search/filter
5. Add payment integration
6. Deploy frontend to production
7. Setup monitoring & logging
8. Add notification system

---

**Happy Coding! 🚀**

For issues or questions, check the terminal outputs or debug tools.
