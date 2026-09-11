import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Admin from "../models/Admin.js";
async function run() {
  try {
    await connectDB();
    const email = process.env.ADMIN_EMAIL || "admin@moneai.local";
    if (await Admin.findOne({ email })) {
      console.log(`Admin already exists: ${email}`);
      process.exit(0);
    }
    const a = await Admin.create({
      name: process.env.ADMIN_NAME || "MONE AI Admin",
      email,
      password: process.env.ADMIN_PASSWORD || "ChangeMe123!",
      role: "SUPER_ADMIN",
    });
    console.log("SUPER_ADMIN created");
    console.log(`Email: ${a.email}`);
    console.log("Change the default password before production.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}
run();
 