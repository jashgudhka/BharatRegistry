const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

// Read variables from backend/.env if running from backend root
require("dotenv").config();
const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/bharat-registry";

const dummyUsers = [
  {
    email: "admin@test.com",
    role: "admin",
    walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Hardhat #0
    username: "deployeradmin",
    fullName: "Admin Deployer",
    isVerified: true,
  },
  {
    email: "user@test.com",
    role: "user",
    walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat #1
    username: "testuser",
    fullName: "Test User One",
    isVerified: true,
  },
  {
    email: "user2@test.com",
    role: "user",
    walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Hardhat #2
    username: "testuser2",
    fullName: "Test User Two",
    isVerified: true,
  },
  {
    email: "verifier@test.com",
    role: "verifier",
    walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Hardhat #3
    username: "testverifier",
    fullName: "Test Verifier",
    isVerified: true,
  },
  {
    email: "registrar@test.com",
    role: "registrar",
    walletAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", // Hardhat #4
    username: "testregistrar",
    fullName: "Test Registrar",
    isVerified: true,
  },
  {
    email: "bank@test.com",
    role: "bank",
    walletAddress: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", // Hardhat #5
    username: "testbank",
    fullName: "Test Bank",
    isVerified: true,
  },
  {
    email: "superadmin@test.com",
    role: "super_admin",
    walletAddress: "0x976EA74026E726554dB657fA54763abd0C3a0aa9", // Hardhat #6
    username: "testsuper",
    fullName: "Test Super Admin",
    isVerified: true,
  },
];

async function seed() {
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Password123!", salt);

    console.log("Clearing old test users...");
    await User.deleteMany({ email: { $in: dummyUsers.map((u) => u.email) } });

    console.log("Inserting new test users...");
    for (let u of dummyUsers) {
      await User.create({
        ...u,
        password: hashedPassword,
        registrationComplete: true,
      });
      console.log(`Created user: ${u.email} | Role: ${u.role}`);
    }

    console.log("\n==================================");
    console.log("TEST CREDENTIALS (PASSWORD FOR ALL: Password123!)");
    console.log("==================================");
    dummyUsers.forEach((u) => {
      console.log(`Email: ${u.email}`);
      console.log(`Role: ${u.role}`);
      console.log(`Wallet: ${u.walletAddress}`);
      console.log("----------------------------------");
    });
  } catch (err) {
    console.error("Error connecting to database or seeding:", err);
  } finally {
    mongoose.disconnect();
    console.log("Disconnected.");
  }
}

seed();
