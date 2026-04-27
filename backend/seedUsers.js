const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

// Read variables from backend/.env if running from backend root
require("dotenv").config();
const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/bharat-registry";

const dummyUsers = [
  {
    email: "user@test.com",
    role: "user",
    walletAddress: "0x1111111111111111111111111111111111111111",
    username: "testuser",
    fullName: "Test User",
    isVerified: true,
  },
  {
    email: "admin@test.com",
    role: "admin",
    walletAddress: "0x2222222222222222222222222222222222222222",
    username: "testadmin",
    fullName: "Test Admin",
    isVerified: true,
  },
  {
    email: "verifier@test.com",
    role: "verifier",
    walletAddress: "0x3333333333333333333333333333333333333333",
    username: "testverifier",
    fullName: "Test Verifier",
    isVerified: true,
  },
  {
    email: "registrar@test.com",
    role: "registrar",
    walletAddress: "0x4444444444444444444444444444444444444444",
    username: "testregistrar",
    fullName: "Test Registrar",
    isVerified: true,
  },
  {
    email: "bank@test.com",
    role: "bank",
    walletAddress: "0x5555555555555555555555555555555555555555",
    username: "testbank",
    fullName: "Test Bank",
    isVerified: true,
  },
  {
    email: "superadmin@test.com",
    role: "super_admin",
    walletAddress: "0x6666666666666666666666666666666666666666",
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
